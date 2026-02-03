/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6.5.2: Operational Intelligence Module
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central export for operational observability.
 */

// Types
export type {
    OperationalLog,
    LogSource,
    LogSeverity,
    Alert,
    AlertSeverity,
    AlertRuleId,
    AlertRule,
    AlertSummary,
    AlertsResponse,
} from './types';

// Log Aggregator
export {
    addLog,
    getLogsByRequestId,
    getLogsBySeverity,
    getLogsBySource,
    getLogsByEvent,
    getRecentLogs,
    getLogsInWindow,
    countLogsInWindow,
    getStats as getLogStats,
    clearLogs,
} from './log-aggregator';

// Alert Engine
export {
    evaluateAlerts,
    getActiveAlerts,
    getAlertHistory,
    getAlertsBySeverity,
    getAlertSummary,
    getAlertRules,
    clearAlerts,
    checkAndGenerateAlerts,
} from './alert-engine';
