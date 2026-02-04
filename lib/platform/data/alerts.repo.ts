/**
 * Alerts Repository
 * 
 * Data access for system alerts.
 * Part of Phase 12: Real Data Wiring
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 * 
 * Rules:
 * - Read-only for UI
 * - Write from system only (server-side)
 */

import { getDb, getDocument, listDocuments, withProtection } from './firestore';
import type { DocumentResponse } from './firestore';
import { info, error as logError } from '../logging/logger';

// ============================================================================
// Types
// ============================================================================

export type AlertLevel = 'info' | 'warning' | 'critical';

/**
 * Internal: Firestore document structure
 * This matches the actual data in the 'alerts' collection
 */
interface AlertFirestoreDoc {
    type: AlertLevel;
    acknowledged: boolean;
    description: string;
    timestamp: FirebaseFirestore.Timestamp;
    title: string;
    correlatedRequestIds?: string[];
}

export interface Alert {
    id: string;
    level: AlertLevel;
    title: string;
    message: string;
    source: string;
    resolved: boolean;
    resolvedAt?: string;
    resolvedBy?: string;
    createdAt: string;
}

export interface CreateAlertInput {
    level: AlertLevel;
    title: string;
    message: string;
    source: string;
}

export interface AlertListOptions {
    limit?: number;
    level?: AlertLevel;
    resolved?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Canonical collection name
const COLLECTION = 'alerts';

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Map Firestore document to API Alert format
 */
function mapFirestoreToAlert(doc: FirebaseFirestore.DocumentSnapshot): Alert | null {
    const data = doc.data() as AlertFirestoreDoc;
    if (!data) return null;

    return {
        id: doc.id,
        level: data.type,
        resolved: data.acknowledged,
        message: data.description,
        source: 'system',
        createdAt: data.timestamp.toDate().toISOString(),
        title: data.title,
    };
}

// ============================================================================
// Repository Methods
// ============================================================================

/**
 * Get alert by ID.
 */
export async function getAlertById(alertId: string): Promise<DocumentResponse<Alert>> {
    return getDocument<Alert>(COLLECTION, alertId);
}

/**
 * List alerts with filters.
 */
export async function listAlerts(options: AlertListOptions = {}): Promise<DocumentResponse<Alert[]>> {
    try {
        const result = await withProtection(
            'listAlerts',
            async () => {
                const db = getDb();
                let query = db.collection(COLLECTION)
                    .orderBy('timestamp', 'desc') as FirebaseFirestore.Query;

                if (options.level) {
                    query = query.where('type', '==', options.level);
                }

                if (options.resolved !== undefined) {
                    query = query.where('acknowledged', '==', options.resolved);
                }

                const limit = options.limit || 50;
                query = query.limit(limit);

                return query.get();
            }
        );

        const alerts = result.docs
            .map(mapFirestoreToAlert)
            .filter((a): a is Alert => a !== null);

        return {
            ok: true,
            data: alerts,
        };
    } catch (err) {
        logError('API', 'Failed to list alerts', { code: (err as Error).message });
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * List unresolved alerts.
 */
export async function listUnresolvedAlerts(limit = 20): Promise<DocumentResponse<Alert[]>> {
    return listAlerts({ resolved: false, limit });
}

/**
 * Create a new alert (system-only).
 */
export async function createAlert(input: CreateAlertInput): Promise<DocumentResponse<Alert>> {
    try {
        const alertData = {
            level: input.level,
            title: input.title,
            message: input.message,
            source: input.source,
            resolved: false,
            createdAt: new Date().toISOString(),
        };

        const docRef = await withProtection(
            `createAlert:${input.level}`,
            async () => {
                const db = getDb();
                return db.collection(COLLECTION).add(alertData);
            }
        );

        info('OPS', `Alert created: ${input.title}`, {
            extra: { level: input.level, source: input.source },
        });

        return {
            ok: true,
            data: { id: docRef.id, ...alertData },
        };
    } catch (err) {
        logError('OPS', `Failed to create alert: ${input.title}`, { code: (err as Error).message });
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Resolve an alert.
 */
export async function resolveAlert(alertId: string, resolvedBy: string): Promise<DocumentResponse<Alert>> {
    try {
        await withProtection(
            `resolveAlert:${alertId}`,
            async () => {
                const db = getDb();
                return db.collection(COLLECTION).doc(alertId).update({
                    resolved: true,
                    resolvedAt: new Date().toISOString(),
                    resolvedBy,
                });
            }
        );

        info('OPS', `Alert resolved: ${alertId}`, { extra: { resolvedBy } });

        return getAlertById(alertId);
    } catch (err) {
        logError('OPS', `Failed to resolve alert: ${alertId}`, { code: (err as Error).message });
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Count alerts by level.
 */
export async function countByLevel(): Promise<DocumentResponse<Record<AlertLevel, number>>> {
    try {
        const [infoResult, warnResult, critResult] = await Promise.all([
            withProtection('countAlertInfo', async () => {
                const db = getDb();
                return db.collection(COLLECTION)
                    .where('type', '==', 'info')
                    .where('acknowledged', '==', false)
                    .count()
                    .get();
            }),
            withProtection('countAlertWarn', async () => {
                const db = getDb();
                return db.collection(COLLECTION)
                    .where('type', '==', 'warning')
                    .where('acknowledged', '==', false)
                    .count()
                    .get();
            }),
            withProtection('countAlertCrit', async () => {
                const db = getDb();
                return db.collection(COLLECTION)
                    .where('type', '==', 'critical')
                    .where('acknowledged', '==', false)
                    .count()
                    .get();
            }),
        ]);

        return {
            ok: true,
            data: {
                info: infoResult.data().count,
                warning: warnResult.data().count,
                critical: critResult.data().count,
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
