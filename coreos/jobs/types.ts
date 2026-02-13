/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Job System Types (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Contracts for the Background Execution Layer.
 * TS is authoritative — Go is non-authoritative executor.
 *
 * @module coreos/jobs/types
 * @version 1.0.0 (Phase 21C)
 */

// ═══════════════════════════════════════════════════════════════════════════
// JOB TYPES (Enumeration)
// ═══════════════════════════════════════════════════════════════════════════

/** Supported job types for Phase 21C */
export type JobType =
    | 'scheduler.tick'
    | 'index.build'
    | 'webhook.process';

/** All valid job types */
export const JOB_TYPES: readonly JobType[] = [
    'scheduler.tick',
    'index.build',
    'webhook.process',
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// JOB STATUS
// ═══════════════════════════════════════════════════════════════════════════

export type JobStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED';

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
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Default ticket TTL: 30 minutes */
export const DEFAULT_TICKET_TTL_MS = 30 * 60 * 1000;

/** Job queue Firestore collection */
export const COLLECTION_JOB_QUEUE = 'job_queue';

/** Job results Firestore collection */
export const COLLECTION_JOB_RESULTS = 'job_results';

/** Used nonces Firestore collection (replay prevention) */
export const COLLECTION_JOB_NONCES = 'job_nonces';
