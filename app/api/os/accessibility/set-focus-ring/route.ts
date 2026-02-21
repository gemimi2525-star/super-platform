/**
 * API Route — Set Focus Ring Mode (Phase 22)
 * POST /api/os/accessibility/set-focus-ring
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

const VALID_MODES = ['auto', 'always', 'keyboard-only'];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mode, traceId } = body;
        if (!VALID_MODES.includes(mode)) {
            return NextResponse.json({ error: 'Invalid "mode"' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing traceId' }, { status: 400 });
        }
        const hash = await argsHash({ mode, traceId });
        createAuditEnvelope(AUDIT_EVENTS.A11Y_FOCUSRING_CHANGED, {
            traceId, severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { mode, argsHash: hash },
        });
        return NextResponse.json({ status: 'APPLIED', mode, argsHash: hash });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
