/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GOVERNANCE REACTION ENGINE (Phase 35D — Autonomous Governance Enforcement)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Autonomous enforcement engine that transitions from detect → enforce.
 * Receives policy events and integrity results, evaluates thresholds,
 * and autonomously takes graduated actions:
 *
 *   NORMAL → THROTTLED → SOFT_LOCK → HARD_FREEZE
 *
 * Triggers:
 *   A) Integrity Failure → HARD_FREEZE
 *   B) Policy Violation Burst → THROTTLE_RATE
 *   C) Nonce Replay Flood → SOFT_LOCK (60s)
 *   D) Ledger SHA Mismatch → BLOCK_PROMOTION
 *
 * All state is in-memory (no Firestore writes, hash chain safe).
 *
 * @module coreos/brain/policy/governanceReactionEngine
 */

import type {
    GovernanceMode,
    GovernanceState,
    GovernanceReaction,
    GovernanceTrigger,
    GovernanceThresholds,
} from './governanceTypes';
import { DEFAULT_GOVERNANCE_THRESHOLDS } from './governanceTypes';
import { policyAuditLogger } from './policyAudit';

// ═══════════════════════════════════════════════════════════════════════════
// SLIDING WINDOW TRACKER
// ═══════════════════════════════════════════════════════════════════════════

/** Tracks timestamps of events within a sliding window */
class SlidingWindowCounter {
    private timestamps: number[] = [];

    constructor(private readonly windowMs: number) { }

    /** Record an event now */
    record(): void {
        this.timestamps.push(Date.now());
        this.cleanup();
    }

    /** Get count of events within the window */
    count(): number {
        this.cleanup();
        return this.timestamps.length;
    }

    /** Reset counter */
    reset(): void {
        this.timestamps = [];
    }

