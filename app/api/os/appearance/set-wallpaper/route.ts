/**
 * API Route — Set Wallpaper (Phase 21)
 * POST /api/os/appearance/set-wallpaper
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallpaper, traceId } = body;
        if (!wallpaper || !['solid', 'gradient'].includes(wallpaper.type) || typeof wallpaper.value !== 'string') {
            return NextResponse.json({ error: 'Invalid wallpaper' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing traceId' }, { status: 400 });
        }
        const hash = await argsHash({ wallpaper, traceId });
        createAuditEnvelope(AUDIT_EVENTS.APPEARANCE_WALLPAPER_CHANGED, {
            traceId, severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { wallpaper, argsHash: hash },
        });
        return NextResponse.json({ status: 'APPLIED', wallpaper, argsHash: hash });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
