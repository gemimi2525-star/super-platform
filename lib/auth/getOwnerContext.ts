/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Owner Context Helper (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-side helper to check owner status.
 * Uses existing getAuthContext() + SUPER_ADMIN_ID comparison.
 *
 * @module lib/auth/getOwnerContext
 * @version 1.0.0
 */

import { getAuthContext } from '@/lib/auth/server';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || '';

export interface OwnerContext {
    isAuth: boolean;
    uid: string;
    isOwner: boolean;
}

/**
 * Get owner context from current session.
 * Returns { isAuth, uid, isOwner } for use in layouts/pages.
 */
export async function getOwnerContext(): Promise<OwnerContext> {
    const auth = await getAuthContext();

    if (!auth) {
        return { isAuth: false, uid: '', isOwner: false };
    }

    return {
        isAuth: true,
        uid: auth.uid,
        isOwner: auth.uid === SUPER_ADMIN_ID,
    };
}
