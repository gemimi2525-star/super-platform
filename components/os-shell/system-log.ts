/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — System Log (V3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * In-memory log of governance decisions for debugging.
 * 
 * @module components/os-shell/system-log
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DecisionLogEntry {
    timestamp: number;
    action: string;
    capabilityId: string;
    decision: 'ALLOW' | 'DENY' | 'SKIP';
    reasonChain?: string[];
    failedRule?: string;
    correlationId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOG STORAGE
// ═══════════════════════════════════════════════════════════════════════════

const MAX_LOG_ENTRIES = 50;
const decisionLog: DecisionLogEntry[] = [];
const listeners: Set<() => void> = new Set();

/**
 * Add a decision log entry
 */
export function addDecisionLog(entry: DecisionLogEntry): void {
    decisionLog.unshift(entry);

    // Trim to max entries
    while (decisionLog.length > MAX_LOG_ENTRIES) {
        decisionLog.pop();
    }

    // Notify listeners
    listeners.forEach(listener => listener());
}

/**
 * Get all decision log entries
 */
export function getDecisionLog(): readonly DecisionLogEntry[] {
    return decisionLog;
}

/**
 * Clear the decision log
 */
export function clearDecisionLog(): void {
    decisionLog.length = 0;
    listeners.forEach(listener => listener());
}

/**
 * Subscribe to log changes
 */
export function subscribeToLog(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
