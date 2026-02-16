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

/**
 * Count worker_heartbeat_total counters updated within the threshold window.
 * Used by evaluateThresholds to distinguish "no workers expected"
 * (all counters are ancient) from "workers died" (recent counters but
 * no active workers).
 */
export async function getFreshHeartbeatCount(thresholdMs = 120_000): Promise<number> {
    const db = getAdminFirestore();
    const since = Date.now() - thresholdMs;

    const snapshot = await db.collection(COLLECTION_CORE_METRICS).get();

    let count = 0;
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (
            data.name === 'worker_heartbeat_total' &&
            data.updatedAt >= since
        ) {
            count++;
        }
    });

    return count;
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH SUMMARY — Single-read snapshot for public monitoring (Phase 28A)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a lightweight health snapshot with a single Firestore read.
 * Used by GET /api/ops/health/summary — no sensitive data exposed.
 */
export async function getHealthSummary(): Promise<{
    systemStatus: 'HEALTHY' | 'DEGRADED';
    violationsCount: number;
    lastHeartbeatAt: string | null;
    activeWorkerCount: number;
}> {
    const db = getAdminFirestore();
    const now = Date.now();
    const heartbeatThreshold = 60_000;
    const freshThreshold = 120_000;

    // Single Firestore read — derive everything from this snapshot
    const snapshot = await db.collection(COLLECTION_CORE_METRICS).get();

    let lastHeartbeatMs = 0;
    let freshCount = 0;
    const activeWorkers: string[] = [];
    let total = 0;
    let dead = 0;
    let retryable = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();

        // Aggregate job counters
        if (doc.id.startsWith('jobs_total')) total += data.value ?? 0;
        if (doc.id.startsWith('jobs_dead')) dead += data.value ?? 0;
        if (doc.id.startsWith('jobs_failed_retryable')) retryable += data.value ?? 0;

        // Process heartbeat entries
        if (data.name === 'worker_heartbeat_total') {
            const updatedAt = data.updatedAt ?? 0;
            if (updatedAt > lastHeartbeatMs) lastHeartbeatMs = updatedAt;
            if (updatedAt >= now - freshThreshold) freshCount++;
            if (updatedAt >= now - heartbeatThreshold && data.labels?.workerId) {
                activeWorkers.push(data.labels.workerId);
            }
        }
    });

    // Evaluate thresholds inline (no alert persistence for this read-only path)
    const deadRate = total > 0 ? (dead / total) * 100 : 0;
    const retryRate = total > 0 ? (retryable / total) * 100 : 0;
    let violationsCount = 0;
    if (deadRate > 10) violationsCount++;
    if (retryRate > 20) violationsCount++;
    if (freshCount > 0 && activeWorkers.length === 0) violationsCount++;

    const systemStatus = violationsCount > 0 ? 'DEGRADED' as const : 'HEALTHY' as const;

    return {
        systemStatus,
        violationsCount,
        lastHeartbeatAt: lastHeartbeatMs > 0 ? new Date(lastHeartbeatMs).toISOString() : null,
        activeWorkerCount: activeWorkers.length,
    };
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
