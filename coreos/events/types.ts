/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Types (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical type definitions for the deterministic OS Event Bus.
 * All events flow through a single pipeline with typed envelopes.
 *
 * @module coreos/events/types
 */

// ─── Domains ───────────────────────────────────────────────────────────

export type OSEventDomain =
    | 'os'
    | 'process'
    | 'offline'
    | 'governance'
    | 'vfs'
    | 'ui';

// ─── Event Types ───────────────────────────────────────────────────────

export type OSEventType =
    // Process lifecycle (Phase 15B)
    | 'process.spawned'
    | 'process.terminated'
    | 'process.suspended'
    // Offline kernel (Phase 36)
    | 'offline.entered'
    | 'offline.exited'
    // Reserved (no-emit from bus — audit-only)
    | 'notification.created'
    | 'audit.logged';

// ─── Actor ─────────────────────────────────────────────────────────────

export interface OSEventActor {
    readonly uid?: string;
    readonly role?: string;
}

// ─── Source ─────────────────────────────────────────────────────────────

export interface OSEventSource {
    readonly appId?: string;
    readonly module: string;
}

// ─── Severity ──────────────────────────────────────────────────────────

export type OSEventSeverity = 'info' | 'warning' | 'error';

// ─── Event Envelope (Canonical) ────────────────────────────────────────

export interface OSEventEnvelope {
    /** Deterministic ID (timestamp-based + seq) */
    readonly id: string;

    /** ISO 8601 timestamp */
    readonly ts: string;

    /** Monotonic sequence number (session-scoped) */
    readonly seq: number;

    /** Event type */
    readonly type: OSEventType;

    /** Domain classification */
    readonly domain: OSEventDomain;

    /** Actor who triggered the event */
    readonly actor: OSEventActor;

    /** Source module/app */
    readonly source: OSEventSource;

    /** Severity level */
    readonly severity: OSEventSeverity;

    /** Dedupe key for calm-first spam prevention */
    readonly dedupeKey?: string;

    /** Arbitrary JSON payload */
    readonly payload: Record<string, unknown>;
}

// ─── Input (for publish) ───────────────────────────────────────────────

export interface OSEventInput {
    type: OSEventType;
    domain: OSEventDomain;
    source: OSEventSource;
    severity?: OSEventSeverity;
    dedupeKey?: string;
    payload?: Record<string, unknown>;
}

// ─── Subscriber ────────────────────────────────────────────────────────

export type OSEventHandler = (event: OSEventEnvelope) => void;

export type OSEventFilter =
    | OSEventType
    | `${string}.*`
    | ((event: OSEventEnvelope) => boolean);
