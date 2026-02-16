/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Role-Based Audit Redaction (Phase 32.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Controls what each role can see in audit events.
 * Every audit event MUST pass through this layer before being exposed.
 *
 * Roles (most → least privileged):
 *   owner  → full visibility
 *   admin  → sanitized (signatures masked)
 *   user   → restricted (sensitive fields removed/masked)
 *   system → minimal (structural fields only)
 *
 * Operations:
 *   visible → no change
 *   masked  → replace value with '***'
 *   removed → delete field entirely
 *   hashed  → SHA-256 first 8 chars (deterministic, irreversible)
 *
 * @module coreos/audit/redaction
 * @version 1.0.0 (Phase 32.3)
 */

import { createHash } from 'crypto';
import type { AuditEventEnvelope, AuditActor } from './taxonomy';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Roles that determine redaction level */
export type RedactionRole = 'owner' | 'admin' | 'user' | 'system';

/** Actions that can be applied to a field */
export type RedactionAction = 'visible' | 'masked' | 'removed' | 'hashed';

/** Policy for a single sensitive field across all roles */
export interface FieldPolicy {
    /** Dot-path field name within context (e.g. 'signature', 'payload') */
    readonly field: string;
    readonly owner: RedactionAction;
    readonly admin: RedactionAction;
    readonly user: RedactionAction;
    readonly system: RedactionAction;
}

// ═══════════════════════════════════════════════════════════════════════════
// REDACTION POLICY MAP (FROZEN)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SENSITIVE_FIELDS — The frozen policy matrix.
 * Each entry defines how a context field is treated per role.
 *
 * Fields not listed here are VISIBLE to all roles by default.
 */
export const SENSITIVE_FIELDS: readonly FieldPolicy[] = [
    //                              owner      admin      user       system
    { field: 'signature', owner: 'visible', admin: 'masked', user: 'removed', system: 'removed' },
    { field: 'signatureBypass', owner: 'visible', admin: 'masked', user: 'removed', system: 'removed' },
    { field: 'receivedSigPrefix', owner: 'visible', admin: 'masked', user: 'removed', system: 'removed' },
    { field: 'expectedSigPrefix', owner: 'visible', admin: 'masked', user: 'removed', system: 'removed' },
    { field: 'workerId', owner: 'visible', admin: 'visible', user: 'masked', system: 'visible' },
    { field: 'payload', owner: 'visible', admin: 'visible', user: 'removed', system: 'removed' },
    { field: 'policyReason', owner: 'visible', admin: 'visible', user: 'removed', system: 'removed' },
    { field: 'error', owner: 'visible', admin: 'visible', user: 'masked', system: 'removed' },
    { field: 'originalTicket', owner: 'visible', admin: 'visible', user: 'removed', system: 'removed' },
    { field: 'rawPayload', owner: 'visible', admin: 'visible', user: 'removed', system: 'removed' },
] as const;

/**
 * Actor ID redaction policy (separate from context fields).
 *
 *   owner/admin → visible
 *   user        → hashed
 *   system      → removed
 */
const ACTOR_ID_POLICY: Record<RedactionRole, RedactionAction> = {
    owner: 'visible',
    admin: 'visible',
    user: 'hashed',
    system: 'removed',
};

// ═══════════════════════════════════════════════════════════════════════════
// REDACTION OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hash a value deterministically using SHA-256 (first 8 hex chars).
 * Same input always produces same output — useful for correlation
 * without revealing the original value.
 */
export function hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex').substring(0, 8);
}

/** Mask indicator for redacted fields */
const MASK = '***';

/**
 * Apply a redaction action to a value.
 *
 * @returns [newValue, shouldRemove]
 *   - visible → [original, false]
 *   - masked  → ['***', false]
 *   - removed → [undefined, true]
 *   - hashed  → [hash, false]
 */
function applyAction(
    value: unknown,
    action: RedactionAction,
): [unknown, boolean] {
    switch (action) {
        case 'visible':
            return [value, false];
        case 'masked':
            return [MASK, false];
        case 'removed':
            return [undefined, true];
        case 'hashed':
            return [hashValue(String(value)), false];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate and normalize a role. Unknown roles default to 'system'
 * (most restrictive) for safety.
 */
function normalizeRole(role: string): RedactionRole {
    const valid: RedactionRole[] = ['owner', 'admin', 'user', 'system'];
    return valid.includes(role as RedactionRole)
        ? (role as RedactionRole)
        : 'system';
}

/**
 * Redact the `context` object based on role policies.
 * Returns a new context with sensitive fields masked/removed/hashed.
 */
function redactContext(
    context: Record<string, unknown>,
    role: RedactionRole,
): Record<string, unknown> | undefined {
    const result: Record<string, unknown> = { ...context };

    for (const policy of SENSITIVE_FIELDS) {
        if (!(policy.field in result)) continue;

        const action = policy[role];
        const [newValue, shouldRemove] = applyAction(result[policy.field], action);

        if (shouldRemove) {
            delete result[policy.field];
        } else {
            result[policy.field] = newValue;
        }
    }

    // If all fields removed, return undefined to clean envelope
    return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Redact the `actor` field based on role policy.
 * Returns a new actor or undefined if fully redacted.
 */
function redactActor(
    actor: AuditActor,
    role: RedactionRole,
): AuditActor | undefined {
    const action = ACTOR_ID_POLICY[role];
    const [newId, shouldRemove] = applyAction(actor.id, action);

    if (shouldRemove) {
        return undefined;
    }

    return {
        type: actor.type,
        id: newId as string,
    };
}

/**
 * redactAuditEvent — Core redaction engine.
 *
 * Takes a full AuditEventEnvelope and a viewer's role,
 * returns a sanitized copy. The structural fields
 * (version, event, traceId, timestamp, severity) are NEVER redacted.
 *
 * @param envelope  Full audit event envelope
 * @param role      Viewer's role ('owner' | 'admin' | 'user' | 'system')
 * @returns         Sanitized envelope (new object, original untouched)
 */
export function redactAuditEvent(
    envelope: AuditEventEnvelope,
    role: RedactionRole,
): AuditEventEnvelope {
    const safeRole = normalizeRole(role);

    // Owner sees everything — fast path
    if (safeRole === 'owner') {
        return { ...envelope };
    }

    // Structural fields — always preserved
    const base: AuditEventEnvelope = {
        version: envelope.version,
        event: envelope.event,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        severity: envelope.severity,
    };

    // Redact context
    const redactedContext = envelope.context
        ? redactContext(envelope.context, safeRole)
        : undefined;

    // Redact actor
    const redactedActor = envelope.actor
        ? redactActor(envelope.actor, safeRole)
        : undefined;

    return {
        ...base,
        ...(redactedContext && { context: redactedContext }),
        ...(redactedActor && { actor: redactedActor }),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION HOOK (Phase 32.4 will consume this)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * getRedactedAuditEvent — Public integration API.
 *
 * Thin wrapper around redactAuditEvent for consistency.
 * UI layers (Phase 32.4) should use this function.
 *
 * @param envelope   Full audit event envelope
 * @param actorRole  Viewer's role
 * @returns          Redacted envelope safe to expose
 */
export function getRedactedAuditEvent(
    envelope: AuditEventEnvelope,
    actorRole: RedactionRole,
): AuditEventEnvelope {
    return redactAuditEvent(envelope, actorRole);
}
