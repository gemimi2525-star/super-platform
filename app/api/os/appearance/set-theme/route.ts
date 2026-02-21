/**
 * API Route — Set Theme Mode (Phase 21)
 * POST /api/os/appearance/set-theme
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { themeMode, traceId } = body;
        if (!['light', 'dark', 'auto'].includes(themeMode)) {
            return NextResponse.json({ error: 'Invalid themeMode' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing traceId' }, { status: 400 });
        }
        const hash = await argsHash({ themeMode, traceId });
        createAuditEnvelope(AUDIT_EVENTS.APPEARANCE_THEME_CHANGED, {
            traceId, severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { themeMode, argsHash: hash },
        });
        return NextResponse.json({ status: 'APPLIED', themeMode, argsHash: hash });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
