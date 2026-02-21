/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — Rename Space (Phase 20.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POST /api/os/spaces/rename
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { spaceId, name, traceId } = body;

        if (!spaceId || typeof spaceId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid "spaceId"' }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Missing or invalid "name"' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid "traceId"' }, { status: 400 });
        }

        const hash = await argsHash({ spaceId, name: name.trim(), traceId });

        const audit = createAuditEnvelope(
            AUDIT_EVENTS.SPACE_RENAMED,
            {
                traceId,
                severity: 'INFO',
                actor: { type: 'user', id: 'current' },
                context: { spaceId, name: name.trim(), argsHash: hash },
            },
        );

        return NextResponse.json({
            status: 'RENAMED',
            spaceId,
            name: name.trim(),
            audit: {
                event: AUDIT_EVENTS.SPACE_RENAMED,
                traceId,
                timestamp: audit.timestamp,
                argsHash: hash,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
