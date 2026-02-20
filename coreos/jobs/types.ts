/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Job System Types (Phase 31)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Contracts for the Background Execution Layer.
 * TS is authoritative — Go is non-authoritative executor.
 *
 * @module coreos/jobs/types
 * @version 3.0.0 (Phase 31 — DLQ/Retry/Backoff)
 */

// ═══════════════════════════════════════════════════════════════════════════
// JOB TYPES (Enumeration)
// ═══════════════════════════════════════════════════════════════════════════

/** Supported job types for Phase 22A */
export type JobType =
    | 'scheduler.tick'
    | 'index.build'
    | 'webhook.process'
    | '__test.fail_n_times'
    | '__test.hang';

/** All valid job types */
export const JOB_TYPES: readonly JobType[] = [
    'scheduler.tick',
    'index.build',
    'webhook.process',
    '__test.fail_n_times',
    '__test.hang',
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// JOB STATUS
// ═══════════════════════════════════════════════════════════════════════════

export type JobStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'FAILED_RETRYABLE'
    | 'DEAD'
    | 'SUSPENDED';

// ═══════════════════════════════════════════════════════════════════════════
// JOB TICKET (Created by TS, Verified by Go)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JobTicket — Signed authorization for a background job.
 * Created by TS Core OS, verified by Go Worker.
 * Signed with Ed25519 (same key as SYNAPSE attestation).
 */
export interface JobTicket {
    /** Unique job identifier (uuid v4) */
    readonly jobId: string;
    /** Job type from allowed enumeration */
    readonly jobType: JobType;
    /** Actor who requested this job */
    readonly actorId: string;
    /** Capability scope for execution */
    readonly scope: readonly string[];
    /** Reference to policy decision in audit trail */
    readonly policyDecisionId: string;
    /** Request timestamp (epoch ms) */
    readonly requestedAt: number;
    /** Expiry timestamp (epoch ms, default: +30 min) */
    readonly expiresAt: number;
    /** SHA-256 of canonical payload (hex, 64 chars) */
    readonly payloadHash: string;
    /** Anti-replay nonce (uuid v4) */
    readonly nonce: string;
    /** Distributed tracing ID */
    readonly traceId: string;
    /** Ed25519 signature (base64) — signs all fields except signature */
    readonly signature: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// JOB ENVELOPE (Queue Payload)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JobEnvelope — Complete queue payload containing ticket + data.
 */
export interface JobEnvelope {
    /** Signed ticket */
    readonly ticket: JobTicket;
    /** Canonical JSON payload string */
    readonly payload: string;
    /** Contract version */
    readonly version: '1.0';
}

// ═══════════════════════════════════════════════════════════════════════════
// JOB RESULT (Created by Go, Verified by TS)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JobResult — Execution result from Go worker.
 * Signed with HMAC-SHA256 (shared secret).
 * TS verifies before audit append.
 */
export interface JobResult {
    /** Job ID (must match ticket) */
    readonly jobId: string;
    /** Execution outcome */
    readonly status: 'SUCCEEDED' | 'FAILED';
    /** Execution start timestamp (epoch ms) */
    readonly startedAt: number;
    /** Execution end timestamp (epoch ms) */
    readonly finishedAt: number;
    /** SHA-256 of result data (hex, 64 chars) */
    readonly resultHash: string;
    /** Optional result payload */
    readonly resultData?: unknown;
    /** Error code (only for FAILED) */
    readonly errorCode?: string;
    /** Error message (only for FAILED) */
    readonly errorMessage?: string;
    /** Execution metrics */
    readonly metrics: {
        readonly latencyMs: number;
        readonly attempts: number;
    };
    /** Trace ID (must match ticket) */
    readonly traceId: string;
    /** Worker instance ID */
    readonly workerId: string;
    /** HMAC-SHA256 signature (hex) */
    readonly signature: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIRESTORE QUEUE RECORD
// ═══════════════════════════════════════════════════════════════════════════

/** Last error information stored on job doc */
export interface JobLastError {
    code: string;
    message: string;
    at: number;
}

/** Lease information for worker claiming */
export interface JobLease {
    workerId: string;
    leaseUntil: number;
}

/** Heartbeat information */
export interface JobHeartbeat {
    workerId: string;
    at: number;
}

/**
 * JobQueueRecord — Firestore document schema for job_queue collection.
 */
export interface JobQueueRecord {
    /** Signed ticket */
    ticket: JobTicket;
    /** Canonical JSON payload */
    payload: string;
    /** Contract version */
    version: '1.0';
    /** Current job status */
    status: JobStatus;
    /** Worker ID that claimed this job (null if unclaimed) */
    workerId: string | null;
    /** Timestamp when worker claimed job */
    claimedAt: number | null;
    /** Creation timestamp */
    createdAt: number;
    /** Last update timestamp */
    updatedAt: number;
    /** Nonce index for replay prevention */
    nonce: string;

    // ── Phase 22A: Retry/Lease/Heartbeat fields ──
    /** Number of execution attempts so far */
    attempts: number;
    /** Maximum allowed attempts before dead-letter */
    maxAttempts: number;
    /** Earliest time this job can be claimed (epoch ms) */
    nextRunAt: number;
    /** Last error details (set on failure) */
    lastError?: JobLastError;
    /** Current lease (set on claim, extended by heartbeat) */
    lease?: JobLease;
    /** Last heartbeat (set by worker during execution) */
    heartbeat?: JobHeartbeat;

    // ── Phase 15B.2: Suspend/Resume/Priority fields ──
    /** Scheduling priority (0-100, higher = more urgent). Default: 50 */
    priority: number;
    /** Epoch ms when job was suspended */
    suspendedAt?: number;
    /** Actor who suspended the job */
    suspendedBy?: string;
    /** Epoch ms of last resume */
    resumedAt?: number;
    /** Epoch ms of last priority update */
    priorityUpdatedAt?: number;

    // ── Phase 15D: Cross-device handoff metadata (additive) ──
    /** Device ID that last modified this job */
    lastUpdatedByDevice?: string;
    /** User ID that last modified this job (future proof) */
    lastUpdatedByUser?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Default ticket TTL: 30 minutes */
export const DEFAULT_TICKET_TTL_MS = 30 * 60 * 1000;

/** Default max retry attempts */
export const DEFAULT_MAX_ATTEMPTS = 3;

/** Lease duration in ms (30 seconds) */
export const LEASE_DURATION_MS = 30_000;

/** Retry base delay in ms (Phase 31.3) */
export const RETRY_BASE_DELAY_MS = 2_000;

/** Retry max delay in ms (Phase 31.3) */
export const RETRY_MAX_DELAY_MS = 60_000;

/** Default job priority (Phase 15B.2) */
export const DEFAULT_PRIORITY = 50;

/** Minimum priority value */
export const PRIORITY_MIN = 0;

/** Maximum priority value */
export const PRIORITY_MAX = 100;

/** Job queue Firestore collection */
export const COLLECTION_JOB_QUEUE = 'job_queue';

/** Job results Firestore collection */
export const COLLECTION_JOB_RESULTS = 'job_results';

/** Used nonces Firestore collection (replay prevention) */
export const COLLECTION_JOB_NONCES = 'job_nonces';

/** Dead-letter queue Firestore collection (Phase 31.4) */
export const COLLECTION_JOB_DEAD_LETTERS = 'job_dead_letters';

// ═══════════════════════════════════════════════════════════════════════════
// DLQ RECORD (Phase 31.4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DLQRecord — Dead Letter Queue entry with full context.
 * Written when a job exhausts all retry attempts.
 */
export interface DLQRecord {
    jobId: string;
    originalTicket: JobTicket | null;
    payload: string | null;
    lastError: JobLastError;
    totalAttempts: number;
    maxAttempts: number;
    lastWorkerId: string | null;
    deadAt: number;
    createdAt: number | null;
    jobType: string;
    traceId: string | null;
}
