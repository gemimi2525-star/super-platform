/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/brain/propose (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Creates a new Brain proposal. Requires authenticated session.
 * Rate limited to 20 proposes/hour per uid.
 *
 * @module app/api/brain/propose
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';
import { proposeRequestSchema } from '@/coreos/brain/brain-proposal-schemas';
import {
    checkRateLimit,
    generateProposal,
    persistProposal,
} from '@/coreos/brain/proposal-engine';

export const runtime = 'nodejs';

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
        }

        // ─── Owner-only guard (Phase 26D) ───
        const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';
        if (uid !== SUPER_ADMIN_ID) {
            console.warn(`[BRAIN/API] Propose denied: uid=${uid} is not owner`);
            return NextResponse.json(
                { error: 'Forbidden: owner-only action' },
                { status: 403 },
            );
        }

        // ─── Rate limit ───
        if (!checkRateLimit(uid)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Max 20 proposals per hour.' },
                { status: 429 },
            );
        }

        // ─── Parse & validate request body ───
        const body = await request.json();
        const parseResult = proposeRequestSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation error', details: parseResult.error.format() },
                { status: 400 },
            );
        }

        const { scope, userGoal, context } = parseResult.data;

        // ─── Generate proposal via LLM ───
        console.log(`[BRAIN/API] Propose: scope=${scope}, uid=${uid}, goal="${userGoal.substring(0, 50)}"`);
        const proposalContent = await generateProposal(scope, userGoal, context);

        // ─── Persist to Firestore ───
        const saved = await persistProposal(uid, scope, userGoal, proposalContent);

        return NextResponse.json({
            proposalId: saved.id,
            status: saved.status,
            proposal: saved.proposal,
            createdAt: saved.createdAt,
        }, { status: 201 });

    } catch (error: any) {
        console.error('[BRAIN/API] Propose error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
