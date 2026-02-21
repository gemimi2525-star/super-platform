/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — Activate Space (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POST /api/os/spaces/activate
 * Activates (switches to) a virtual desktop space with audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { stableStringify, argsHash } from '@/coreos/process/hash-utils';

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

        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "traceId"' },
                { status: 400 },
            );
        }

        const hash = await argsHash({ spaceId, traceId });

        const audit = createAuditEnvelope(
            AUDIT_EVENTS.SPACE_ACTIVATED,
            {
                traceId,
                severity: 'INFO',
                actor: { type: 'user', id: 'current' },
                context: { spaceId, argsHash: hash },
            },
        );

        return NextResponse.json({
            status: 'ACTIVATED',
            spaceId,
            audit: {
                event: AUDIT_EVENTS.SPACE_ACTIVATED,
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
