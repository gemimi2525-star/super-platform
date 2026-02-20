/**
 * API — POST /api/os/desktop/shortcuts/remove (Phase 19.5)
 * Intent-bound desktop shortcut removal with audit trail.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shortcutId, traceId } = body;

        // ─── Input Validation ──────────────────────────────────
        if (!shortcutId || typeof shortcutId !== 'string') {
            return NextResponse.json({ error: 'shortcutId is required (string)' }, { status: 400 });
        }

        const resolvedTraceId = traceId || `sc-remove-${Date.now()}`;

        // ─── Audit Envelope ────────────────────────────────────
        const envelope = createAuditEnvelope(AUDIT_EVENTS.DESKTOP_SHORTCUT_REMOVED, {
            traceId: resolvedTraceId,
            severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { shortcutId },
        });

        console.info('[Desktop:Shortcut:Audit:Remove]', JSON.stringify(envelope));

        return NextResponse.json({
            status: 'REMOVED',
            shortcutId,
            audit: {
                event: envelope.event,
                traceId: envelope.traceId,
                timestamp: envelope.timestamp,
            },
        });

    } catch (error: any) {
        console.error('[API/os/desktop/shortcuts/remove] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
