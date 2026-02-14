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
// SYSTEM ALERT (Phase 24 — Observability)
// ═══════════════════════════════════════════════════════════════════════════

/** Alert event types triggered by threshold violations */
export type SystemAlertType =
    | 'WORKER_DEAD_RATE_HIGH'
    | 'WORKER_RETRY_SPIKE'
    | 'WORKER_HEARTBEAT_LOST';

/** System status derived from threshold evaluation */
export type SystemStatus = 'HEALTHY' | 'DEGRADED';

/** Firestore document schema for system_alerts collection */
export interface SystemAlert {
    /** Alert event type */
    type: SystemAlertType;
    /** Observed metric value at time of trigger */
    value: number;
    /** Threshold that was violated */
    threshold: number;
    /** Timestamp when alert was created (epoch ms) */
    timestamp: number;
    /** Environment where the alert was triggered */
    environment: string;
    /** Whether the alert has been auto-resolved */
    resolved: boolean;
    /** Timestamp when the alert was resolved (epoch ms) */
    resolved_at?: number;
}

/** Result of threshold evaluation */
export interface ThresholdResult {
    status: SystemStatus;
    violations: ThresholdViolation[];
}

/** A single threshold violation */
export interface ThresholdViolation {
    type: SystemAlertType;
    value: number;
    threshold: number;
    message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const COLLECTION_CORE_METRICS = 'core_metrics';
export const COLLECTION_CORE_METRICS_TS = 'core_metrics_ts';
export const COLLECTION_SYSTEM_ALERTS = 'system_alerts';
