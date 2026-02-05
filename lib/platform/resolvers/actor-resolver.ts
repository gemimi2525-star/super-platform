/**
 * Actor Truth Resolver
 * 
 * Phase 13: Governance Legibility & Actor Truth
 * 
 * Resolves actor information from various audit log formats to produce
 * truthful, human-readable actor identification.
 * 
 * RULES:
 * - NO fake data - use actual session/service info
 * - NEVER return "-" as displayName
 * - Prefer email over UID for users
 * - Default to "system" for background operations
 */

import type { AuditActor } from '../types/audit-view-model';

/**
 * Actor resolution input from various audit log formats.
 */
interface ActorResolutionInput {
    // Platform audit repo format
    actorId?: string;
    actorRole?: string;

    // API response format
    actor?: {
        uid?: string;
        email?: string;
    };

    // Action context
    action?: string;
    eventType?: string;
}

/**
 * Resolve actor information with truthful identification.
 * 
 * Resolution priority:
 * 1. User with email (from session)
 * 2. User with UID only
 * 3. Service account
 * 4. System/background
 * 
 * @param data - Mixed format audit log data
 * @returns Resolved actor with kind and display name
 */
export function resolveActor(data: ActorResolutionInput): AuditActor {
    // Priority 1: User actor from session with email
    if (data.actor?.email) {
        return {
            kind: 'user',
            displayName: data.actor.email,
            actorId: data.actor.uid || data.actorId,
        };
    }

    // Priority 2: User actor with UID only (extract email-like format if possible)
    if (data.actor?.uid) {
        return {
            kind: 'user',
            displayName: data.actor.uid.includes('@') ? data.actor.uid : `user-${data.actor.uid.slice(0, 8)}`,
            actorId: data.actor.uid,
        };
    }

    // Priority 3: Service actor (identified by role or action pattern)
    if (data.actorRole === 'service' ||
        data.action?.startsWith('system.') ||
        data.action?.startsWith('api.')) {
        return {
            kind: 'service',
            displayName: 'platform-api',
            actorId: data.actorId || 'service',
        };
    }

    // Priority 4: System/background actor (explicit or default fallback)
    if (data.actorId === 'system' ||
        data.actorRole === 'system' ||
        !data.actorId) {
        return {
            kind: 'system',
            displayName: 'system',
            actorId: 'system',
        };
    }

    // Fallback: User with partial actorId info
    // (likely from old audit entries before session tracking)
    return {
        kind: 'user',
        displayName: data.actorId.includes('@')
            ? data.actorId
            : `user-${data.actorId.slice(0, 8)}`,
        actorId: data.actorId,
    };
}

/**
 * Validate that actor resolution never returns "-" or empty displayName.
 * 
 * @param actor - Resolved actor
 * @throws Error if displayName is invalid
 */
export function validateActor(actor: AuditActor): void {
    if (!actor.displayName ||
        actor.displayName === '-' ||
        actor.displayName.trim() === '') {
        throw new Error(`Invalid actor displayName: "${actor.displayName}"`);
    }
}
