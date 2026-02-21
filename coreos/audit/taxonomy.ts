/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Taxonomy (Phase 32.1 → 32.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Versioned, immutable, type-safe event classification for all Core OS
 * audit events. This file is the SINGLE SOURCE OF TRUTH for event types.
 *
 * Rules:
 *   1. No dynamic event types — every event must be declared here
 *   2. No string-literal event types elsewhere — import from this module
 *   3. Adding events requires a version bump
 *   4. Removing events is FORBIDDEN (append-only)
 *   5. traceId is MANDATORY — no event without trace correlation (Phase 32.2)
 *
 * @module coreos/audit/taxonomy
 * @version 1.0.1 (Phase 32.2)
 */

// ═══════════════════════════════════════════════════════════════════════════
// VERSION
// ═══════════════════════════════════════════════════════════════════════════

/** Taxonomy schema version — bump on event additions */
export const AUDIT_VERSION = '1.1.0' as const;

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPE ENUM (FROZEN)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * All valid audit event types in the Core OS.
 * Grouped by subsystem using dotted-path convention:
 *   group.category.action
 */
export type AuditEventType =
    // ─── Job Lifecycle ───────────────────────────────────────────────
    | 'job.lifecycle.enqueued'
    | 'job.lifecycle.claimed'
    | 'job.lifecycle.heartbeat'
    | 'job.lifecycle.completed'
    | 'job.lifecycle.failed'
    | 'job.lifecycle.retried'
    | 'job.lifecycle.dead'
    | 'job.lifecycle.stuck'
    | 'job.lifecycle.reaped'
    | 'job.lifecycle.suspended'
    | 'job.lifecycle.resumed'
    // ─── Job Ops ─────────────────────────────────────────────────────
    | 'job.ops.reaper_run'
    | 'job.ops.result_idempotent'
    | 'job.ops.claim_idempotent'
    | 'job.ops.priority_updated'
    // ─── Worker ──────────────────────────────────────────────────────
    | 'worker.registered'
    | 'worker.heartbeat'
    | 'worker.deregistered'
    | 'worker.signature_bypass'
    | 'worker.signature_bypassed_dev_mode'
    // ─── Auth ────────────────────────────────────────────────────────
    | 'auth.session_created'
    | 'auth.session_expired'
    | 'auth.session_revoked'
    | 'auth.session_invalid'
    | 'auth.login'
    | 'auth.logout'
    | 'auth.claims_updated'
    // ─── Policy ──────────────────────────────────────────────────────
    | 'policy.capability_denied'
    | 'policy.space_access_denied'
    | 'policy.capability_unknown'
    | 'policy.check_passed'
    // ─── Governance ──────────────────────────────────────────────────
    | 'governance.kernel_frozen'
    | 'governance.hash_validated'
    | 'governance.hash_tampered'
    | 'governance.decision_explained'
    // ─── System ──────────────────────────────────────────────────────
    | 'system.startup'
    | 'system.shutdown'
    | 'system.config_changed'
    | 'system.health_check'
    | 'system.filesystem_locked'
    // ─── Security ────────────────────────────────────────────────────
    | 'security.admin_gate_passed'
    | 'security.admin_gate_denied'
    | 'security.dev_mode_fatal'
    | 'security.rate_limited'
    // ─── Brain ───────────────────────────────────────────────────────
    | 'brain.request_processed'
    | 'brain.tool_call_blocked'
    | 'brain.proposal_created'
    | 'brain.proposal_approved'
    | 'brain.proposal_rejected'
    // ─── Process Lifecycle (Phase 15B) ──────────────────────────────
    | 'process.lifecycle.spawned'
    | 'process.lifecycle.transition'
    | 'process.lifecycle.priority'
    | 'process.lifecycle.terminated'
    // ─── Notification Center (Phase 18) ─────────────────────────────
    | 'notification.created'
    | 'notification.read'
    | 'notification.cleared'
    | 'notification.muted'
    // ─── Desktop Shortcuts (Phase 19.5) ─────────────────────────────
    | 'desktop.shortcut.created'
    | 'desktop.shortcut.removed'
    // ─── Virtual Spaces (Phase 20) ──────────────────────────────────
    | 'space.created'
    | 'space.activated'
    | 'space.window.moved'
    | 'space.removed'
    // ─── Spaces Hardening (Phase 20.5) ─────────────────────────────
    | 'space.renamed'
    | 'space.reordered'
    // ─── Appearance Manager (Phase 21) ──────────────────────────────
    | 'appearance.theme.changed'
    | 'appearance.accent.changed'
    | 'appearance.fontscale.changed'
    | 'appearance.wallpaper.changed'
    // ─── Accessibility (Phase 22) ─────────────────────────────────
    | 'a11y.highcontrast.changed'
    | 'a11y.reducedmotion.changed'
    | 'a11y.focusring.changed'
    // ─── Dev Packages (Phase 25) ─────────────────────────────────
    | 'dev.package.installed'
    | 'dev.package.uninstalled';

// ═══════════════════════════════════════════════════════════════════════════
// FROZEN EVENT MAP (readonly constant)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AUDIT_EVENTS — Frozen constant map for programmatic access.
 * Use: `AUDIT_EVENTS.JOB_ENQUEUED` instead of `'job.lifecycle.enqueued'`
 */
export const AUDIT_EVENTS = {
    // ─── Job Lifecycle ───
    JOB_ENQUEUED: 'job.lifecycle.enqueued',
    JOB_CLAIMED: 'job.lifecycle.claimed',
    JOB_HEARTBEAT: 'job.lifecycle.heartbeat',
    JOB_COMPLETED: 'job.lifecycle.completed',
    JOB_FAILED: 'job.lifecycle.failed',
    JOB_RETRIED: 'job.lifecycle.retried',
    JOB_DEAD: 'job.lifecycle.dead',
    JOB_STUCK: 'job.lifecycle.stuck',
    JOB_REAPED: 'job.lifecycle.reaped',
    JOB_SUSPENDED: 'job.lifecycle.suspended',
    JOB_RESUMED: 'job.lifecycle.resumed',

    // ─── Job Ops ───
    JOB_REAPER_RUN: 'job.ops.reaper_run',
    JOB_RESULT_IDEMPOTENT: 'job.ops.result_idempotent',
    JOB_CLAIM_IDEMPOTENT: 'job.ops.claim_idempotent',
    JOB_PRIORITY_UPDATED: 'job.ops.priority_updated',

    // ─── Worker ───
    WORKER_REGISTERED: 'worker.registered',
    WORKER_HEARTBEAT: 'worker.heartbeat',
    WORKER_DEREGISTERED: 'worker.deregistered',
    WORKER_SIGNATURE_BYPASS: 'worker.signature_bypass',
    WORKER_SIGNATURE_BYPASSED_DEV: 'worker.signature_bypassed_dev_mode',

    // ─── Auth ───
    AUTH_SESSION_CREATED: 'auth.session_created',
    AUTH_SESSION_EXPIRED: 'auth.session_expired',
    AUTH_SESSION_REVOKED: 'auth.session_revoked',
    AUTH_SESSION_INVALID: 'auth.session_invalid',
    AUTH_LOGIN: 'auth.login',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_CLAIMS_UPDATED: 'auth.claims_updated',

    // ─── Policy ───
    POLICY_CAPABILITY_DENIED: 'policy.capability_denied',
    POLICY_SPACE_ACCESS_DENIED: 'policy.space_access_denied',
    POLICY_CAPABILITY_UNKNOWN: 'policy.capability_unknown',
    POLICY_CHECK_PASSED: 'policy.check_passed',

    // ─── Governance ───
    GOVERNANCE_KERNEL_FROZEN: 'governance.kernel_frozen',
    GOVERNANCE_HASH_VALIDATED: 'governance.hash_validated',
    GOVERNANCE_HASH_TAMPERED: 'governance.hash_tampered',
    GOVERNANCE_DECISION_EXPLAINED: 'governance.decision_explained',

    // ─── System ───
    SYSTEM_STARTUP: 'system.startup',
    SYSTEM_SHUTDOWN: 'system.shutdown',
    SYSTEM_CONFIG_CHANGED: 'system.config_changed',
    SYSTEM_HEALTH_CHECK: 'system.health_check',
    SYSTEM_FILESYSTEM_LOCKED: 'system.filesystem_locked',

    // ─── Security ───
    SECURITY_ADMIN_GATE_PASSED: 'security.admin_gate_passed',
    SECURITY_ADMIN_GATE_DENIED: 'security.admin_gate_denied',
    SECURITY_DEV_MODE_FATAL: 'security.dev_mode_fatal',
    SECURITY_RATE_LIMITED: 'security.rate_limited',

    // ─── Brain ───
    BRAIN_REQUEST_PROCESSED: 'brain.request_processed',
    BRAIN_TOOL_CALL_BLOCKED: 'brain.tool_call_blocked',
    BRAIN_PROPOSAL_CREATED: 'brain.proposal_created',
    BRAIN_PROPOSAL_APPROVED: 'brain.proposal_approved',
    BRAIN_PROPOSAL_REJECTED: 'brain.proposal_rejected',

    // ─── Process Lifecycle (Phase 15B) ───
    PROCESS_SPAWNED: 'process.lifecycle.spawned',
    PROCESS_TRANSITION: 'process.lifecycle.transition',
    PROCESS_PRIORITY: 'process.lifecycle.priority',
    PROCESS_TERMINATED: 'process.lifecycle.terminated',

    // ─── Notification Center (Phase 18) ───
    NOTIFICATION_CREATED: 'notification.created',
    NOTIFICATION_READ: 'notification.read',
    NOTIFICATION_CLEARED: 'notification.cleared',
    NOTIFICATION_MUTED: 'notification.muted',

    // ─── Desktop Shortcuts (Phase 19.5) ───
    DESKTOP_SHORTCUT_CREATED: 'desktop.shortcut.created',
    DESKTOP_SHORTCUT_REMOVED: 'desktop.shortcut.removed',

    // ─── Virtual Spaces (Phase 20) ───
    SPACE_CREATED: 'space.created',
    SPACE_ACTIVATED: 'space.activated',
    SPACE_WINDOW_MOVED: 'space.window.moved',
    SPACE_REMOVED: 'space.removed',

    // ─── Spaces Hardening (Phase 20.5) ───
    SPACE_RENAMED: 'space.renamed',
    SPACE_REORDERED: 'space.reordered',

    // ─── Appearance Manager (Phase 21) ───
    APPEARANCE_THEME_CHANGED: 'appearance.theme.changed',
    APPEARANCE_ACCENT_CHANGED: 'appearance.accent.changed',
    APPEARANCE_FONTSCALE_CHANGED: 'appearance.fontscale.changed',
    APPEARANCE_WALLPAPER_CHANGED: 'appearance.wallpaper.changed',

    // ─── Accessibility (Phase 22) ───
    A11Y_HIGHCONTRAST_CHANGED: 'a11y.highcontrast.changed',
    A11Y_REDUCEDMOTION_CHANGED: 'a11y.reducedmotion.changed',
    A11Y_FOCUSRING_CHANGED: 'a11y.focusring.changed',

    // ─── Dev Packages (Phase 25) ───
    DEV_PACKAGE_INSTALLED: 'dev.package.installed',
    DEV_PACKAGE_UNINSTALLED: 'dev.package.uninstalled',
} as const satisfies Record<string, AuditEventType>;

// ═══════════════════════════════════════════════════════════════════════════
// SEVERITY LEVELS
// ═══════════════════════════════════════════════════════════════════════════

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

// ═══════════════════════════════════════════════════════════════════════════
// ACTOR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AuditActorType = 'user' | 'worker' | 'system' | 'brain';

export interface AuditActor {
    /** Actor classification */
    readonly type: AuditActorType;
    /** Actor identifier (UID, worker ID, or system component name) */
    readonly id: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT EVENT ENVELOPE (typed)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AuditEventEnvelope — The standard wrapper for every audit event.
 * All subsystems MUST use this shape when emitting audit events.
 */
export interface AuditEventEnvelope {
    /** Taxonomy version (must match AUDIT_VERSION) */
    readonly version: typeof AUDIT_VERSION;
    /** Event type from the frozen taxonomy */
    readonly event: AuditEventType;
    /** Distributed trace correlation ID */
    readonly traceId: string;
    /** Unix epoch timestamp (ms) */
    readonly timestamp: number;
    /** Who/what triggered this event */
    readonly actor?: AuditActor;
    /** Arbitrary structured context (subsystem-specific) */
    readonly context?: Record<string, unknown>;
    /** Event severity classification */
    readonly severity: AuditSeverity;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a type-safe audit envelope with defaults.
 *
 * @example
 * const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_ENQUEUED, {
 *     traceId: job.traceId,
 *     severity: 'INFO',
 *     actor: { type: 'system', id: 'job-queue' },
 *     context: { jobId: job.id, jobType: job.type },
 * });
 */
export function createAuditEnvelope(
    event: AuditEventType,
    opts: Omit<AuditEventEnvelope, 'version' | 'event' | 'timestamp'> & {
        timestamp?: number;
    },
): AuditEventEnvelope {
    // ── Phase 32.2: Trace Invariant ──────────────────────────────────
    // traceId is the "DNA of every event" — it MUST never be absent.
    if (!opts.traceId) {
        throw new TypeError(
            `[AuditTaxonomy] traceId is required for event '${event}'. ` +
            'Every audit event must be traceable. Pass a valid traceId or ' +
            'use extractOrGenerateTraceId() from lib/platform/trace/server.',
        );
    }

    return {
        version: AUDIT_VERSION,
        event,
        timestamp: opts.timestamp ?? Date.now(),
        traceId: opts.traceId,
        severity: opts.severity,
        ...(opts.actor && { actor: opts.actor }),
        ...(opts.context && { context: opts.context }),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT GROUP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** All unique event group prefixes */
export const AUDIT_GROUPS = [
    'job.lifecycle',
    'job.ops',
    'worker',
    'auth',
    'policy',
    'governance',
    'system',
    'security',
    'brain',
    'process.lifecycle',
] as const;

export type AuditGroup = (typeof AUDIT_GROUPS)[number];

/** Check if an event belongs to a specific group */
export function isEventInGroup(event: AuditEventType, group: AuditGroup): boolean {
    return event.startsWith(group + '.');
}
