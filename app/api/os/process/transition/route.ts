/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/os/process/transition (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Records a process state transition in the audit trail.
 *
 * Body: { pid, action, reason, from, to }
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pid, action, reason, from, to } = body;

        // ─── Validate ───
        if (!pid || typeof pid !== 'string') {
            return NextResponse.json({ error: 'pid is required' }, { status: 400 });
        }
        if (!action || !['background', 'resume', 'suspend', 'terminate'].includes(action)) {
            return NextResponse.json(
                { error: 'action must be background|resume|suspend|terminate' },
                { status: 400 },
            );
        }
        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ error: 'reason is required' }, { status: 400 });
        }

        // ─── Select event type ───
        const eventType = action === 'terminate'
            ? AUDIT_EVENTS.PROCESS_TERMINATED
            : AUDIT_EVENTS.PROCESS_TRANSITION;

        // ─── Audit ───
        const envelope = createAuditEnvelope(eventType, {
            traceId: `proc-${action}-${Date.now()}`,
            severity: action === 'terminate' ? 'WARN' : 'INFO',
            actor: { type: 'system', id: 'process-manager' },
            context: { pid, action, reason, from, to },
        });

        console.info('[Process:Audit:Server]', JSON.stringify(envelope));

        return NextResponse.json({
            status: 'TRANSITIONED',
            audit: {
                event: envelope.event,
                traceId: envelope.traceId,
                timestamp: envelope.timestamp,
            },
        });

    } catch (error: any) {
        console.error('[API/os/process/transition] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
