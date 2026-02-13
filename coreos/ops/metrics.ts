/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Ops Metrics Store (Phase 22B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lightweight Firestore-backed metrics: counters + timeseries.
 * All writes are fire-and-forget (non-blocking) to avoid impacting
 * request latency.
 *
 * @module coreos/ops/metrics
 * @version 1.0.0
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTION_CORE_METRICS, COLLECTION_CORE_METRICS_TS } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// COUNTER — Atomic increment via FieldValue.increment
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Increment (or create) a counter.
 * Doc ID = name (optionally suffixed with label values).
 * Fire-and-forget — errors logged but not thrown.
 *
 * @example incrementCounter('jobs_total', { jobType: 'scheduler.tick' })
 */
export function incrementCounter(
    name: string,
    labels: Record<string, string> = {},
    delta = 1,
): void {
    try {
        const db = getAdminFirestore();
        const docId = buildDocId(name, labels);

        db.collection(COLLECTION_CORE_METRICS).doc(docId).set(
            {
                name,
                value: FieldValue.increment(delta),
                labels,
                updatedAt: Date.now(),
            },
            { merge: true },
        ).catch((err) => {
            console.warn(`[Metrics] incrementCounter(${docId}) failed:`, err.message);
        });
    } catch (err: any) {
        console.warn(`[Metrics] incrementCounter(${name}) init error:`, err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMESERIES — Append to minute-bucketed collection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record a timeseries data point.
 * Bucketed by minute for aggregation.
 * Fire-and-forget.
 *
 * @example recordTimeseries('job_latency', 245, { jobType: 'scheduler.tick' })
 */
export function recordTimeseries(
    metric: string,
    value: number,
    labels: Record<string, string> = {},
): void {
    try {
        const db = getAdminFirestore();
        const now = Date.now();
        const bucket = minuteBucket(now);

        db.collection(COLLECTION_CORE_METRICS_TS).add({
            metric,
            value,
            labels,
            timestamp: now,
            bucket,
        }).catch((err) => {
            console.warn(`[Metrics] recordTimeseries(${metric}) failed:`, err.message);
        });
    } catch (err: any) {
        console.warn(`[Metrics] recordTimeseries(${metric}) init error:`, err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HELPERS (used by ops API endpoints)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all counters as a flat Record<string, number>.
 */
export async function getAllCounters(): Promise<Record<string, number>> {
    const db = getAdminFirestore();
    const snapshot = await db.collection(COLLECTION_CORE_METRICS).get();

    const counters: Record<string, number> = {};
    snapshot.forEach((doc) => {
        const data = doc.data();
        counters[doc.id] = data.value ?? 0;
    });

    return counters;
}

/**
 * Get timeseries data for a metric within a time window.
 * Returns raw entries sorted by timestamp.
 */
export async function getTimeseries(
    metric: string,
    windowMs: number,
): Promise<Array<{ value: number; timestamp: number; bucket: string; labels: Record<string, string> }>> {
    const db = getAdminFirestore();
    const since = Date.now() - windowMs;

    const snapshot = await db
        .collection(COLLECTION_CORE_METRICS_TS)
        .where('metric', '==', metric)
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'asc')
        .limit(500)
        .get();

    return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
            value: d.value,
            timestamp: d.timestamp,
            bucket: d.bucket,
            labels: d.labels ?? {},
        };
    });
}

/**
 * Get active workers (heartbeat within threshold).
 * Uses client-side filtering to avoid needing a composite index.
 */
export async function getActiveWorkers(thresholdMs = 60_000): Promise<string[]> {
    const db = getAdminFirestore();
    const since = Date.now() - thresholdMs;

    // Get all counters and filter for heartbeat entries client-side
    const snapshot = await db.collection(COLLECTION_CORE_METRICS).get();

    const workers: string[] = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (
            data.name === 'worker_heartbeat_total' &&
            data.updatedAt >= since &&
            data.labels?.workerId
        ) {
            workers.push(data.labels.workerId);
        }
    });

    return workers;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a Firestore-safe doc ID from name + labels.
 * e.g. "jobs_total:jobType=scheduler.tick"
 */
function buildDocId(name: string, labels: Record<string, string>): string {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return name;
    const suffix = entries.map(([k, v]) => `${k}=${v}`).join(',');
    return `${name}:${suffix}`;
}

/**
 * Bucket timestamp to minute string.
 * e.g. 2026-02-13T17:05
 */
function minuteBucket(epochMs: number): string {
    const d = new Date(epochMs);
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}
