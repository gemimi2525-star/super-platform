/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Structured Job Lifecycle Logger (Phase 31.7 → 32.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Centralized structured logger for all job system events.
 * Every log entry has a deterministic shape for observability.
 *
 * Phase 32.1: Events are now typed via the frozen Audit Taxonomy.
 * Use AUDIT_EVENTS constants instead of string literals.
 *
 * @module coreos/jobs/job-logger
 * @version 2.0.0 (Phase 32.1)
 */

import type { AuditEventType } from '../audit/taxonomy';
import { AUDIT_EVENTS } from '../audit/taxonomy';

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES (now sourced from taxonomy)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JobEvent — Legacy alias for backward compatibility.
 * New code should use AuditEventType directly.
 *
 * @deprecated Use AUDIT_EVENTS.* constants instead of string literals
 */
export type JobEvent = AuditEventType;

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
