/**
 * API Route — Set Accent Color (Phase 21)
 * POST /api/os/appearance/set-accent
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

const VALID_ACCENTS = ['indigo', 'emerald', 'rose', 'amber', 'slate', 'cyan'];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accent, traceId } = body;
        if (!VALID_ACCENTS.includes(accent)) {
            return NextResponse.json({ error: 'Invalid accent' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing traceId' }, { status: 400 });
        }
        const hash = await argsHash({ accent, traceId });
        createAuditEnvelope(AUDIT_EVENTS.APPEARANCE_ACCENT_CHANGED, {
            traceId, severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { accent, argsHash: hash },
        });
        return NextResponse.json({ status: 'APPLIED', accent, argsHash: hash });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
