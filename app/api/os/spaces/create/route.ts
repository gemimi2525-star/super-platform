/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — Create Space (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POST /api/os/spaces/create
 * Creates a new virtual desktop space with audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditEnvelope, AUDIT_EVENTS } from '@/coreos/audit/taxonomy';
import { stableStringify, argsHash } from '@/coreos/process/hash-utils';
import { generateSpaceId } from '@/coreos/spaces/types';
import type { SpaceRecord } from '@/coreos/spaces/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, traceId } = body;

        // ─── Input Validation ──────────────────────────────
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid "name"' },
                { status: 400 },
            );
        }

        if (!traceId || typeof traceId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "traceId"' },
                { status: 400 },
            );
        }

        // ─── Build Space Record ────────────────────────────
        const spaceId = generateSpaceId(name.trim());
        const now = new Date();

        const space: SpaceRecord = {
            id: spaceId,
            name: name.trim(),
            order: Date.now(),
            createdAt: now.toISOString(),
            createdBy: { uid: 'current' },
            traceId,
        };

        // ─── Audit ─────────────────────────────────────────
        const hash = await argsHash({ spaceId, name: name.trim(), traceId });

        const audit = createAuditEnvelope(
            AUDIT_EVENTS.SPACE_CREATED,
            {
                traceId,
                severity: 'INFO',
                actor: { type: 'user', id: 'current' },
                context: { spaceId, name: name.trim(), argsHash: hash },
            },
        );

        return NextResponse.json(
            {
                status: 'CREATED',
                space: {
                    id: space.id,
                    name: space.name,
                    order: space.order,
                    createdAt: space.createdAt,
                },
                audit: {
                    event: AUDIT_EVENTS.SPACE_CREATED,
                    traceId,
                    timestamp: audit.timestamp,
                    argsHash: hash,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
