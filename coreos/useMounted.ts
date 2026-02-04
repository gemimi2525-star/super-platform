/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useMounted Hook — Hydration-Safe Client Detection
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 9.2: Provides deterministic SSR/client rendering.
 * Returns false during SSR, true only after client mount.
 * 
 * Usage:
 * ```tsx
 * const mounted = useMounted();
 * return <span>{mounted ? formatTime(new Date()) : '—'}</span>;
 * ```
 * 
 * @module coreos/useMounted
 * @version 1.0.0 (Phase 9.2)
 */

'use client';

import * as React from 'react';

/**
 * Hook to detect if component is mounted on client.
 * Returns false during SSR to ensure deterministic initial render.
 */
export function useMounted(): boolean {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}
