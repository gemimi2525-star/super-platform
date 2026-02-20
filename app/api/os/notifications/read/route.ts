/**
 * API — POST /api/os/notifications/read (Phase 18)
 * Records a notification read event in the audit trail.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const envelope = createAuditEnvelope(AUDIT_EVENTS.NOTIFICATION_READ, {
            traceId: `notif-read-${Date.now()}`,
            severity: 'INFO',
            actor: { type: 'user', id: 'current' },
            context: { notificationId: id },
        });

        console.info('[Notification:Audit:Server]', JSON.stringify(envelope));

        return NextResponse.json({
            status: 'READ',
            audit: { event: envelope.event, traceId: envelope.traceId, timestamp: envelope.timestamp },
        });
    } catch (error: any) {
        console.error('[API/os/notifications/read] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
