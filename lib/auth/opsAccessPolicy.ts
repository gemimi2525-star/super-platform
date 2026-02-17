/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Access Policy — Phase 35A (Enterprise Control)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central policy for Ops / Integrity / Build-Info access control.
 *
 * Mode: "redacted"
 *   - Public users see minimal status-only responses
 *   - Owner/Admin sees full details (commit, version, signature, etc.)
 *
 * Mode: "loginRequired"
 *   - All endpoints return 401 for unauthenticated users
 *   - Owner/Admin sees full details
 */

import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase-admin';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';

// ── Policy Configuration ──────────────────────────────────────────────────
export const OPS_ACCESS_POLICY = {
    /** 'redacted' = public gets minimal info; 'loginRequired' = 401 for public */
    mode: 'redacted' as const,
    /** Roles allowed full access */
    allowedRoles: ['owner'] as const,
    /** Fields stripped from public responses */
    redactedFields: [
        'commit', 'sha', 'signature', 'version', 'lockedTag',
        'buildTime', 'branch', 'checks',
    ] as const,
} as const;

// ── Soft Auth Check (for redacted mode) ───────────────────────────────────
export type OpsAccessResult = {
    isOwner: boolean;
    uid: string | null;
};

/**
 * Soft authentication check for ops endpoints.
 * Does NOT throw or return error responses — just checks if the user is owner.
 * Use this in redacted-mode endpoints to decide what to expose.
 */
export async function checkOpsAccess(): Promise<OpsAccessResult> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return { isOwner: false, uid: null };
        }

        const claims = await verifySessionCookie(sessionCookie);
        const uid = claims.uid;

        return {
            isOwner: uid === SUPER_ADMIN_ID,
            uid,
        };
    } catch {
        return { isOwner: false, uid: null };
    }
}
