/**
 * Structured Logger
 * 
 * Provides consistent, structured logging across MW/API/UI.
 * Part of Phase 11: Production Hardening
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogScope = 'MW' | 'API' | 'UI' | 'CIRCUIT' | 'AUTH' | 'INVARIANT' | 'OPS';

export interface LogEntry {
    level: LogLevel;
    scope: LogScope;
    msg: string;
    traceId?: string;
    path?: string;
    method?: string;
    authMode?: string;
    code?: string;
    durationMs?: number;
    extra?: Record<string, unknown>;
}

export interface StructuredLog {
    timestamp: string;
    level: LogLevel;
    scope: LogScope;
    message: string;
    traceId?: string;
    path?: string;
    method?: string;
    authMode?: string;
    code?: string;
    durationMs?: number;
    environment: string;
    [key: string]: unknown;
}

// ============================================================================
// Configuration
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function getMinLogLevel(): LogLevel {
    if (process.env.NODE_ENV === 'production') {
        return 'info';
    }
    return 'debug';
}

function shouldLog(level: LogLevel): boolean {
    const minLevel = getMinLogLevel();
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

// ============================================================================
// Formatters
// ============================================================================

function formatStructured(entry: LogEntry): StructuredLog {
    const log: StructuredLog = {
        timestamp: new Date().toISOString(),
        level: entry.level,
        scope: entry.scope,
        message: entry.msg,
        environment: process.env.NODE_ENV || 'development',
    };

    if (entry.traceId) log.traceId = entry.traceId;
    if (entry.path) log.path = entry.path;
    if (entry.method) log.method = entry.method;
    if (entry.authMode) log.authMode = entry.authMode;
    if (entry.code) log.code = entry.code;
    if (entry.durationMs !== undefined) log.durationMs = entry.durationMs;

    // Add any extra fields
    if (entry.extra) {
        Object.assign(log, entry.extra);
    }

    return log;
}

function formatDev(entry: LogEntry): string {
    const prefix = `[${entry.scope}]`;
    const trace = entry.traceId ? ` (${entry.traceId.substring(0, 8)})` : '';
    const path = entry.path ? ` ${entry.method || 'GET'} ${entry.path}` : '';
    const code = entry.code ? ` [${entry.code}]` : '';
    const duration = entry.durationMs !== undefined ? ` ${entry.durationMs}ms` : '';

    return `${prefix}${trace}${path}${code}${duration} ${entry.msg}`;
}

// ============================================================================
// Core Logger
// ============================================================================

/**
 * Log a structured entry.
 */
export function log(entry: LogEntry): void {
    if (!shouldLog(entry.level)) {
        return;
    }

    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
        // Production: JSON output
        const structured = formatStructured(entry);
        console[entry.level](JSON.stringify(structured));
    } else {
        // Development: human-readable
        const message = formatDev(entry);
        console[entry.level](message);
    }
}

// ============================================================================
// Convenience Methods
// ============================================================================

export function debug(scope: LogScope, msg: string, extra?: Partial<LogEntry>): void {
    log({ level: 'debug', scope, msg, ...extra });
}

export function info(scope: LogScope, msg: string, extra?: Partial<LogEntry>): void {
    log({ level: 'info', scope, msg, ...extra });
}

export function warn(scope: LogScope, msg: string, extra?: Partial<LogEntry>): void {
    log({ level: 'warn', scope, msg, ...extra });
}

export function error(scope: LogScope, msg: string, extra?: Partial<LogEntry>): void {
    log({ level: 'error', scope, msg, ...extra });
}

// ============================================================================
// Request Logger
// ============================================================================

/**
 * Log an API request completion.
 */
export function logRequest(
    scope: LogScope,
    path: string,
    method: string,
    statusCode: number,
    durationMs: number,
    extra?: Partial<LogEntry>
): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const msg = `${statusCode}`;

    log({
        level,
        scope,
        msg,
        path,
        method,
        durationMs,
        ...extra,
    });
}
