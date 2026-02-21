/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tenant Initializer Component (Phase 29.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mounts into the OS Shell and initializes tenant context.
 * Renders nothing visible — purely side-effect based.
 */

'use client';

import { useEffect } from 'react';
import { useTenantStore } from './store';

/**
 * TenantInitializer — place inside OSShell to auto-bootstrap tenant session.
 */
export function TenantInitializer() {
    const initialize = useTenantStore(s => s.initialize);
    const session = useTenantStore(s => s.session);

    useEffect(() => {
        if (!session) {
            initialize();
        }
    }, [session, initialize]);

    return null; // Invisible, side-effect only
}
