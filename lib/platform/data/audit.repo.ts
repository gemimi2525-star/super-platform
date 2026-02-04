/**
 * Audit Logs Repository (Append-Only)
 * 
 * Data access for audit log documents.
 * Part of Phase 12: Real Data Wiring
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 * 
 * CRITICAL: Audit logs are APPEND-ONLY
 * - ❌ No update operations
 * - ❌ No delete operations
 * - ✅ Write (append) only from server
 * - ✅ Read for verification/display
 */

import { getDb, withProtection } from './firestore';
import type { DocumentResponse } from './firestore';
import { info, error as logError } from '../logging/logger';
import { bridgeAuditToSynapse } from '../bridge/audit-synapse-bridge';

// ============================================================================
// Types
// ============================================================================

export type AuditDecision = 'ALLOW' | 'DENY';

export interface AuditLog {
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    target: string;
    decision: AuditDecision;
    policyId?: string;
    traceId: string;
    details?: Record<string, unknown>;
    ts: string;
}

export interface AppendAuditInput {
    actorId: string;
    actorRole: string;
    action: string;
    target: string;
    decision: AuditDecision;
    policyId?: string;
    traceId: string;
    details?: Record<string, unknown>;
}

export interface AuditListOptions {
    limit?: number;
    actorId?: string;
    action?: string;
    decision?: AuditDecision;
    startAfter?: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLLECTION = 'platform_audit_logs';

// ============================================================================
// Repository Methods
// ============================================================================

/**
 * Append a new audit log entry.
 * This is the ONLY write operation allowed.
 */
export async function appendAuditLog(input: AppendAuditInput): Promise<DocumentResponse<AuditLog>> {
    try {
        const auditEntry = {
            actorId: input.actorId,
            actorRole: input.actorRole,
            action: input.action,
            target: input.target,
            decision: input.decision,
            policyId: input.policyId,
            traceId: input.traceId,
            details: input.details || {},
            ts: new Date().toISOString(),
        };

        const docRef = await withProtection(
            `appendAuditLog:${input.action}`,
            async () => {
                const db = getDb();
                return db.collection(COLLECTION).add(auditEntry);
            }
        );

        info('API', `Audit log appended: ${input.action}`, {
            traceId: input.traceId,
            extra: { decision: input.decision },
        });

        // Phase 12.2: Bridge to SYNAPSE Ledger (non-blocking)
        const auditLogEntry: AuditLog = { id: docRef.id, ...auditEntry };
        bridgeAuditToSynapse(auditLogEntry).catch(err => {
            logError('API', `Failed to bridge audit to SYNAPSE: ${input.action}`, {
                traceId: input.traceId,
                code: (err as Error).message,
            });
        });

        return {
            ok: true,
            data: auditLogEntry,
        };
    } catch (err) {
        logError('API', `Failed to append audit log: ${input.action}`, {
            traceId: input.traceId,
            code: (err as Error).message,
        });
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * List audit logs with filters.
 */
export async function listAuditLogs(options: AuditListOptions = {}): Promise<DocumentResponse<AuditLog[]>> {
    try {
        const result = await withProtection(
            'listAuditLogs',
            async () => {
                const db = getDb();
                let query = db.collection(COLLECTION)
                    .orderBy('ts', 'desc') as FirebaseFirestore.Query;

                if (options.actorId) {
                    query = query.where('actorId', '==', options.actorId);
                }

                if (options.action) {
                    query = query.where('action', '==', options.action);
                }

                if (options.decision) {
                    query = query.where('decision', '==', options.decision);
                }

                const limit = options.limit || 50;
                query = query.limit(limit);

                return query.get();
            }
        );

        const logs = result.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as AuditLog[];

        return {
            ok: true,
            data: logs,
        };
    } catch (err) {
        logError('API', 'Failed to list audit logs', { code: (err as Error).message });
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Get audit log by ID.
 */
export async function getAuditLogById(logId: string): Promise<DocumentResponse<AuditLog>> {
    try {
        const doc = await withProtection(
            `getAuditLog:${logId}`,
            async () => {
                const db = getDb();
                return db.collection(COLLECTION).doc(logId).get();
            }
        );

        if (!doc.exists) {
            return {
                ok: false,
                code: 'DATA_NOT_FOUND',
                message: `Audit log ${logId} not found`,
            };
        }

        return {
            ok: true,
            data: { id: doc.id, ...doc.data() } as AuditLog,
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Count audit logs by decision type.
 * Useful for verification dashboards.
 */
export async function countByDecision(): Promise<DocumentResponse<{ allow: number; deny: number }>> {
    try {
        const [allowResult, denyResult] = await Promise.all([
            withProtection('countAuditAllow', async () => {
                const db = getDb();
                return db.collection(COLLECTION)
                    .where('decision', '==', 'ALLOW')
                    .count()
                    .get();
            }),
            withProtection('countAuditDeny', async () => {
                const db = getDb();
                return db.collection(COLLECTION)
                    .where('decision', '==', 'DENY')
                    .count()
                    .get();
            }),
        ]);

        return {
            ok: true,
            data: {
                allow: allowResult.data().count,
                deny: denyResult.data().count,
            },
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

// ============================================================================
// FORBIDDEN Operations (Compile-time safety)
// ============================================================================

// These functions are intentionally NOT implemented to enforce append-only:
// ❌ updateAuditLog - NOT ALLOWED
// ❌ deleteAuditLog - NOT ALLOWED
