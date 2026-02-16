/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/audit — Audit Log Query Engine (Phase 32.4, Hardened v2.1.0)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production audit query endpoint — ZERO 500 GUARANTEE
 *
 *   - requireAdmin() guard (owner/admin only)
 *   - Firestore single-field queries only (no composite index dependency)
 *   - Post-query filtering for severity/actorId/eventPrefix
 *   - Safe normalization for legacy Firestore documents
 *   - Cursor-based pagination with auto-reset on filter change
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
 * @version 2.1.0 (Phase 32.4 Hardened)
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
// SAFE NORMALIZATION HELPERS (must NEVER throw)
// ═══════════════════════════════════════════════════════════════════════════

/** Safely normalize any timestamp format to epoch ms. Returns 0 on failure. */
function safeTimestamp(raw: any): number {
    try {
        if (!raw) return 0;
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'object' && typeof raw.toDate === 'function') {
            const d = raw.toDate();
            const ms = d.getTime();
            return isNaN(ms) ? 0 : ms;
        }
        if (typeof raw === 'object' && raw._seconds) {
            return raw._seconds * 1000;
        }
        if (typeof raw === 'string') {
            const ms = new Date(raw).getTime();
            return isNaN(ms) ? 0 : ms;
        }
        return 0;
    } catch {
        return 0;
    }
}

/** Safely normalize actor to {type, id, email?}. Returns undefined on failure. */
function safeActor(raw: any): { type: string; id: string; email?: string } | undefined {
    try {
        if (!raw || typeof raw !== 'object') return undefined;
        // Already normalized
        if (raw.type && raw.id) return { type: raw.type, id: raw.id, ...(raw.email && { email: raw.email }) };
        // Legacy format: {uid, email, role}
        if (raw.uid) return { type: raw.role || 'user', id: raw.uid, ...(raw.email && { email: raw.email }) };
        return undefined;
    } catch {
        return undefined;
    }
}

