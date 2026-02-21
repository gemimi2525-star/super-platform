/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — Move Window to Space (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POST /api/os/spaces/move-window
 * Moves a window to a different space with audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { stableStringify, argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { windowId, targetSpaceId, traceId } = body;

        if (!windowId || typeof windowId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "windowId"' },
                { status: 400 },
            );
        }

        if (!targetSpaceId || typeof targetSpaceId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "targetSpaceId"' },
                { status: 400 },
            );
        }

        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "traceId"' },
                { status: 400 },
            );
        }

        const hash = await argsHash({ windowId, targetSpaceId, traceId });

        const audit = createAuditEnvelope(
            AUDIT_EVENTS.SPACE_WINDOW_MOVED,
            {
                traceId,
                severity: 'INFO',
                actor: { type: 'user', id: 'current' },
                context: { windowId, targetSpaceId, argsHash: hash },
            },
        );

        return NextResponse.json({
            status: 'MOVED',
            windowId,
            targetSpaceId,
            audit: {
                event: AUDIT_EVENTS.SPACE_WINDOW_MOVED,
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
