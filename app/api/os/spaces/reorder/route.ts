/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — Reorder Spaces (Phase 20.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POST /api/os/spaces/reorder
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderedIds, traceId } = body;

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid "orderedIds"' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid "traceId"' }, { status: 400 });
        }

        const hash = await argsHash({ orderedIds, traceId });

        const audit = createAuditEnvelope(
            AUDIT_EVENTS.SPACE_REORDERED,
            {
                traceId,
                severity: 'INFO',
                actor: { type: 'user', id: 'current' },
                context: { orderedIds, argsHash: hash },
            },
        );

        return NextResponse.json({
            status: 'REORDERED',
            orderedIds,
            audit: {
                event: AUDIT_EVENTS.SPACE_REORDERED,
                traceId,
                timestamp: audit.timestamp,
                argsHash: hash,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
