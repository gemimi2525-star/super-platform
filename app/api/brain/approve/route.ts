/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/brain/approve (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Approve or reject a Brain proposal. Owner-only.
 *
 * @module app/api/brain/approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';
import { approveRequestSchema } from '@/coreos/brain/brain-proposal-schemas';
import {
    approveProposal,
    rejectProposal,
} from '@/coreos/brain/proposal-engine';

export const runtime = 'nodejs';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';

export async function POST(request: NextRequest) {
    try {
        // ─── Auth: session cookie required ───
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            );
        }

        let uid: string;
        try {
            const claims = await verifySessionCookie(sessionCookie);
            uid = claims.uid;
        } catch {
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 401 },
            );
        }

        // ─── Owner-only guard ───
        if (uid !== SUPER_ADMIN_ID) {
            console.warn(`[BRAIN/API] Approve denied: uid=${uid} is not owner`);
            return NextResponse.json(
                { error: 'Forbidden: owner-only action' },
                { status: 403 },
            );
        }

        // ─── Parse & validate request body ───
        const body = await request.json();
        const parseResult = approveRequestSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation error', details: parseResult.error.format() },
                { status: 400 },
            );
        }

        const { proposalId, action } = parseResult.data;

        // ─── Execute action ───
        let result;
        if (action === 'APPROVE') {
            result = await approveProposal(proposalId, uid);
        } else {
            result = await rejectProposal(proposalId, uid);
        }

        return NextResponse.json({
            proposalId: result.id,
            status: result.status,
            approvedAt: result.approvedAt,
            approvedByUid: result.approvedByUid,
            auditTrail: result.auditTrail,
        });

    } catch (error: any) {
        console.error('[BRAIN/API] Approve error:', error.message);

        if (error.message.includes('not found')) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message.includes('already')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
