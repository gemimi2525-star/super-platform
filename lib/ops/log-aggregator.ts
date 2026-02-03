/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6.5.2: Log Aggregation Layer
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * In-memory ring buffer for operational logs.
 * Provides correlation and query capabilities for observability.
 * 
 * OBSERVE ONLY — No auto-remediation or governance bypass.
 * 
 * Note: In serverless environments (Vercel), this state is per-lambda-instance.
 * For global aggregation, would need Redis/Upstash. Current implementation
 * provides per-instance visibility which is still valuable for debugging.
 */

import type { OperationalLog, LogSource, LogSeverity } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MAX_LOGS = 1000;          // Maximum logs to keep
const TTL_MS = 5 * 60 * 1000;   // 5 minute TTL

// ═══════════════════════════════════════════════════════════════════════════
// RING BUFFER STORAGE
// ═══════════════════════════════════════════════════════════════════════════

const logBuffer: OperationalLog[] = [];
let logIdCounter = 0;

/**
 * Generate unique log ID
 */
function generateLogId(): string {
    logIdCounter++;
    return `log_${Date.now()}_${logIdCounter}`;
}

/**
 * Cleanup expired logs (TTL enforcement)
 */
function cleanupExpiredLogs(): void {
    const cutoff = Date.now() - TTL_MS;
    const cutoffISO = new Date(cutoff).toISOString();

    // Remove logs older than TTL
    while (logBuffer.length > 0 && logBuffer[0].timestamp < cutoffISO) {
        logBuffer.shift();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add a log entry to the aggregator
 */
export function addLog(
    requestId: string,
    source: LogSource,
    severity: LogSeverity,
    event: string,
    data: Record<string, unknown> = {}
): OperationalLog {
    cleanupExpiredLogs();

    const log: OperationalLog = {
        id: generateLogId(),
        requestId,
        timestamp: new Date().toISOString(),
        source,
        severity,
        event,
        data,
    };

    // Add to buffer
    logBuffer.push(log);

    // Enforce max size (ring buffer)
    while (logBuffer.length > MAX_LOGS) {
        logBuffer.shift();
    }

    return log;
}

/**
 * Get logs by request ID (for correlation)
 */
export function getLogsByRequestId(requestId: string): OperationalLog[] {
    cleanupExpiredLogs();
    return logBuffer.filter(log => log.requestId === requestId);
}

/**
 * Get logs by severity
 */
export function getLogsBySeverity(severity: LogSeverity): OperationalLog[] {
    cleanupExpiredLogs();
    return logBuffer.filter(log => log.severity === severity);
}

/**
 * Get logs by source
 */
export function getLogsBySource(source: LogSource): OperationalLog[] {
    cleanupExpiredLogs();
    return logBuffer.filter(log => log.source === source);
}

/**
 * Get logs by event pattern (partial match)
 */
export function getLogsByEvent(eventPattern: string): OperationalLog[] {
    cleanupExpiredLogs();
    return logBuffer.filter(log => log.event.includes(eventPattern));
}

/**
 * Get recent logs (most recent first)
 */
export function getRecentLogs(limit: number = 50): OperationalLog[] {
    cleanupExpiredLogs();
    return [...logBuffer].reverse().slice(0, limit);
}

/**
 * Get logs within time window
 */
export function getLogsInWindow(windowMs: number): OperationalLog[] {
    cleanupExpiredLogs();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    return logBuffer.filter(log => log.timestamp >= cutoff);
}

/**
 * Count logs matching criteria within time window
 */
export function countLogsInWindow(
    windowMs: number,
    criteria: {
        event?: string;
        severity?: LogSeverity;
        source?: LogSource;
    }
): number {
    const logs = getLogsInWindow(windowMs);

    return logs.filter(log => {
        if (criteria.event && !log.event.includes(criteria.event)) return false;
        if (criteria.severity && log.severity !== criteria.severity) return false;
        if (criteria.source && log.source !== criteria.source) return false;
        return true;
    }).length;
}

/**
 * Get buffer statistics
 */
export function getStats(): {
    totalLogs: number;
    oldestTimestamp: string | null;
    newestTimestamp: string | null;
    bySeverity: Record<LogSeverity, number>;
    bySource: Record<LogSource, number>;
} {
    cleanupExpiredLogs();

    const bySeverity: Record<LogSeverity, number> = { info: 0, warn: 0, error: 0, critical: 0 };
    const bySource: Record<LogSource, number> = { edge: 0, middleware: 0, api: 0 };

    for (const log of logBuffer) {
        bySeverity[log.severity]++;
        bySource[log.source]++;
    }

    return {
        totalLogs: logBuffer.length,
        oldestTimestamp: logBuffer[0]?.timestamp || null,
        newestTimestamp: logBuffer[logBuffer.length - 1]?.timestamp || null,
        bySeverity,
        bySource,
    };
}

/**
 * Clear all logs (for testing)
 */
export function clearLogs(): void {
    logBuffer.length = 0;
}
