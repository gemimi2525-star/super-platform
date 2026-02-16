/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Structured Job Lifecycle Logger (Phase 31.7)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Centralized structured logger for all job system events.
 * Every log entry has a deterministic shape for observability.
 *
 * @module coreos/jobs/job-logger
 * @version 1.0.0 (Phase 31)
 */

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type JobEvent =
    | 'job.enqueued'
    | 'job.claimed'
    | 'job.heartbeat'
    | 'job.completed'
    | 'job.failed'
    | 'job.retried'
    | 'job.dead'
    | 'job.stuck'
    | 'job.reaped'
    | 'job.signature_bypass'
    | 'job.result_idempotent'
    | 'job.claim_idempotent'
    | 'job.reaper_run'
    | 'worker_signature_bypassed_dev_mode';

// ═══════════════════════════════════════════════════════════════════════════
// LOG ENTRY
// ═══════════════════════════════════════════════════════════════════════════

export interface JobLogEntry {
    /** Event type */
    event: JobEvent;
    /** Job ID */
    jobId?: string;
    /** Trace ID for distributed correlation */
    traceId?: string;
    /** Worker instance ID */
    workerId?: string;
    /** Job type */
    jobType?: string;
    /** Current attempt number */
    attempt?: number;
    /** Max allowed attempts */
    maxAttempts?: number;
    /** Duration in milliseconds */
    durationMs?: number;
    /** Error details */
    error?: { code: string; message: string };
    /** ISO timestamp */
    timestamp: string;
    /** Additional context */
    [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════════════════

class JobLogger {
    /**
     * Log a structured job event.
     * Outputs to stdout in JSON format for observability pipelines.
     */
    log(event: JobEvent, data: Omit<JobLogEntry, 'event' | 'timestamp'>): void {
        const entry: JobLogEntry = {
            event,
            timestamp: new Date().toISOString(),
            ...data,
        };

        // Structured JSON output for log aggregators
        console.log(`[JobSystem] ${JSON.stringify(entry)}`);
    }

    /**
     * Log a warning-level job event.
     */
    warn(event: JobEvent, data: Omit<JobLogEntry, 'event' | 'timestamp'>): void {
        const entry: JobLogEntry = {
            event,
            timestamp: new Date().toISOString(),
            ...data,
        };

        console.warn(`[JobSystem] ${JSON.stringify(entry)}`);
    }

    /**
     * Log an error-level job event.
     */
    error(event: JobEvent, data: Omit<JobLogEntry, 'event' | 'timestamp'>): void {
        const entry: JobLogEntry = {
            event,
            timestamp: new Date().toISOString(),
            ...data,
        };

        console.error(`[JobSystem] ${JSON.stringify(entry)}`);
    }
}

/** Singleton job logger instance */
export const jobLogger = new JobLogger();
