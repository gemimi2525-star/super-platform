/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/os/process/spawn (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Records a process spawn event in the audit trail.
 * The actual process creation happens client-side (process-store).
 * This endpoint provides governance audit + ledger integration.
 *
 * Body: { appId, title?, reason, mode, priority?, argsHash }
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUDIT_EVENTS, createAuditEnvelope } from '@/coreos/audit/taxonomy';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appId, title, reason, mode, priority, argsHash, pid } = body;

        // ─── Validate ───
        if (!appId || typeof appId !== 'string') {
            return NextResponse.json({ error: 'appId is required' }, { status: 400 });
        }
        if (!reason || !['user', 'system', 'schedule'].includes(reason)) {
            return NextResponse.json({ error: 'reason must be user|system|schedule' }, { status: 400 });
        }
        if (!mode || !['foreground', 'background'].includes(mode)) {
            return NextResponse.json({ error: 'mode must be foreground|background' }, { status: 400 });
        }

        // ─── Audit ───
        const envelope = createAuditEnvelope(AUDIT_EVENTS.PROCESS_SPAWNED, {
            traceId: `proc-spawn-${Date.now()}`,
            severity: 'INFO',
            actor: { type: 'system', id: 'process-manager' },
            context: {
                pid: pid || 'pending',
                appId,
                title: title || appId,
                reason,
                mode,
                priority: priority ?? 50,
                argsHash: argsHash || 'none',
            },
        });

        console.info('[Process:Audit:Server]', JSON.stringify(envelope));

        return NextResponse.json({
            status: 'SPAWNED',
            audit: {
                event: envelope.event,
                traceId: envelope.traceId,
                timestamp: envelope.timestamp,
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API/os/process/spawn] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
