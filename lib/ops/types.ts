/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6.5.2: Operational Intelligence Types
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Type definitions for log aggregation and alerting system.
 * OBSERVE ONLY — No auto-remediation or governance bypass.
 */

// ═══════════════════════════════════════════════════════════════════════════
// LOG TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type LogSource = 'edge' | 'middleware' | 'api';
export type LogSeverity = 'info' | 'warn' | 'error' | 'critical';

export interface OperationalLog {
    id: string;
    requestId: string;
    timestamp: string;
    source: LogSource;
    severity: LogSeverity;
    event: string;
    data: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AlertSeverity = 'info' | 'warn' | 'critical';

export type AlertRuleId =
    | 'auth_failure_spike'
    | 'auth_failure_critical'
    | 'rate_limit_abuse'
    | 'api_latency_spike'
    | 'audit_write_failure'
    | 'error_rate_spike';

export interface Alert {
    id: string;
    ruleId: AlertRuleId;
    severity: AlertSeverity;
    message: string;
    source: LogSource;
    timestamp: string;
    correlatedRequestIds: string[];
    // Always false — READ-ONLY system, no acknowledgment
    acknowledged: false;
}

export interface AlertRule {
    id: AlertRuleId;
    name: string;
    description: string;
    severity: AlertSeverity;
    threshold: number;
    windowMs: number; // Time window for threshold
    eventPattern: string; // Event pattern to match
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AlertSummary {
    critical: number;
    warn: number;
    info: number;
    total: number;
}

export interface AlertsResponse {
    alerts: Alert[];
    summary: AlertSummary;
    timestamp: string;
}
