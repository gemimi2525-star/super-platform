/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/audit — Audit Log Query Engine (Phase 32.4)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production audit query endpoint with:
 *   - requireAdmin() guard (owner/admin only)
 *   - Firestore index-friendly filters
 *   - Cursor-based pagination
 *   - Role-based redaction (Phase 32.3)
 *
 * Query params:
 *   eventPrefix  — filter by event prefix (e.g. 'job.lifecycle')
 *   severity     — filter by severity (INFO|WARN|ERROR|CRITICAL)
 *   traceId      — exact match on traceId
 *   actorId      — exact match on actorId
 *   since        — ISO timestamp lower bound
 *   until        — ISO timestamp upper bound
 *   limit        — results per page (default 50, max 100)
 *   cursor       — pagination cursor (last doc ID)
 *
 * @module app/api/ops/audit/route
 * @version 2.0.0 (Phase 32.4)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getRedactedAuditEvent } from '@/coreos/audit/redaction';
import type { RedactionRole } from '@/coreos/audit/redaction';
import { isQuotaError } from '@/lib/firebase-admin';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLLECTION = 'platform_audit_logs';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// ═══════════════════════════════════════════════════════════════════════════
// QUERY PARAM PARSER
// ═══════════════════════════════════════════════════════════════════════════

interface AuditQueryParams {
    eventPrefix?: string;
    severity?: string;
    traceId?: string;
    actorId?: string;
    since?: string;
    until?: string;
    limit: number;
    cursor?: string;
}

function parseQueryParams(searchParams: URLSearchParams): AuditQueryParams {
    const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    return {
        eventPrefix: searchParams.get('eventPrefix') || undefined,
        severity: searchParams.get('severity') || undefined,
        traceId: searchParams.get('traceId') || undefined,
        actorId: searchParams.get('actorId') || undefined,
        since: searchParams.get('since') || undefined,
        until: searchParams.get('until') || undefined,
        limit: Math.max(1, Math.min(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, MAX_LIMIT)),
        cursor: searchParams.get('cursor') || undefined,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE RESOLVER
// ═══════════════════════════════════════════════════════════════════════════

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';

function resolveRedactionRole(uid: string): RedactionRole {
    return uid === SUPER_ADMIN_ID ? 'owner' : 'admin';
}

// ═══════════════════════════════════════════════════════════════════════════
// GET HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        // ── Auth Guard ──────────────────────────────────────────────────
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        const role = resolveRedactionRole(guard.uid);
        const params = parseQueryParams(request.nextUrl.searchParams);

        // ── Firestore Query ─────────────────────────────────────────────
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        let query: FirebaseFirestore.Query = db
            .collection(COLLECTION)
            .orderBy('timestamp', 'desc');

        // Apply Firestore-safe filters (only fields with guaranteed indexes)
        if (params.traceId) {
            query = query.where('traceId', '==', params.traceId);
        }
        // NOTE: severity, actorId, eventPrefix are filtered post-query
        // to avoid composite index requirements on legacy data

        // Cursor pagination
        if (params.cursor) {
            try {
                const cursorDoc = await db.collection(COLLECTION).doc(params.cursor).get();
                if (cursorDoc.exists) {
                    query = query.startAfter(cursorDoc);
                }
            } catch {
                // Invalid cursor — ignore, start from beginning
            }
        }

        // Fetch extra docs to allow for post-query filtering
        const fetchLimit = params.severity || params.actorId || params.eventPrefix
            ? Math.min((params.limit + 1) * 3, 300)
            : params.limit + 1;
        query = query.limit(fetchLimit);

        const snapshot = await query.get();
        let docs = snapshot.docs;

        // ── Post-query filters (for fields without composite indexes) ───
        if (params.severity) {
            docs = docs.filter(doc => {
                const data = doc.data();
                const sev = data.severity || 'INFO';
                return sev === params.severity;
            });
        }
        if (params.actorId) {
            docs = docs.filter(doc => {
                const data = doc.data();
                return data.actor?.uid === params.actorId || data.actor?.id === params.actorId;
            });
        }
        if (params.eventPrefix) {
            docs = docs.filter(doc => {
                const data = doc.data();
                const event = data.event || data.action || '';
                return event.startsWith(params.eventPrefix!);
            });
        }

        const hasMore = docs.length > params.limit;
        const resultDocs = hasMore ? docs.slice(0, params.limit) : docs;

        // ── Build Response (with redaction) ─────────────────────────────
        const items = resultDocs.map(doc => {
            const data = doc.data();

            // Normalize timestamp: Firestore Timestamp → epoch ms
            let ts = data.timestamp || 0;
            if (ts && typeof ts === 'object') {
                if (typeof ts.toDate === 'function') {
                    ts = ts.toDate().getTime();
                } else if (ts._seconds) {
                    ts = ts._seconds * 1000;
                }
            } else if (typeof ts === 'string') {
                ts = new Date(ts).getTime();
            }

            // Normalize actor: legacy {uid, email, role} → {type, id}
            let actor = data.actor;
            if (actor && !actor.type && actor.uid) {
                actor = {
                    type: actor.role || 'user',
                    id: actor.uid,
                    email: actor.email,
                };
            }

            // Normalize to AuditEventEnvelope shape for redaction
            const envelope = {
                version: data.version || '1.0.1',
                event: data.event || data.action || 'unknown',
                traceId: data.traceId || '',
                timestamp: ts,
                severity: data.severity || data.status === 'error' ? 'ERROR' : 'INFO',
                ...(actor && { actor }),
                ...(data.context && { context: data.context }),
                // Preserve extra fields as context for legacy logs
                ...(!data.context && data.details && { context: data.details }),
                ...(!data.context && data.metadata && { context: data.metadata }),
            };

            const redacted = getRedactedAuditEvent(envelope as any, role);

            return {
                id: doc.id,
                ...redacted,
            };
        });

        const nextCursor = hasMore
            ? resultDocs[resultDocs.length - 1].id
            : null;

        const response = NextResponse.json({
            ok: true,
            data: {
                items,
                nextCursor,
                count: items.length,
                role,
            },
        });

        response.headers.set('Cache-Control', 'private, max-age=10');
        return response;

    } catch (error: any) {
        if (isQuotaError(error) || error?.code === 'SERVICE_UNAVAILABLE') {
            return NextResponse.json(
                { ok: false, error: 'Audit logs unavailable (quota exceeded)', retryAfter: 60 },
                { status: 503 },
            );
        }

        console.error('[API/ops/audit] Unhandled error:', error?.message);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}
