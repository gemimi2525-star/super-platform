/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — Remove Space (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POST /api/os/spaces/remove
 * Removes a virtual desktop space with audit trail.
 * Cannot remove the default space.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { spaceId, traceId } = body;

        if (!spaceId || typeof spaceId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "spaceId"' },
                { status: 400 },
            );
        }

        // Cannot remove default space
        if (spaceId === 'space:default') {
            return NextResponse.json(
                { error: 'Cannot remove the default space' },
                { status: 403 },
            );
        }

        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "traceId"' },
                { status: 400 },
            );
        }

        const hash = await argsHash({ spaceId, traceId });

        const audit = createAuditEnvelope(
            AUDIT_EVENTS.SPACE_REMOVED,
            {
                traceId,
                severity: 'INFO',
                actor: { type: 'user', id: 'current' },
                context: { spaceId, argsHash: hash },
            },
        );

        return NextResponse.json({
            status: 'REMOVED',
            spaceId,
            audit: {
                event: AUDIT_EVENTS.SPACE_REMOVED,
                traceId,
                timestamp: audit.timestamp,
                argsHash: hash,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
