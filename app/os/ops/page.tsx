/**
 * ═══════════════════════════════════════════════════════════════════════════
 * /os/ops — Owner-only wrapper (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Convenience route that redirects to break-glass /ops.
 * Non-owners are redirected to /os.
 *
 * @module app/os/ops/page
 */

import { redirect } from 'next/navigation';
import { getOwnerContext } from '@/lib/auth/getOwnerContext';

export default async function OsOpsPage() {
    const { isOwner } = await getOwnerContext();

    if (!isOwner) {
        redirect('/os');
    }

    redirect('/ops');
}
