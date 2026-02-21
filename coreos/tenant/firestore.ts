/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tenant Firestore Service (Phase 29.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-side Firestore operations for tenant management.
 * Uses getAdminFirestore() from @/lib/firebase-admin.
 * All paths use typed constructors from collections.ts.
 */

import type {
    TenantId, UserId, SessionId, TenantRole,
    TenantDoc, TenantMemberDoc, SessionDoc, TenantMembership,
    SessionContext,
} from './types';
import { SESSION_EXPIRY_MS } from './types';
import {
    tenantDocPath, memberDocPath, membersColPath,
    sessionDocPath, sessionsColPath,
    auditColPath,
} from './collections';

// ─── Tenant CRUD ────────────────────────────────────────────────────────

export async function createTenant(
    tenantId: TenantId,
    name: string,
    ownerUserId: UserId,
): Promise<TenantDoc> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const now = new Date().toISOString();

    const doc: TenantDoc = {
        name,
        createdAt: now,
        plan: 'free',
        ownerUserId,
        status: 'active',
    };

    await db.doc(tenantDocPath(tenantId)).set(doc);

    // Also create owner membership
    const memberDoc: TenantMemberDoc = {
        role: 'owner',
        status: 'active',
        invitedAt: now,
        joinedAt: now,
    };
    await db.doc(memberDocPath(tenantId, ownerUserId)).set(memberDoc);

    return doc;
}

// ─── Membership ─────────────────────────────────────────────────────────

export async function getMemberships(userId: UserId): Promise<TenantMembership[]> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();

    // Query all tenants where user has a member doc
    // Strategy: use collectionGroup query on 'members' where doc ID matches userId
    // However, collectionGroup requires index. Simpler: scan tenants collection,
    // then check membership. For MVP with small tenant count this is fine.
    const tenantsSnap = await db.collection('tenants').get();
    const results: TenantMembership[] = [];

    for (const tenantSnap of tenantsSnap.docs) {
        const memberSnap = await db.doc(memberDocPath(tenantSnap.id, userId)).get();
        if (memberSnap.exists) {
            const member = memberSnap.data() as TenantMemberDoc;
            if (member.status === 'active') {
                const tenant = tenantSnap.data() as TenantDoc;
                results.push({
                    tenantId: tenantSnap.id,
                    tenantName: tenant.name,
                    role: member.role,
                    status: member.status,
                });
            }
        }
    }

    return results;
}

export async function validateMembership(
    tenantId: TenantId,
    userId: UserId,
): Promise<TenantMemberDoc | null> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const snap = await db.doc(memberDocPath(tenantId, userId)).get();
    if (!snap.exists) return null;
    const member = snap.data() as TenantMemberDoc;
    return member.status === 'active' ? member : null;
}

// ─── Sessions ───────────────────────────────────────────────────────────

export async function createSession(
    tenantId: TenantId,
    userId: UserId,
    role: TenantRole,
    deviceId?: string,
): Promise<{ sessionId: SessionId; session: SessionDoc }> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();

    const session: SessionDoc = {
        userId,
        roleSnapshot: role,
        createdAt: now,
        lastSeenAt: now,
        deviceId,
    };

    await db.doc(sessionDocPath(tenantId, sessionId)).set(session);
    return { sessionId, session };
}

export async function validateSession(
    tenantId: TenantId,
    sessionId: SessionId,
    userId: UserId,
): Promise<SessionDoc | null> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const snap = await db.doc(sessionDocPath(tenantId, sessionId)).get();
    if (!snap.exists) return null;

    const session = snap.data() as SessionDoc;

    // Check ownership
    if (session.userId !== userId) return null;
    // Check revocation
    if (session.revokedAt) return null;
    // Check expiry
    if (Date.now() - new Date(session.lastSeenAt).getTime() > SESSION_EXPIRY_MS) return null;

    return session;
}

export async function revokeSession(
    tenantId: TenantId,
    sessionId: SessionId,
): Promise<void> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    await db.doc(sessionDocPath(tenantId, sessionId)).update({
        revokedAt: new Date().toISOString(),
    });
}

export async function touchSession(
    tenantId: TenantId,
    sessionId: SessionId,
): Promise<void> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    await db.doc(sessionDocPath(tenantId, sessionId)).update({
        lastSeenAt: new Date().toISOString(),
    });
}

// ─── Per-tenant Audit (Phase 29.2) ──────────────────────────────────────

export async function writeTenantAudit(
    ctx: SessionContext,
    eventType: string,
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    payload: Record<string, unknown>,
    traceId?: string,
): Promise<string> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const now = new Date().toISOString();
    const eventId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const entry = {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        role: ctx.role,
        traceId: traceId || `trace-${eventId}`,
        eventType,
        severity,
        ts: now,
        payload,
    };

    await db.collection(auditColPath(ctx.tenantId)).doc(eventId).set(entry);
    return eventId;
}

export async function queryTenantAudit(
    tenantId: TenantId,
    limit = 50,
): Promise<Array<Record<string, unknown>>> {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();
    const snap = await db.collection(auditColPath(tenantId))
        .orderBy('ts', 'desc')
        .limit(limit)
        .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
