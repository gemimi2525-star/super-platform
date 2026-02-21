/**
 * API Route — Set Font Scale (Phase 21)
 * POST /api/os/appearance/set-font-scale
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

const VALID_SCALES = [90, 100, 110];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fontScale, traceId } = body;
        if (!VALID_SCALES.includes(fontScale)) {
            return NextResponse.json({ error: 'Invalid fontScale' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing traceId' }, { status: 400 });
        }
        const hash = await argsHash({ fontScale, traceId });
        createAuditEnvelope(AUDIT_EVENTS.APPEARANCE_FONTSCALE_CHANGED, {
            traceId, severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { fontScale, argsHash: hash },
        });
        return NextResponse.json({ status: 'APPLIED', fontScale, argsHash: hash });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
