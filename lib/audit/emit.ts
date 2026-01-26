/**
 * Audit Event Emit Helper
 * 
 * Centralized helper for emitting audit events to Firestore.
 * Based on: docs/design/audit_event_schema.md
 *           docs/design/audit_emit_helper_plan.md
 * 
 * RESPONSIBILITIES:
 * - Validate event payload
 * - Enrich common fields (timestamp, actor context)
 * - Persist to Firestore
 * - Error handling (log-safe, no throw)
 * 
 * NON-RESPONSIBILITIES:
 * - Permission decisions
 * - Retry/queue
 * - Analytics
 * - Business logic
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { PlatformRole } from '@/lib/platform/types';

// =============================================================================
// TYPES (Based on audit_event_schema.md)
// =============================================================================

export type AuditEventType = 'permission' | 'org' | 'user' | 'role' | 'auth';

export interface AuditActor {
    uid: string;
    email: string;
    role: PlatformRole;
}

export interface AuditTarget {
    uid?: string;
    email?: string;
    id?: string;
    type?: 'org' | 'user' | 'role';
    name?: string;
}

export interface AuditEventPayload {
    eventType: AuditEventType;
    action: string;
    actor: AuditActor;
    target?: AuditTarget;
    success: boolean;
    requiredRole?: string;
    actualRole?: string;
    requiredPermission?: string;
    method?: string;
    path?: string;
    details?: Record<string, unknown>;
}

export interface AuditEvent extends AuditEventPayload {
    id?: string;
    timestamp: Date;
}

// =============================================================================
// SENSITIVE KEYS (REDACT THESE)
// =============================================================================

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'credential', 'auth'];

function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
        // Check if key contains sensitive words
        const isSensitive = SENSITIVE_KEYS.some(
            sensitiveKey => key.toLowerCase().includes(sensitiveKey)
        );

        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeDetails(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

// =============================================================================
// EMIT HELPER (Log-Safe)
// =============================================================================

/**
 * Emit an audit event to Firestore.
 * 
 * IMPORTANT: This function will NEVER throw an error.
 * Audit failure should not break the main business operation.
 * 
 * @param payload - The audit event payload
 * @returns Promise<boolean> - true if successful, false if failed
 */
export async function emitAuditEvent(payload: AuditEventPayload): Promise<boolean> {
    try {
        const db = getAdminFirestore();

        // Build the audit event with server timestamp
        const auditEvent: Record<string, unknown> = {
            eventType: payload.eventType,
            action: payload.action,
            timestamp: FieldValue.serverTimestamp(),
            actor: {
                uid: payload.actor.uid,
                email: payload.actor.email,
                role: payload.actor.role,
            },
            success: payload.success,
        };

        // Add optional target
        if (payload.target) {
            auditEvent.target = payload.target;
        }

        // Add denial-specific fields
        if (!payload.success) {
            if (payload.requiredRole) {
                auditEvent.requiredRole = payload.requiredRole;
            }
            if (payload.actualRole) {
                auditEvent.actualRole = payload.actualRole;
            }
            if (payload.requiredPermission) {
                auditEvent.requiredPermission = payload.requiredPermission;
            }
        }

        // Add request context
        if (payload.method) {
            auditEvent.method = payload.method;
        }
        if (payload.path) {
            auditEvent.path = payload.path;
        }

        // Add sanitized details
        if (payload.details) {
            auditEvent.details = sanitizeDetails(payload.details);
        }

        // Write to Firestore
        await db.collection('platform_audit_logs').add(auditEvent);

        if (process.env.NODE_ENV === 'development') {
            console.log('[AUDIT] Event emitted:', {
                eventType: payload.eventType,
                action: payload.action,
                success: payload.success,
            });
        }

        return true;
    } catch (error) {
        // Log-safe: never throw, just log
        console.error('[AUDIT] Failed to emit event:', error);
        console.error('[AUDIT] Payload was:', {
            eventType: payload.eventType,
            action: payload.action,
            success: payload.success,
        });
        return false;
    }
}

// =============================================================================
// CONVENIENCE HELPERS
// =============================================================================

/**
 * Emit a success audit event
 */
export async function emitSuccessEvent(
    eventType: AuditEventType,
    action: string,
    actor: AuditActor,
    target?: AuditTarget,
    details?: Record<string, unknown>,
    requestContext?: { method: string; path: string }
): Promise<boolean> {
    return emitAuditEvent({
        eventType,
        action,
        actor,
        target,
        success: true,
        details,
        method: requestContext?.method,
        path: requestContext?.path,
    });
}

/**
 * Emit a permission denied audit event
 */
export async function emitDenialEvent(
    actor: AuditActor,
    requiredRole: string,
    requestContext: { method: string; path: string },
    details?: Record<string, unknown>
): Promise<boolean> {
    return emitAuditEvent({
        eventType: 'permission',
        action: 'denied',
        actor,
        success: false,
        requiredRole,
        actualRole: actor.role,
        method: requestContext.method,
        path: requestContext.path,
        details,
    });
}

/**
 * Emit a permission denied event for permission-based guards
 */
export async function emitPermissionDenialEvent(
    actor: AuditActor,
    requiredPermission: string,
    requestContext: { method: string; path: string },
    details?: Record<string, unknown>
): Promise<boolean> {
    return emitAuditEvent({
        eventType: 'permission',
        action: 'denied',
        actor,
        success: false,
        requiredPermission,
        actualRole: actor.role,
        method: requestContext.method,
        path: requestContext.path,
        details,
    });
}
