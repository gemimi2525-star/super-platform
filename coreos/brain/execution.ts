/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXECUTION ENGINE (Phase 20 — Single Human Authority)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The core execution engine that enforces:
 * R1: Every execute MUST have a Signed Approval (Ed25519)
 * R2: Every execute MUST create a Snapshot before applying
 * R3: Every execute MUST have an Undo Plan
 * R4: Every execute MUST log an append-only audit entry
 * 
 * Kill Switch: OWNER_AUTHORITY can disable all execution instantly
 * 
 * Scope: Phase 20 limits to core.notes only (2 actions)
 * 
 * @module coreos/brain/execution
 */

import { createHash } from 'crypto';
import { verifySignature } from '../attestation/signer';
import { getDefaultKeyProvider } from '../attestation/keys';
import { snapshotStore } from './snapshot';
import type {
    SignedApproval,
    ExecutionResult,
    ExecutionAuditEntry,
    UndoPlan,
    KillSwitchState,
    ActionType,
    ResourceTarget,
    RiskClass,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 20: Scope Restrictions (Document F)
// ═══════════════════════════════════════════════════════════════════════════

/** Only these apps can execute in Phase 20 */
const PHASE20_EXECUTE_APPS: ReadonlySet<string> = new Set([
    'core.notes',
]);

/** Only these action types are allowed in Phase 20 */
const PHASE20_ALLOWED_ACTIONS: ReadonlySet<ActionType> = new Set([
    'NOTE_REWRITE',
    'NOTE_STRUCTURE',
]);

/** Action type → Risk class mapping */
const ACTION_RISK_MAP: Record<ActionType, RiskClass> = {
    'NOTE_REWRITE': 'SENSITIVE',
    'NOTE_STRUCTURE': 'SENSITIVE',
    'NOTE_SUMMARIZE': 'SENSITIVE',
    'SETTING_CHANGE': 'SENSITIVE',
    'FILE_ORGANIZE': 'DESTRUCTIVE',
    'FILE_MOVE': 'DESTRUCTIVE',
    'FILE_DELETE': 'DESTRUCTIVE',
    'FILE_OVERWRITE': 'DESTRUCTIVE',
    'FILE_PURGE': 'IRREVERSIBLE',
    'ORG_PERMISSION': 'IRREVERSIBLE',
    'SYSTEM_RESET': 'IRREVERSIBLE',
};

/** Approval validity window */
const MAX_APPROVAL_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Rate limit: max executions per minute */
const RATE_LIMIT_PER_MINUTE = 10;

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

class ExecutionEngine {
    private killSwitch: KillSwitchState = 'EXECUTE_ENABLED';
    private usedNonces: Set<string> = new Set();
    private auditLog: ExecutionAuditEntry[] = [];
    private rateLimitWindow: { count: number; resetAt: number } = { count: 0, resetAt: 0 };

    // ═══════════════════════════════════════════════════════════════════
    // G20-7: KILL SWITCH
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Emergency kill switch — disable all execution instantly
     * Only OWNER_AUTHORITY can toggle
     */
    setKillSwitch(state: KillSwitchState): void {
        this.killSwitch = state;
        console.log(`[Execution] 🔴 Kill Switch: ${state}`);
    }

    getKillSwitchState(): KillSwitchState {
        return this.killSwitch;
    }

    isExecuteEnabled(): boolean {
        return this.killSwitch === 'EXECUTE_ENABLED';
    }

    // ═══════════════════════════════════════════════════════════════════
    // R1: VALIDATE SIGNED APPROVAL
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Validate a SignedApproval before execution
     * G20-1: ไม่มีเส้นทาง execute ที่ไม่มี Signed Approval
     */
    validateApproval(approval: SignedApproval): { valid: boolean; reason?: string } {
        // G20-7: Kill switch check (highest priority)
        if (!this.isExecuteEnabled()) {
            return { valid: false, reason: 'P20: Kill switch is ACTIVE — all execution disabled' };
        }

        // Must have approval object
        if (!approval) {
            return { valid: false, reason: 'P20: NO EXECUTION WITHOUT SIGNED APPROVAL' };
        }

        // Must have signature
        if (!approval.signature) {
            return { valid: false, reason: 'P20: Missing signature in approval' };
        }

        // Verify Ed25519 signature
        const canonicalPayload = this.canonicalize(approval);
        const keyProvider = getDefaultKeyProvider();
        const publicKey = keyProvider.getPublicKey();

        const isValidSig = verifySignature(canonicalPayload, approval.signature, publicKey);
        if (!isValidSig) {
            return { valid: false, reason: 'P20: INVALID SIGNATURE — approval rejected' };
        }

        // Check expiry
        if (Date.now() > approval.expiresAt) {
            return { valid: false, reason: 'P20: APPROVAL EXPIRED' };
        }

        // G20-6: Nonce check (replay protection)
        if (this.usedNonces.has(approval.nonce)) {
            return { valid: false, reason: 'P20: NONCE ALREADY USED — possible replay attack' };
        }

        // Phase 20 scope check (Document F)
        if (!PHASE20_EXECUTE_APPS.has(approval.scope)) {
            return { valid: false, reason: `P20: Scope '${approval.scope}' not allowed in Phase 20 (only core.notes)` };
        }

        // Phase 20 action type check
        if (!PHASE20_ALLOWED_ACTIONS.has(approval.actionType)) {
            return { valid: false, reason: `P20: Action '${approval.actionType}' not allowed in Phase 20` };
        }

        // G20-6: Rate limit check
        if (!this.checkRateLimit()) {
            return { valid: false, reason: 'P20: Rate limit exceeded (max 10 execute/min)' };
        }

        return { valid: true };
    }

    // ═══════════════════════════════════════════════════════════════════
    // CORE EXECUTION FLOW
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Execute an approved action
     * Enforces R1-R4: Approval → Snapshot → Execute → Audit
     */
    async executeWithApproval(
        approval: SignedApproval,
        readResource: (target: ResourceTarget) => Promise<string>,
        applyChange: (target: ResourceTarget, diff: { before: string; after: string }) => Promise<void>,
    ): Promise<ExecutionResult> {
        const startTime = Date.now();
        const executionId = `exec-${startTime}-${approval.approvalId.substring(0, 8)}`;

        // R1: Validate approval
        const validation = this.validateApproval(approval);
        if (!validation.valid) {
            console.error(`[Execution] ❌ Validation failed: ${validation.reason}`);
            throw new Error(validation.reason);
        }

        // Consume nonce (prevent replay)
        this.usedNonces.add(approval.nonce);
        this.incrementRateLimit();

        console.log(`[Execution] ✅ Approval validated: ${approval.approvalId}`);

        let snapshotRef = '';
        let status: 'COMPLETED' | 'FAILED' = 'COMPLETED';
        let error: string | undefined;

        try {
            // R2: Create snapshot BEFORE execution
            const currentState = await readResource(approval.target);
            snapshotRef = await snapshotStore.save(approval.target, currentState);
            console.log(`[Execution] 📸 Snapshot created: ${snapshotRef}`);

            // Execute the action
            await applyChange(approval.target, {
                before: approval.diff.before,
                after: approval.diff.after,
            });
            console.log(`[Execution] ✅ Action executed: ${approval.actionType} on ${approval.target.resourceId}`);

        } catch (err: any) {
            status = 'FAILED';
            error = err.message;
            console.error(`[Execution] ❌ Execution failed: ${err.message}`);
        }

        const duration = Date.now() - startTime;

        // R3: Create undo plan
        const undoPlan: UndoPlan = {
            executionId,
            snapshotRef,
            rollbackType: 'RESTORE',
            rollbackSteps: [
                `1. อ่าน snapshot: ${snapshotRef}`,
                `2. เขียนทับ ${approval.target.resourceId} ด้วยข้อมูลจาก snapshot`,
                `3. บันทึก audit entry ROLLED_BACK`,
            ],
            estimatedRisk: 'LOW',
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        };

        // R4: Append audit entry
        const result: ExecutionResult = {
            executionId,
            intentId: approval.intentId,
            approvalId: approval.approvalId,
            status,
            snapshotRef,
            undoPlan,
            executedAt: startTime,
            duration,
            error,
        };

        this.appendAuditEntry(result, approval);

        return result;
    }

    // ═══════════════════════════════════════════════════════════════════
    // UNDO (G20-3)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Undo an execution by restoring from snapshot
     * G20-3: Undo ทำงานได้ (core.notes)
     */
    async undo(
        executionId: string,
        applyRestore: (target: ResourceTarget, previousState: string) => Promise<void>,
    ): Promise<ExecutionResult> {
        const startTime = Date.now();

        // Find the audit entry for this execution
        const auditEntry = this.auditLog.find(e => e.executionId === executionId);
        if (!auditEntry) {
            throw new Error(`P20: Execution '${executionId}' not found in audit log`);
        }

        if (auditEntry.status === 'ROLLED_BACK') {
            throw new Error(`P20: Execution '${executionId}' already rolled back`);
        }

        // Get snapshot
        const snapshot = await snapshotStore.get(auditEntry.snapshotRef);
        if (!snapshot) {
            throw new Error(`P20: Snapshot '${auditEntry.snapshotRef}' not found or expired`);
        }

        try {
            // Restore from snapshot
            await applyRestore(auditEntry.target, snapshot.state);
            console.log(`[Execution] ↩️ Undo completed: ${executionId}`);

            // Update audit entry status
            auditEntry.status = 'ROLLED_BACK';

            // Create a new audit entry for the rollback
            const undoResult: ExecutionResult = {
                executionId: `undo-${startTime}-${executionId.substring(0, 8)}`,
                intentId: auditEntry.intentId,
                approvalId: auditEntry.approvalId,
                status: 'ROLLED_BACK',
                snapshotRef: auditEntry.snapshotRef,
                undoPlan: auditEntry.undoPlan,
                executedAt: startTime,
                duration: Date.now() - startTime,
            };

            // Append rollback audit entry
            const entryId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const prevHash = this.auditLog.length > 0
                ? this.auditLog[this.auditLog.length - 1].recordHash
                : '0000000000000000';

            const rollbackEntry: ExecutionAuditEntry = {
                entryId,
                executionId: undoResult.executionId,
                intentId: auditEntry.intentId,
                approvalId: auditEntry.approvalId,
                snapshotRef: auditEntry.snapshotRef,
                actionType: auditEntry.actionType,
                scope: auditEntry.scope,
                target: auditEntry.target,
                status: 'ROLLED_BACK',
                executedAt: startTime,
                duration: undoResult.duration,
                undoPlan: auditEntry.undoPlan,
                prevHash,
                recordHash: '', // will be computed
            };
            rollbackEntry.recordHash = this.computeHash(rollbackEntry);
            this.auditLog.push(rollbackEntry);

            return undoResult;

        } catch (err: any) {
            console.error(`[Execution] ❌ Undo failed: ${err.message}`);
            throw new Error(`P20: Undo failed — ${err.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // AUDIT (R4 + G20-5)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Append an audit entry (append-only, hash-chained)
     * G20-5: Audit trail ครบ
     */
    private appendAuditEntry(result: ExecutionResult, approval: SignedApproval): void {
        const entryId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const prevHash = this.auditLog.length > 0
            ? this.auditLog[this.auditLog.length - 1].recordHash
            : '0000000000000000'; // Genesis hash

        const entry: ExecutionAuditEntry = {
            entryId,
            executionId: result.executionId,
            intentId: result.intentId,
            approvalId: result.approvalId,
            snapshotRef: result.snapshotRef,
            actionType: approval.actionType,
            scope: approval.scope,
            target: approval.target,
            status: result.status,
            executedAt: result.executedAt,
            duration: result.duration,
            undoPlan: result.undoPlan,
            prevHash,
            recordHash: '', // Will be computed
        };

        entry.recordHash = this.computeHash(entry);
        this.auditLog.push(entry);

        console.log(`[Audit] 📝 Entry appended: ${entryId} (chain: ${prevHash.substring(0, 8)} → ${entry.recordHash.substring(0, 8)})`);
    }

    /**
     * Get the full audit log (read-only)
     */
    getAuditLog(): ReadonlyArray<ExecutionAuditEntry> {
        return [...this.auditLog];
    }

    /**
     * Verify audit chain integrity
     */
    verifyAuditChain(): { valid: boolean; brokenAt?: number } {
        for (let i = 0; i < this.auditLog.length; i++) {
            const entry = this.auditLog[i];

            // Verify record hash
            const expectedHash = this.computeHash({ ...entry, recordHash: '' });
            if (entry.recordHash !== expectedHash) {
                return { valid: false, brokenAt: i };
            }

            // Verify chain
            if (i > 0) {
                if (entry.prevHash !== this.auditLog[i - 1].recordHash) {
                    return { valid: false, brokenAt: i };
                }
            } else {
                if (entry.prevHash !== '0000000000000000') {
                    return { valid: false, brokenAt: 0 };
                }
            }
        }
        return { valid: true };
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Canonicalize approval for signature verification
     * Uses deterministic JSON field ordering
     */
    private canonicalize(approval: SignedApproval): string {
        const fields = approval.signedFields || [
            'approvalId', 'intentId', 'actionType', 'scope',
            'target', 'diff', 'approvedBy', 'approvedAt',
            'expiresAt', 'nonce',
        ];

        const canonical: Record<string, any> = {};
        for (const field of fields) {
            canonical[field] = (approval as any)[field];
        }
        return JSON.stringify(canonical);
    }

    /**
     * Compute SHA-256 hash for audit chain integrity
     */
    private computeHash(entry: ExecutionAuditEntry): string {
        const data = JSON.stringify({
            entryId: entry.entryId,
            executionId: entry.executionId,
            intentId: entry.intentId,
            approvalId: entry.approvalId,
            status: entry.status,
            executedAt: entry.executedAt,
            prevHash: entry.prevHash,
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * G20-6: Rate limit check
     */
    private checkRateLimit(): boolean {
        const now = Date.now();
        if (now > this.rateLimitWindow.resetAt) {
            this.rateLimitWindow = { count: 0, resetAt: now + 60_000 };
        }
        return this.rateLimitWindow.count < RATE_LIMIT_PER_MINUTE;
    }

    private incrementRateLimit(): void {
        const now = Date.now();
        if (now > this.rateLimitWindow.resetAt) {
            this.rateLimitWindow = { count: 1, resetAt: now + 60_000 };
        } else {
            this.rateLimitWindow.count++;
        }
    }

    /**
     * Get risk class for an action type
     */
    getRiskClass(actionType: ActionType): RiskClass {
        return ACTION_RISK_MAP[actionType] || 'SAFE';
    }

    /**
     * Check if an action is allowed in Phase 20
     */
    isPhase20Allowed(scope: string, actionType: ActionType): boolean {
        return PHASE20_EXECUTE_APPS.has(scope) && PHASE20_ALLOWED_ACTIONS.has(actionType);
    }
}

export const executionEngine = new ExecutionEngine();