/** Safely normalize a Firestore doc to an AuditEventEnvelope. NEVER throws. */
function safeNormalize(docId: string, data: any): any {
    try {
        const ts = safeTimestamp(data.timestamp);
        const actor = safeActor(data.actor);

        // Fix operator precedence: severity defaults
        const severity = data.severity
            ? data.severity
            : (data.status === 'error' ? 'ERROR' : 'INFO');

        const envelope: any = {
            version: data.version || '1.0.1',
            event: data.event || data.action || 'unknown',
            traceId: data.traceId || '',
            timestamp: ts,
            severity,
        };

        if (actor) envelope.actor = actor;

        // Merge context: prefer data.context, fallback to details or metadata
        const ctx = data.context || data.details || data.metadata;
        if (ctx && typeof ctx === 'object') {
            envelope.context = ctx;
        }

        return envelope;
    } catch {
        // Absolute fallback — return minimal valid shape
        return {
            version: '1.0.1',
            event: 'unknown',
            traceId: '',
            timestamp: 0,
            severity: 'INFO',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST-QUERY FILTER HELPERS (must NEVER throw)
// ═══════════════════════════════════════════════════════════════════════════

function filterBySeverity(docs: any[], severity: string): any[] {
    try {
        return docs.filter(doc => {
            const sev = doc.data()?.severity || 'INFO';
            return sev === severity;
        });
    } catch {
        return [];
    }
}

function filterByActorId(docs: any[], actorId: string): any[] {
    try {
        return docs.filter(doc => {
            const actor = doc.data()?.actor;
            return actor?.uid === actorId || actor?.id === actorId;
        });
    } catch {
        return [];
    }
}

function filterByEventPrefix(docs: any[], prefix: string): any[] {
    try {
        return docs.filter(doc => {
            const data = doc.data();
            const event = data?.event || data?.action || '';
            return typeof event === 'string' && event.startsWith(prefix);
        });
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET HANDLER — ZERO 500 GUARANTEE
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

        // ── Cursor Reset Rule ───────────────────────────────────────────
        // If any filter is active alongside cursor, we must validate
        // the cursor belongs to the same query scope. Since we can't
        // guarantee this cheaply, we only use cursor when NO filters
        // are active (or traceId-only which is Firestore-native).
        const hasPostQueryFilters = !!(params.severity || params.actorId || params.eventPrefix);

        // ── Build Query (single-field index only, NO composite) ─────────
        let query: FirebaseFirestore.Query = db
            .collection(COLLECTION)
            .orderBy('timestamp', 'desc');

        // TraceId filter: Use Firestore .where() ONLY if no composite
        // index issues. We wrap in try/catch for safety.
        let traceIdFilterActive = false;
        if (params.traceId) {
            traceIdFilterActive = true;
            // Instead of .where() which needs composite index with orderBy,
            // we'll do post-query filtering for traceId too
        }

        // ── Cursor Pagination (safe) ────────────────────────────────────
        if (params.cursor && !hasPostQueryFilters && !traceIdFilterActive) {
            try {
                const cursorDoc = await db.collection(COLLECTION).doc(params.cursor).get();
                if (cursorDoc.exists) {
                    query = query.startAfter(cursorDoc);
                }
                // If doc doesn't exist, silently ignore → start from beginning
            } catch {
                // Invalid cursor — silently ignore, start from beginning
            }
        }

        // ── Fetch Limit ─────────────────────────────────────────────────
        // Fetch more when post-query filters are active
        const needsOverfetch = hasPostQueryFilters || traceIdFilterActive;
        const fetchLimit = needsOverfetch
            ? Math.min((params.limit + 1) * 5, 500)
            : params.limit + 1;
        query = query.limit(fetchLimit);

        // ── Execute Query (safe) ────────────────────────────────────────
        let docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
        try {
            const snapshot = await query.get();
            docs = snapshot.docs;
        } catch (queryError: any) {
            // Log but do NOT crash
            console.error('[API/ops/audit] Firestore query error:', queryError?.message);
            return NextResponse.json({
                ok: true,
                data: {
                    items: [],
                    nextCursor: null,
                    count: 0,
                    role,
                    warning: 'Query failed — returning empty result set',
                },
            });
        }

        // ── Post-query Filters (safe, never throw) ─────────────────────
        if (traceIdFilterActive && params.traceId) {
            docs = docs.filter(doc => {
                try {
                    return doc.data()?.traceId === params.traceId;
                } catch {
                    return false;
                }
            });
        }
        if (params.severity) {
            docs = filterBySeverity(docs, params.severity);
        }
        if (params.actorId) {
            docs = filterByActorId(docs, params.actorId);
        }
        if (params.eventPrefix) {
            docs = filterByEventPrefix(docs, params.eventPrefix);
        }

        // ── Paginate Results ────────────────────────────────────────────
        const hasMore = docs.length > params.limit;
        const resultDocs = hasMore ? docs.slice(0, params.limit) : docs;

        // ── Build Response (with safe redaction) ────────────────────────
        const items: any[] = [];
        for (const doc of resultDocs) {
            try {
                const data = doc.data();
                const envelope = safeNormalize(doc.id, data);
                const redacted = getRedactedAuditEvent(envelope, role);
                items.push({ id: doc.id, ...redacted });
            } catch {
                // Skip malformed document — do NOT crash entire query
                items.push({
                    id: doc.id,
                    event: 'unknown',
                    severity: 'INFO',
                    timestamp: 0,
                    traceId: '',
                    _malformed: true,
                });
            }
        }

        // ── Cursor: safe access (never crash on empty) ──────────────────
        const nextCursor = hasMore && resultDocs.length > 0
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
        // ── Quota / Service Unavailable ──────────────────────────────────
        if (isQuotaError(error) || error?.code === 'SERVICE_UNAVAILABLE') {
            return NextResponse.json(
                { ok: false, error: 'Audit logs unavailable (quota exceeded)', retryAfter: 60 },
                { status: 503 },
            );
        }

        // ── ZERO 500 GUARANTEE: return safe empty result ────────────────
        console.error('[API/ops/audit] Unhandled error (returning safe empty):', error?.message);
        return NextResponse.json({
            ok: true,
            data: {
                items: [],
                nextCursor: null,
                count: 0,
                role: 'admin',
                warning: 'Query encountered an error — returning safe empty result',
            },
        });
    }
}
