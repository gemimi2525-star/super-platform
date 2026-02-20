/**
 * API — POST /api/os/notifications/create (Phase 18)
 * Records a notification creation event in the audit trail.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, severity, source, title, body: notifBody, meta } = body;

        if (!severity || !source?.appId || !title) {
            return NextResponse.json({ error: 'severity, source.appId, and title are required' }, { status: 400 });
        }

        const envelope = createAuditEnvelope(AUDIT_EVENTS.NOTIFICATION_CREATED, {
            traceId: meta?.traceId || `notif-create-${Date.now()}`,
            severity: 'INFO',
            actor: { type: 'system', id: 'notification-center' },
            context: { id, severity, appId: source.appId, domain: source.domain, title, body: notifBody, meta },
        });

        console.info('[Notification:Audit:Server]', JSON.stringify(envelope));

        return NextResponse.json({
            status: 'CREATED',
            audit: { event: envelope.event, traceId: envelope.traceId, timestamp: envelope.timestamp },
        }, { status: 201 });
    } catch (error: any) {
        console.error('[API/os/notifications/create] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
