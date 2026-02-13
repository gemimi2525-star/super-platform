/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Ops Telemetry Types (Phase 22B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Type definitions for metrics, timeseries, and ops concepts.
 */

// ═══════════════════════════════════════════════════════════════════════════
// METRIC COUNTER
// ═══════════════════════════════════════════════════════════════════════════

export interface MetricCounter {
    name: string;
    value: number;
    labels: Record<string, string>;
    updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMESERIES
// ═══════════════════════════════════════════════════════════════════════════

export interface TimeseriesEntry {
    metric: string;
    value: number;
    labels: Record<string, string>;
    timestamp: number;
    /** Bucket key: e.g. '2026-02-13T17:05' */
    bucket: string;
}

export interface TimeseriesBucket {
    bucket: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// METRICS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

export interface MetricsSummary {
    counters: Record<string, number>;
    rates: {
        successRate: number;
        deadRate: number;
        retryRate: number;
    };
    activeWorkers: string[];
    generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STUCK JOB
// ═══════════════════════════════════════════════════════════════════════════

export interface StuckJob {
    jobId: string;
    jobType: string;
    workerId: string | null;
    status: string;
    attempts: number;
    leaseUntil: number | null;
    lastHeartbeat: number | null;
    stuckForSec: number;
    claimedAt: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const COLLECTION_CORE_METRICS = 'core_metrics';
export const COLLECTION_CORE_METRICS_TS = 'core_metrics_ts';
