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

        // Apply filters (index-friendly: equality filters before range)
        if (params.traceId) {
            query = query.where('traceId', '==', params.traceId);
        }
        if (params.severity) {
            query = query.where('severity', '==', params.severity);
        }
        if (params.actorId) {
            query = query.where('actor.id', '==', params.actorId);
        }
        if (params.since) {
            const sinceTs = new Date(params.since).getTime();
            if (!isNaN(sinceTs)) {
                query = query.where('timestamp', '>=', sinceTs);
            }
        }
        if (params.until) {
            const untilTs = new Date(params.until).getTime();
            if (!isNaN(untilTs)) {
                query = query.where('timestamp', '<=', untilTs);
            }
        }

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

        // Limit + 1 to detect if there are more results
        query = query.limit(params.limit + 1);

        const snapshot = await query.get();
        const docs = snapshot.docs;
        const hasMore = docs.length > params.limit;
        const resultDocs = hasMore ? docs.slice(0, params.limit) : docs;

        // ── Build Response (with redaction) ─────────────────────────────
        const items = resultDocs.map(doc => {
            const data = doc.data();

            // Normalize to AuditEventEnvelope shape for redaction
            const envelope = {
                version: data.version || '1.0.1',
                event: data.event || data.action || 'unknown',
                traceId: data.traceId || '',
                timestamp: data.timestamp || 0,
                severity: data.severity || 'INFO',
                ...(data.actor && { actor: data.actor }),
                ...(data.context && { context: data.context }),
                // Preserve extra fields as context for legacy logs
                ...(!data.context && data.details && { context: data.details }),
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