    private cleanup(): void {
        const cutoff = Date.now() - this.windowMs;
        this.timestamps = this.timestamps.filter(ts => ts > cutoff);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE REACTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class GovernanceReactionEngine {
    private state: GovernanceState;
    private reactions: GovernanceReaction[] = [];
    private readonly maxReactions = 50;
    private readonly thresholds: GovernanceThresholds;

    // Sliding window counters
    private policyDenyCounter: SlidingWindowCounter;
    private nonceReplayCounter: SlidingWindowCounter;

    constructor(thresholds?: Partial<GovernanceThresholds>) {
        this.thresholds = { ...DEFAULT_GOVERNANCE_THRESHOLDS, ...thresholds };

        this.policyDenyCounter = new SlidingWindowCounter(this.thresholds.windowMs);
        this.nonceReplayCounter = new SlidingWindowCounter(this.thresholds.windowMs);

        // Initial state: NORMAL
        this.state = {
            mode: 'NORMAL',
            reason: 'System initialized — governance engine active',
            triggeredAt: Date.now(),
            triggeredBy: 'SYSTEM_INIT',
            violationCounts: {
                policyDeny: 0,
                nonceReplay: 0,
                integrityFail: 0,
                ledgerMismatch: 0,
            },
            lastIntegrityCheck: null,
            promotionBlocked: false,
            lockExpiresAt: 0,
        };
    }

    // ═════════════════════════════════════════════════════════════════════
    // TRIGGER A: INTEGRITY FAILURE → HARD_FREEZE
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Evaluate an integrity check result.
     * If hash is invalid or kernel is not frozen → HARD_FREEZE immediately.
     */
    evaluateIntegrity(result: {
        hashValid: boolean;
        kernelFrozen: boolean;
        errorCodes?: string[];
    }): GovernanceReaction | null {
        // Update last integrity check record
        this.state.lastIntegrityCheck = {
            hashValid: result.hashValid,
            kernelFrozen: result.kernelFrozen,
            checkedAt: Date.now(),
        };

        const hasFailure = !result.hashValid
            || !result.kernelFrozen
            || (result.errorCodes && result.errorCodes.length > 0);

        if (!hasFailure) return null;

        this.state.violationCounts.integrityFail++;

        const reasons: string[] = [];
        if (!result.hashValid) reasons.push('hashValid=false');
        if (!result.kernelFrozen) reasons.push('kernelFrozen=false');
        if (result.errorCodes?.length) reasons.push(`errorCodes=[${result.errorCodes.join(',')}]`);

        const detail = `Integrity failure detected: ${reasons.join(', ')}`;

        return this.transitionMode(
            'HARD_FREEZE',
            'INTEGRITY_FAILURE',
            detail,
            ['HARD_FREEZE', 'ALERT_OWNER'],
            'CRITICAL',
        );
    }

    // ═════════════════════════════════════════════════════════════════════
    // TRIGGER B: POLICY VIOLATION BURST → THROTTLE
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Record a policy violation. If violations exceed threshold → THROTTLE.
     */
    recordPolicyDeny(): GovernanceReaction | null {
        this.policyDenyCounter.record();
        this.state.violationCounts.policyDeny++;

        const count = this.policyDenyCounter.count();

        if (count > this.thresholds.policyBurstLimit) {
            // Only escalate if not already HARD_FREEZE
            if (this.state.mode === 'HARD_FREEZE') return null;

            return this.transitionMode(
                'THROTTLED',
                'POLICY_BURST',
                `Policy violation burst: ${count} denials in ${this.thresholds.windowMs / 1000}s (threshold: ${this.thresholds.policyBurstLimit})`,
                ['THROTTLE_RATE', 'ALERT_OWNER'],
                'HIGH',
            );
        }

        return null;
    }

    // ═════════════════════════════════════════════════════════════════════
    // TRIGGER C: NONCE REPLAY FLOOD → SOFT_LOCK
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Record a nonce replay event. If replays exceed threshold → SOFT_LOCK.
     */
    recordNonceReplay(): GovernanceReaction | null {
        this.nonceReplayCounter.record();
        this.state.violationCounts.nonceReplay++;

        const count = this.nonceReplayCounter.count();

        if (count > this.thresholds.nonceReplayLimit) {
            // Don't downgrade from HARD_FREEZE
            if (this.state.mode === 'HARD_FREEZE') return null;

            return this.transitionMode(
                'SOFT_LOCK',
                'NONCE_REPLAY_FLOOD',
                `Nonce replay flood: ${count} replays in ${this.thresholds.windowMs / 1000}s (threshold: ${this.thresholds.nonceReplayLimit})`,
                ['SOFT_LOCK', 'ALERT_OWNER'],
                'HIGH',
            );
        }

        return null;
    }

    // ═════════════════════════════════════════════════════════════════════
    // TRIGGER D: LEDGER MISMATCH → BLOCK_PROMOTION
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Check if build SHA matches latest ledger snapshot SHA.
     * Mismatch → BLOCK_PROMOTION.
     */
    checkLedgerParity(buildSha: string, ledgerSha: string): GovernanceReaction | null {
        if (!buildSha || !ledgerSha) return null;

        if (buildSha === ledgerSha) {
            // Parity OK — clear any existing promotion block
            if (this.state.promotionBlocked) {
                this.state.promotionBlocked = false;
                policyAuditLogger.record({
                    eventType: 'GOVERNANCE_BLOCK_PROMOTION',
                    timestamp: Date.now(),
                    correlationId: 'governance-ledger-check',
                    toolName: 'system',
                    appScope: 'governance',
                    actorRole: 'system',
                    metadata: { action: 'UNBLOCK', buildSha, ledgerSha },
                });
            }
            return null;
        }

        // Mismatch detected
        this.state.violationCounts.ledgerMismatch++;
        this.state.promotionBlocked = true;

        const detail = `Ledger SHA mismatch: build=${buildSha.substring(0, 7)} ≠ ledger=${ledgerSha.substring(0, 7)}`;

        const reaction: GovernanceReaction = {
            trigger: 'LEDGER_MISMATCH',
            actions: ['BLOCK_PROMOTION', 'ALERT_OWNER'],
            severity: 'HIGH',
            timestamp: Date.now(),
            detail,
            previousMode: this.state.mode,
            newMode: this.state.mode, // mode doesn't change, only promotion blocked
        };

        this.pushReaction(reaction);

        policyAuditLogger.record({
            eventType: 'GOVERNANCE_BLOCK_PROMOTION',
            timestamp: Date.now(),
            correlationId: 'governance-ledger-check',
            toolName: 'system',
            appScope: 'governance',
            actorRole: 'system',
            metadata: { buildSha, ledgerSha, action: 'BLOCK' },
        });

        console.log(`[Governance] 🚫 BLOCK_PROMOTION: ${detail}`);

        return reaction;
    }

    // ═════════════════════════════════════════════════════════════════════
    // EXECUTION GATE
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Check if execution is currently allowed.
     * Called by WorkerGuard (defense-in-depth) and Gateway.
     *
     * Returns false if:
     * - Mode is HARD_FREEZE
     * - Mode is SOFT_LOCK and lock hasn't expired
     */
    isExecutionAllowed(): { allowed: boolean; reason: string } {
        // Check soft-lock expiry
        if (this.state.mode === 'SOFT_LOCK' && this.state.lockExpiresAt > 0) {
            if (Date.now() > this.state.lockExpiresAt) {
                // Lock expired — auto-transition back to NORMAL
                this.state.mode = 'NORMAL';
                this.state.reason = 'Soft-lock expired — returned to NORMAL';
                this.state.triggeredAt = Date.now();
                this.state.triggeredBy = 'SYSTEM_INIT';
                this.state.lockExpiresAt = 0;
                console.log('[Governance] ⏰ SOFT_LOCK expired → NORMAL');
            }
        }

        switch (this.state.mode) {
            case 'HARD_FREEZE':
                return {
                    allowed: false,
                    reason: `HARD_FREEZE: ${this.state.reason}`,
                };
            case 'SOFT_LOCK':
                return {
                    allowed: false,
                    reason: `SOFT_LOCK: ${this.state.reason} (expires: ${new Date(this.state.lockExpiresAt).toISOString()})`,
                };
            case 'THROTTLED':
            case 'NORMAL':
            default:
                return { allowed: true, reason: 'OK' };
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // OWNER OVERRIDE
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Owner manual override — reset to specified mode (usually NORMAL).
     */
    ownerOverride(targetMode: GovernanceMode): GovernanceReaction {
        const previousMode = this.state.mode;

        this.state.mode = targetMode;
        this.state.reason = `Owner manual override → ${targetMode}`;
        this.state.triggeredAt = Date.now();
        this.state.triggeredBy = 'OWNER_OVERRIDE';
        this.state.lockExpiresAt = 0;

        if (targetMode === 'NORMAL') {
            // Reset counters on full reset
            this.policyDenyCounter.reset();
            this.nonceReplayCounter.reset();
            this.state.promotionBlocked = false;
        }

        const reaction: GovernanceReaction = {
            trigger: 'INTEGRITY_FAILURE', // placeholder — override isn't a specific trigger
            actions: ['ALERT_OWNER'],
            severity: 'MEDIUM',
            timestamp: Date.now(),
            detail: `Owner override: ${previousMode} → ${targetMode}`,
            previousMode,
            newMode: targetMode,
        };

        this.pushReaction(reaction);

        policyAuditLogger.record({
            eventType: 'GOVERNANCE_OVERRIDE',
            timestamp: Date.now(),
            correlationId: 'governance-owner-override',
            toolName: 'system',
            appScope: 'governance',
            actorRole: 'owner',
            metadata: { previousMode, newMode: targetMode },
        });

        console.log(`[Governance] 🔓 OWNER OVERRIDE: ${previousMode} → ${targetMode}`);

        return reaction;
    }

    // ═════════════════════════════════════════════════════════════════════
    // STATE ACCESSORS
    // ═════════════════════════════════════════════════════════════════════

    /** Get current governance state (read-only copy) */
    getState(): GovernanceState {
        // Check soft-lock expiry before returning
        this.isExecutionAllowed();
        return { ...this.state };
    }

    /** Get recent reaction events */
    getReactionLog(limit: number = 10): GovernanceReaction[] {
        return this.reactions.slice(-limit);
    }

    /** Get violation counter snapshot */
    getViolationCounts(): GovernanceState['violationCounts'] {
        return { ...this.state.violationCounts };
    }

    /** Is promotion currently blocked? */
    isPromotionBlocked(): boolean {
        return this.state.promotionBlocked;
    }

    // ═════════════════════════════════════════════════════════════════════
    // FOR TESTING ONLY — reset all state
    // ═════════════════════════════════════════════════════════════════════

    /** Reset all state to defaults (for gate testing) */
    _resetForTesting(): void {
        this.state = {
            mode: 'NORMAL',
            reason: 'Reset for testing',
            triggeredAt: Date.now(),
            triggeredBy: 'SYSTEM_INIT',
            violationCounts: {
                policyDeny: 0,
                nonceReplay: 0,
                integrityFail: 0,
                ledgerMismatch: 0,
            },
            lastIntegrityCheck: null,
            promotionBlocked: false,
            lockExpiresAt: 0,
        };
        this.reactions = [];
        this.policyDenyCounter.reset();
        this.nonceReplayCounter.reset();
    }

    // ═════════════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Transition governance mode and record reaction.
     * Only escalates — never downgrades (except via owner override).
     */
    private transitionMode(
        newMode: GovernanceMode,
        trigger: GovernanceTrigger,
        detail: string,
        actions: GovernanceReaction['actions'],
        severity: GovernanceReaction['severity'],
    ): GovernanceReaction {
        const previousMode = this.state.mode;

        // Only escalate (NORMAL < THROTTLED < SOFT_LOCK < HARD_FREEZE)
        const modeRank: Record<GovernanceMode, number> = {
            NORMAL: 0,
            THROTTLED: 1,
            SOFT_LOCK: 2,
            HARD_FREEZE: 3,
        };

        if (modeRank[newMode] >= modeRank[this.state.mode]) {
            this.state.mode = newMode;
            this.state.reason = detail;
            this.state.triggeredAt = Date.now();
            this.state.triggeredBy = trigger;

            // Set lock expiry for SOFT_LOCK
            if (newMode === 'SOFT_LOCK') {
                this.state.lockExpiresAt = Date.now() + this.thresholds.softLockDurationMs;
            }
        }

        const reaction: GovernanceReaction = {
            trigger,
            actions,
            severity,
            timestamp: Date.now(),
            detail,
            previousMode,
            newMode: this.state.mode,
        };

        this.pushReaction(reaction);

        // Audit log
        const eventType = this.mapTriggerToAuditEvent(trigger);
        policyAuditLogger.record({
            eventType,
            timestamp: Date.now(),
            correlationId: `governance-${trigger.toLowerCase()}`,
            toolName: 'system',
            appScope: 'governance',
            actorRole: 'system',
            decision: 'DENY',
            metadata: { previousMode, newMode: this.state.mode, detail, actions },
        });

        const emoji = this.getModeEmoji(this.state.mode);
        console.log(`[Governance] ${emoji} ${this.state.mode}: ${detail}`);

        return reaction;
    }

    private pushReaction(reaction: GovernanceReaction): void {
        this.reactions.push(reaction);
        if (this.reactions.length > this.maxReactions) {
            this.reactions.shift();
        }
    }

    private mapTriggerToAuditEvent(trigger: GovernanceTrigger): 'GOVERNANCE_FREEZE' | 'GOVERNANCE_THROTTLE' | 'GOVERNANCE_LOCK' | 'GOVERNANCE_BLOCK_PROMOTION' {
        switch (trigger) {
            case 'INTEGRITY_FAILURE': return 'GOVERNANCE_FREEZE';
            case 'POLICY_BURST': return 'GOVERNANCE_THROTTLE';
            case 'NONCE_REPLAY_FLOOD': return 'GOVERNANCE_LOCK';
            case 'LEDGER_MISMATCH': return 'GOVERNANCE_BLOCK_PROMOTION';
        }
    }

    private getModeEmoji(mode: GovernanceMode): string {
        switch (mode) {
            case 'NORMAL': return '🟢';
            case 'THROTTLED': return '🟡';
            case 'SOFT_LOCK': return '🔒';
            case 'HARD_FREEZE': return '🧊';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

/** Global singleton governance reaction engine */
export const governanceReactionEngine = new GovernanceReactionEngine();
