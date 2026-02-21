/**
 * API Route — Set High Contrast (Phase 22)
 * POST /api/os/accessibility/set-high-contrast
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { argsHash } from '@/coreos/process/hash-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { enabled, traceId } = body;
        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'Invalid "enabled"' }, { status: 400 });
        }
        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json({ error: 'Missing traceId' }, { status: 400 });
        }
        const hash = await argsHash({ enabled, traceId });
        createAuditEnvelope(AUDIT_EVENTS.A11Y_HIGHCONTRAST_CHANGED, {
            traceId, severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { enabled, argsHash: hash },
        });
        return NextResponse.json({ status: 'APPLIED', enabled, argsHash: hash });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
