/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLICY AUDIT LOGGER (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Structured audit logger for policy decisions. Uses an in-memory ring
 * buffer (no Firestore writes) to keep hash chain safe.
 *
 * @module coreos/brain/policy/policyAudit
 */

import type { PolicyAuditEvent, PolicyAuditEventType } from './policyTypes';

// ═══════════════════════════════════════════════════════════════════════════
// RING BUFFER CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const MAX_EVENTS = 100;

// ═══════════════════════════════════════════════════════════════════════════
// POLICY AUDIT LOGGER
// ═══════════════════════════════════════════════════════════════════════════

export class PolicyAuditLogger {
    private events: PolicyAuditEvent[] = [];

    /**
     * Record a policy audit event.
     * Structured console output + in-memory ring buffer.
     */
    record(event: PolicyAuditEvent): void {
        // Structured console output
        const prefix = this.getEventPrefix(event.eventType);
        console.log(
            `[PolicyAudit] ${prefix} | ${event.correlationId || 'system'} | ` +
            `tool=${event.toolName} scope=${event.appScope} ` +
            `decision=${event.decision || 'N/A'} risk=${event.riskLevel || 'N/A'} ` +
            `actor=${event.actorRole}`
        );

        if (event.reasons && event.reasons.length > 0) {
            const blocking = event.reasons.filter(r => r.blocking);
            if (blocking.length > 0) {
                console.log(`[PolicyAudit]   ↳ Blocked by: ${blocking.map(r => `${r.ruleId}: ${r.message}`).join('; ')}`);
            }
        }

        // Ring buffer storage
        this.events.push(event);
        if (this.events.length > MAX_EVENTS) {
            this.events.shift();
        }
    }

    /**
     * Get recent audit events.
     * @param limit - Maximum number of events to return (default: 10)
     */
    getRecentEvents(limit: number = 10): PolicyAuditEvent[] {
        return this.events.slice(-limit);
    }

    /**
     * Get all events (for diagnostics).
     */
    getAllEvents(): PolicyAuditEvent[] {
        return [...this.events];
    }

    /**
     * Get event count by type.
     */
    getEventCounts(): Record<PolicyAuditEventType, number> {
        const counts: Partial<Record<PolicyAuditEventType, number>> = {};
        for (const event of this.events) {
            counts[event.eventType] = (counts[event.eventType] || 0) + 1;
        }
        return counts as Record<PolicyAuditEventType, number>;
    }

    /**
     * Get summary statistics for Ops UI.
     */
    getSummary(): {
        totalEvents: number;
        allowed: number;
        blocked: number;
        replayBlocked: number;
        hashMismatches: number;
        rateLimitHits: number;
        recentEvents: PolicyAuditEvent[];
    } {
        const counts = this.getEventCounts();
        return {
            totalEvents: this.events.length,
            allowed: counts['EXECUTION_ALLOWED'] || 0,
            blocked: (counts['EXECUTION_BLOCKED'] || 0) +
                (counts['FIREWALL_BLOCKED'] || 0) +
                (counts['GUARD_BLOCKED'] || 0),
            replayBlocked: counts['NONCE_REPLAY_BLOCKED'] || 0,
            hashMismatches: counts['ARGS_HASH_MISMATCH'] || 0,
            rateLimitHits: counts['RATE_LIMIT_HIT'] || 0,
            recentEvents: this.getRecentEvents(5),
        };
    }

    /**
     * Generate Evidence Pack as Markdown (no secrets leaked).
     */
    generateEvidencePack(): string {
        const summary = this.getSummary();
        const now = new Date().toISOString();

        let md = `# Runtime Isolation — Evidence Pack\n`;
        md += `Generated: ${now}\n\n`;
        md += `## Summary\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Total Events | ${summary.totalEvents} |\n`;
        md += `| Allowed | ${summary.allowed} |\n`;
        md += `| Blocked | ${summary.blocked} |\n`;
        md += `| Replay Blocked | ${summary.replayBlocked} |\n`;
        md += `| Hash Mismatches | ${summary.hashMismatches} |\n`;
        md += `| Rate Limit Hits | ${summary.rateLimitHits} |\n\n`;

        md += `## Recent Events (last 5)\n`;
        md += `| Time | Type | Tool | Scope | Decision |\n`;
        md += `|------|------|------|-------|----------|\n`;
        for (const event of summary.recentEvents) {
            const time = new Date(event.timestamp).toISOString().slice(11, 19);
            md += `| ${time} | ${event.eventType} | ${event.toolName} | ${event.appScope} | ${event.decision || 'N/A'} |\n`;
        }

        md += `\n---\n`;
        md += `Policy Version: 35C.1 | Defense-in-depth: Gateway + Worker\n`;

        return md;
    }

    /**
     * Clear all events (for testing).
     */
    clear(): void {
        this.events = [];
    }

    private getEventPrefix(eventType: PolicyAuditEventType): string {
        switch (eventType) {
            case 'EXECUTION_ALLOWED': return '✅ ALLOWED';
            case 'EXECUTION_BLOCKED': return '🛑 BLOCKED';
            case 'FIREWALL_BLOCKED': return '🔥 FIREWALL';
            case 'GUARD_BLOCKED': return '🛡️ GUARD';
            case 'NONCE_REPLAY_BLOCKED': return '🔄 REPLAY';
            case 'ARGS_HASH_MISMATCH': return '⚠️ HASH';
            case 'RATE_LIMIT_HIT': return '⏱️ RATE';
            case 'POLICY_EVAL': return '📋 EVAL';
            default: return '❓ UNKNOWN';
        }
    }
}

/** Singleton instance */
export const policyAuditLogger = new PolicyAuditLogger();
