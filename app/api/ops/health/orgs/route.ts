/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Health — Organizations Route Check
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lightweight health-check endpoint for /api/platform/orgs.
 * Returns a static JSON response WITHOUT touching Firestore.
 * Designed to be callable from monitoring/curl without triggering
 * Vercel Bot Protection (no client-side challenge needed).
 *
 * @module app/api/ops/health/orgs
 * @version 1.0.0 — Phase 27C.6
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const response = NextResponse.json({
        ok: true,
        route: '/api/platform/orgs',
        routeStatus: 'active',
        phase: '27C.6',
        sha: '8debabe',
        ts: new Date().toISOString(),
        note: 'This is a lightweight health probe. Use browser fetch() for full API testing to avoid Vercel Bot Protection 429.',
    });

    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
}
