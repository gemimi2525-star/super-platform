/**
 * Ops Health — Users (Static JSON, no Firestore)
 * Phase 27C.8: Allows monitoring tools to verify the users service endpoint
 * is deployed and running, even when Firestore quota is exhausted.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    return NextResponse.json(
        {
            ok: true,
            status: 'ok',
            service: 'users',
            ts: new Date().toISOString(),
            note: 'static health check — no firestore reads',
            phase: '27C.8',
        },
        {
            status: 200,
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
            },
        },
    );
}
