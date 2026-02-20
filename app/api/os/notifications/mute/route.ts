/**
 * API — POST /api/os/notifications/mute (Phase 18)
 * Records a notification source mute event in the audit trail.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appId, muted } = body;

        if (!appId || typeof muted !== 'boolean') {
            return NextResponse.json({ error: 'appId and muted (boolean) are required' }, { status: 400 });
        }

        const envelope = createAuditEnvelope(AUDIT_EVENTS.NOTIFICATION_MUTED, {
            traceId: `notif-mute-${Date.now()}`,
            severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { appId, muted },
        });

        console.info('[Notification:Audit:Server]', JSON.stringify(envelope));

        return NextResponse.json({
            status: muted ? 'MUTED' : 'UNMUTED',
            audit: { event: envelope.event, traceId: envelope.traceId, timestamp: envelope.timestamp },
        });
    } catch (error: any) {
        console.error('[API/os/notifications/mute] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
