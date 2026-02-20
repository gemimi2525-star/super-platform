/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/os/process/priority (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Records a process priority change in the audit trail.
 *
 * Body: { pid, priority, reason }
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pid, priority, reason } = body;

        // ─── Validate ───
        if (!pid || typeof pid !== 'string') {
            return NextResponse.json({ error: 'pid is required' }, { status: 400 });
        }
        if (typeof priority !== 'number' || priority < 0 || priority > 100) {
            return NextResponse.json({ error: 'priority must be 0-100' }, { status: 400 });
        }
        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ error: 'reason is required' }, { status: 400 });
        }

        // ─── Audit ───
        const envelope = createAuditEnvelope(AUDIT_EVENTS.PROCESS_PRIORITY, {
            traceId: `proc-priority-${Date.now()}`,
            severity: 'INFO',
            actor: { type: 'system', id: 'process-manager' },
            context: { pid, priority, reason },
        });

        console.info('[Process:Audit:Server]', JSON.stringify(envelope));

        return NextResponse.json({
            status: 'PRIORITY_UPDATED',
            audit: {
                event: envelope.event,
                traceId: envelope.traceId,
                timestamp: envelope.timestamp,
            },
        });

    } catch (error: any) {
        console.error('[API/os/process/priority] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
