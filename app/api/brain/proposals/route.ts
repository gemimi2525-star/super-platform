/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/brain/proposals (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * List Brain proposals with optional status filter. Owner-only.
 *
 * @module app/api/brain/proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';
import { listProposals } from '@/coreos/brain/proposal-engine';

export const runtime = 'nodejs';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';

export async function GET(request: NextRequest) {
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
            console.warn(`[BRAIN/API] List denied: uid=${uid} is not owner`);
            return NextResponse.json(
                { error: 'Forbidden: owner-only action' },
                { status: 403 },
            );
        }

        // ─── Query parameters ───
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

        // ─── Fetch proposals ───
        const proposals = await listProposals(status, limit);

        return NextResponse.json({
            proposals,
            count: proposals.length,
            filter: { status, limit },
        });

    } catch (error: any) {
        console.error('[BRAIN/API] List proposals error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
