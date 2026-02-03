/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6.5.2: Alert Rule Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Deterministic threshold-based alert detection.
 * Evaluates logs against rules and generates alerts.
 * 
 * ⚠️ GOVERNANCE GUARANTEE:
 * - OBSERVE ONLY
 * - NO auto-remediation
 * - NO policy changes
 * - NO SYNAPSE kernel modifications
 */

import type { Alert, AlertRule, AlertRuleId, AlertSummary, LogSource } from './types';
import { countLogsInWindow, getLogsInWindow } from './log-aggregator';

// ═══════════════════════════════════════════════════════════════════════════
// ALERT RULES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ALERT_RULES: AlertRule[] = [
    {
        id: 'auth_failure_spike',
        name: 'Authentication Failure Spike',
        description: 'Elevated login failure rate detected',
        severity: 'warn',
        threshold: 5,
        windowMs: 60_000, // 60 seconds
        eventPattern: 'auth_failure',
    },
    {
        id: 'auth_failure_critical',
        name: 'Authentication Failure Critical',
        description: 'Critical login failure rate - possible attack',
        severity: 'critical',
        threshold: 10,
        windowMs: 60_000,
        eventPattern: 'auth_failure',
    },
    {
        id: 'rate_limit_abuse',
        name: 'Rate Limit Abuse',
        description: 'Excessive rate limit violations detected',
        severity: 'warn',
        threshold: 10,
        windowMs: 60_000,
        eventPattern: 'rate_limit_429',
    },
    {
        id: 'api_latency_spike',
        name: 'API Latency Spike',
        description: 'API response times exceeding threshold',
        severity: 'warn',
        threshold: 5, // 5 slow requests
        windowMs: 60_000,
        eventPattern: 'api_latency_high',
    },
    {
        id: 'audit_write_failure',
        name: 'Audit Write Failure',
        description: 'Governance audit log write failure - critical integrity issue',
        severity: 'critical',
        threshold: 1, // Any failure is critical
        windowMs: 300_000, // 5 minutes
        eventPattern: 'audit_write_error',
    },
    {
        id: 'error_rate_spike',
        name: 'Error Rate Spike',
        description: '5xx error rate exceeding threshold',
        severity: 'critical',
        threshold: 5,
        windowMs: 60_000,
        eventPattern: 'error_5xx',
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// ALERT STORAGE (In-Memory)
// ═══════════════════════════════════════════════════════════════════════════

const activeAlerts: Map<AlertRuleId, Alert> = new Map();
const alertHistory: Alert[] = [];
const MAX_HISTORY = 100;
const ALERT_COOLDOWN_MS = 60_000; // Don't re-trigger same alert within 1 minute
const lastAlertTime: Map<AlertRuleId, number> = new Map();

let alertIdCounter = 0;

function generateAlertId(): string {
    alertIdCounter++;
    return `alert_${Date.now()}_${alertIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT EVALUATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evaluate all rules and generate/update alerts
 * Should be called periodically or on new log entry
 */
export function evaluateAlerts(): Alert[] {
    const newAlerts: Alert[] = [];
    const now = Date.now();

    for (const rule of ALERT_RULES) {
        const count = countLogsInWindow(rule.windowMs, {
            event: rule.eventPattern,
        });

        // Check if threshold exceeded
        if (count >= rule.threshold) {
            // Check cooldown - don't spam alerts
            const lastTime = lastAlertTime.get(rule.id) || 0;
            if (now - lastTime < ALERT_COOLDOWN_MS) {
                continue;
            }

            // Get correlated request IDs
            const correlatedLogs = getLogsInWindow(rule.windowMs).filter(
                log => log.event.includes(rule.eventPattern)
            );
            const correlatedRequestIds = [...new Set(correlatedLogs.map(l => l.requestId))];

            // Determine source based on logs
            const sources = [...new Set(correlatedLogs.map(l => l.source))];
            const primarySource: LogSource = sources[0] || 'api';

            // Create alert
            const alert: Alert = {
                id: generateAlertId(),
                ruleId: rule.id,
                severity: rule.severity,
                message: `${rule.name}: ${count} events in last ${rule.windowMs / 1000}s (threshold: ${rule.threshold})`,
                source: primarySource,
                timestamp: new Date().toISOString(),
                correlatedRequestIds: correlatedRequestIds.slice(0, 10), // Limit to 10
                acknowledged: false, // Always false - READ-ONLY
            };

            // Update active alerts
            activeAlerts.set(rule.id, alert);

            // Add to history
            alertHistory.unshift(alert);
            while (alertHistory.length > MAX_HISTORY) {
                alertHistory.pop();
            }

            // Update cooldown
            lastAlertTime.set(rule.id, now);

            newAlerts.push(alert);
        } else {
            // Clear active alert if below threshold
            activeAlerts.delete(rule.id);
        }
    }

    return newAlerts;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all active alerts
 */
export function getActiveAlerts(): Alert[] {
    return Array.from(activeAlerts.values()).sort((a, b) => {
        // Sort by severity (critical first), then by timestamp
        const severityOrder = { critical: 0, warn: 1, info: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.localeCompare(a.timestamp);
    });
}

/**
 * Get alert history (most recent first)
 */
export function getAlertHistory(limit: number = 50): Alert[] {
    return alertHistory.slice(0, limit);
}

/**
 * Get alerts by severity
 */
export function getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return alertHistory.filter(a => a.severity === severity);
}

/**
 * Get alert summary
 */
export function getAlertSummary(): AlertSummary {
    const active = getActiveAlerts();
    return {
        critical: active.filter(a => a.severity === 'critical').length,
        warn: active.filter(a => a.severity === 'warn').length,
        info: active.filter(a => a.severity === 'info').length,
        total: active.length,
    };
}

/**
 * Get all rule definitions (for display)
 */
export function getAlertRules(): AlertRule[] {
    return [...ALERT_RULES];
}

/**
 * Clear all alerts (for testing)
 */
export function clearAlerts(): void {
    activeAlerts.clear();
    alertHistory.length = 0;
    lastAlertTime.clear();
}

/**
 * Trigger evaluation and return new alerts
 * Should be called periodically or on significant events
 */
export function checkAndGenerateAlerts(): {
    newAlerts: Alert[];
    activeAlerts: Alert[];
    summary: AlertSummary;
} {
    const newAlerts = evaluateAlerts();
    return {
        newAlerts,
        activeAlerts: getActiveAlerts(),
        summary: getAlertSummary(),
    };
}
