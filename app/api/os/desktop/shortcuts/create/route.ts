/**
 * API — POST /api/os/desktop/shortcuts/create (Phase 19.5)
 * Intent-bound desktop shortcut creation with audit trail.
 *
 * Flow: UI DragDrop → POST this route → audit envelope → JSON response
 *       → client applies via store
 */
import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';
import { stableStringify, argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { capabilityId, title, icon, position, traceId } = body;

        // ─── Input Validation ──────────────────────────────────
        if (!capabilityId || typeof capabilityId !== 'string') {
            return NextResponse.json({ error: 'capabilityId is required (string)' }, { status: 400 });
        }
        if (!title || typeof title !== 'string') {
            return NextResponse.json({ error: 'title is required (string)' }, { status: 400 });
        }
        if (!icon || typeof icon !== 'string') {
            return NextResponse.json({ error: 'icon is required (string)' }, { status: 400 });
        }

        const resolvedTraceId = traceId || `sc-create-${Date.now()}`;

        // ─── Args Hash (SHA-256 deterministic) ─────────────────
        const canonicalArgs = { action: 'desktop.shortcut.create', capabilityId, title, icon };
        const hash = await argsHash(canonicalArgs);

        // ─── Generate shortcut ID ──────────────────────────────
        const shortcutId = `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

        // ─── Audit Envelope ────────────────────────────────────
        const envelope = createAuditEnvelope(AUDIT_EVENTS.DESKTOP_SHORTCUT_CREATED, {
            traceId: resolvedTraceId,
            severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: {
                shortcutId,
                capabilityId,
                title,
                icon,
                position: position ?? null,
                argsHash: hash,
                stableArgs: stableStringify(canonicalArgs),
            },
        });

        console.info('[Desktop:Shortcut:Audit]', JSON.stringify(envelope));

        // ─── Response ──────────────────────────────────────────
        return NextResponse.json({
            status: 'CREATED',
            shortcut: {
                id: shortcutId,
                capabilityId,
                title,
                icon,
                createdAt: new Date().toISOString(),
                position: position ?? null,
            },
            audit: {
                event: envelope.event,
                traceId: envelope.traceId,
                timestamp: envelope.timestamp,
                argsHash: hash,
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API/os/desktop/shortcuts/create] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
