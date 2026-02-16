/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin API Guard (Phase 31.8 / Mini Phase 34)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reusable owner-only authentication guard for admin API routes.
 * Verifies session cookie + SUPER_ADMIN_ID match.
 *
 * Usage:
 *   const guard = await requireAdmin();
 *   if (guard.error) return guard.error;
 *   // guard.uid is the verified admin UID
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';

export type AdminGuardResult =
    | { error: null; uid: string }
    | { error: NextResponse; uid: null };

export async function requireAdmin(): Promise<AdminGuardResult> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return {
                error: NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 },
                ),
                uid: null,
            };
        }

        let uid: string;
        try {
            const claims = await verifySessionCookie(sessionCookie);
            uid = claims.uid;
        } catch {
            return {
                error: NextResponse.json(
                    { error: 'Invalid or expired session' },
                    { status: 401 },
                ),
                uid: null,
            };
        }

        if (uid !== SUPER_ADMIN_ID) {
            console.warn(`[AdminGuard] Access denied: uid=${uid} is not owner`);
            return {
                error: NextResponse.json(
                    { error: 'Forbidden: owner-only endpoint' },
                    { status: 403 },
                ),
                uid: null,
            };
        }

        return { error: null, uid };
    } catch (err: any) {
        console.error('[AdminGuard] Unexpected error:', err.message);
        return {
            error: NextResponse.json(
                { error: 'Internal auth error' },
                { status: 500 },
            ),
            uid: null,
        };
    }
}
