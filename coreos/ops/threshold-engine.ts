/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Threshold Engine (Phase 24 — Observability)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Evaluates runtime metrics against safety thresholds.
 * Creates/resolves alerts in Firestore `system_alerts` collection.
 *
 * HARDENING: Does NOT touch Worker Execution Layer or Signed Ticket System.
 *
 * @module coreos/ops/threshold-engine
 * @version 1.0.0
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import type {
    SystemAlertType,
    SystemAlert,
    SystemStatus,
    ThresholdResult,
    ThresholdViolation,
} from './types';
import { COLLECTION_SYSTEM_ALERTS } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// THRESHOLD DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface ThresholdRule {
    type: SystemAlertType;
    metric: 'deadRate' | 'retryRate';
    limit: number;
    message: (value: number, limit: number) => string;
}

const RATE_THRESHOLDS: ThresholdRule[] = [
    {
        type: 'WORKER_DEAD_RATE_HIGH',
        metric: 'deadRate',
        limit: 10,
        message: (v, l) => `Dead rate ${v}% exceeds threshold ${l}%`,
    },
    {
        type: 'WORKER_RETRY_SPIKE',
        metric: 'retryRate',
        limit: 20,
        message: (v, l) => `Retry rate ${v}% exceeds threshold ${l}%`,
    },
];

/** Worker heartbeat lost threshold in milliseconds */
const HEARTBEAT_LOST_THRESHOLD_MS = 60_000;

/** Cooldown: don't create duplicate alerts within this window */
const ALERT_COOLDOWN_MS = 5 * 60_000; // 5 minutes

// ═══════════════════════════════════════════════════════════════════════════
// EVALUATE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evaluate current metrics against defined thresholds.
 *
 * @param rates - { deadRate, retryRate } in percentage
 * @param activeWorkers - list of worker IDs with recent heartbeat
 * @param counters - raw counters (used for rate checks)
 * @param freshHeartbeatCount - count of worker_heartbeat_total docs updated recently (2× threshold)
 * @returns ThresholdResult with status and violations
 */
export function evaluateThresholds(
    rates: { deadRate: number; retryRate: number },
    activeWorkers: string[],
    counters: Record<string, number>,
    freshHeartbeatCount = 0,
): ThresholdResult {
    const violations: ThresholdViolation[] = [];

    // Check rate thresholds
    for (const rule of RATE_THRESHOLDS) {
        const value = rates[rule.metric];
        if (value > rule.limit) {
            violations.push({
                type: rule.type,
                value,
                threshold: rule.limit,
                message: rule.message(value, rule.limit),
            });
        }
    }

    // Check worker heartbeat lost
    // Only trigger if there are RECENTLY updated heartbeat counters but no active workers.
    // Old/stale counters from defunct workers are ignored (freshHeartbeatCount === 0).
    if (freshHeartbeatCount > 0 && activeWorkers.length === 0) {
        violations.push({
            type: 'WORKER_HEARTBEAT_LOST',
            value: 0,
            threshold: HEARTBEAT_LOST_THRESHOLD_MS / 1000,
            message: `No active workers — all heartbeats lost (> ${HEARTBEAT_LOST_THRESHOLD_MS / 1000}s)`,
        });
    }

    const status: SystemStatus = violations.length > 0 ? 'DEGRADED' : 'HEALTHY';

    return { status, violations };
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSIST ALERTS TO FIRESTORE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process threshold violations: create new alerts and auto-resolve old ones.
 * Fire-and-forget — errors are logged but not thrown.
 *
 * @param result - ThresholdResult from evaluateThresholds
 */
export async function processAlerts(result: ThresholdResult): Promise<void> {
    try {
        const db = getAdminFirestore();
        const collection = db.collection(COLLECTION_SYSTEM_ALERTS);
        const env = process.env.NODE_ENV || 'production';

        // Get all unresolved alerts
        const unresolvedSnapshot = await collection
            .where('resolved', '==', false)
            .get();

        const unresolvedByType = new Map<SystemAlertType, { id: string; timestamp: number }>();
        unresolvedSnapshot.forEach((doc) => {
            const data = doc.data() as SystemAlert;
            unresolvedByType.set(data.type, { id: doc.id, timestamp: data.timestamp });
        });

        const violatedTypes = new Set(result.violations.map((v) => v.type));

        // Auto-resolve alerts whose metrics are now healthy
        for (const [type, { id }] of unresolvedByType) {
            if (!violatedTypes.has(type)) {
                console.log(`[THRESHOLD] Auto-resolving alert: ${type} (id=${id})`);
                await collection.doc(id).update({
                    resolved: true,
                    resolved_at: Date.now(),
                }).catch((err) => {
                    console.warn(`[THRESHOLD] Failed to resolve alert ${id}:`, err.message);
                });
            }
        }

        // Create new alerts for current violations (with cooldown dedup)
        const now = Date.now();
        for (const violation of result.violations) {
            const existing = unresolvedByType.get(violation.type);

            // Skip if there's already an unresolved alert within cooldown window
            if (existing && (now - existing.timestamp) < ALERT_COOLDOWN_MS) {
                console.log(`[THRESHOLD] Skipping duplicate alert: ${violation.type} (cooldown)`);
                continue;
            }

            // If there's an old unresolved alert, resolve it first
            if (existing) {
                await collection.doc(existing.id).update({
                    resolved: true,
                    resolved_at: now,
                }).catch((err) => {
                    console.warn(`[THRESHOLD] Failed to resolve old alert:`, err.message);
                });
            }

            // Create new alert document
            const alertDoc: SystemAlert = {
                type: violation.type,
                value: violation.value,
                threshold: violation.threshold,
                timestamp: now,
                environment: env,
                resolved: false,
            };

            console.log(`[THRESHOLD] 🚨 Creating alert: ${violation.type} (value=${violation.value}, threshold=${violation.threshold})`);

            await collection.add(alertDoc).catch((err) => {
                console.warn(`[THRESHOLD] Failed to create alert:`, err.message);
            });
        }
    } catch (err: any) {
        console.error(`[THRESHOLD] processAlerts error:`, err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY: UNRESOLVED ALERT COUNT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get count of unresolved system alerts.
 */
export async function getUnresolvedAlertCount(): Promise<number> {
    try {
        const db = getAdminFirestore();
        const snapshot = await db
            .collection(COLLECTION_SYSTEM_ALERTS)
            .where('resolved', '==', false)
            .count()
            .get();

        return snapshot.data().count;
    } catch (err: any) {
        console.warn('[THRESHOLD] getUnresolvedAlertCount error:', err.message);
        return 0;
    }
}
