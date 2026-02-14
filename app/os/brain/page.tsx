/**
 * ═══════════════════════════════════════════════════════════════════════════
 * /os/brain — Owner-only wrapper (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Convenience route that redirects to break-glass /ops/brain.
 * Non-owners are redirected to /os.
 *
 * @module app/os/brain/page
 */

import { redirect } from 'next/navigation';
import { getOwnerContext } from '@/lib/auth/getOwnerContext';

export default async function OsBrainPage() {
    const { isOwner } = await getOwnerContext();

    if (!isOwner) {
        redirect('/os');
    }

    redirect('/ops/brain');
}
