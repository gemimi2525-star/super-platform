/**
 * ═══════════════════════════════════════════════════════════════════════════
 * assertCaps — Dev-only store cap verification (Phase 23)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Runs on mount (dev-only). Warns if any store exceeds its expected cap.
 * No throw in production.
 */

interface CapCheck {
    name: string;
    cap: number;
    getCurrent: () => number;
}

export function assertCaps(): void {
    if (process.env.NODE_ENV === 'production') return;

    // Lazy imports to avoid circular deps
    const checks: CapCheck[] = [];

    try {
        // EventBus ring buffer
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { listRecent } = require('@/coreos/events/bus');
        checks.push({ name: 'EventBus', cap: 200, getCurrent: () => listRecent().length });
    } catch { /* not loaded yet */ }

    try {
        // Notifications store
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useNotificationStore } = require('@/coreos/notifications/store');
        checks.push({
            name: 'Notifications',
            cap: 200,
            getCurrent: () => useNotificationStore.getState().notifications?.length ?? 0,
        });
    } catch { /* not loaded yet */ }

    try {
        // Spaces store
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useSpaceStore } = require('@/coreos/spaces/store');
        checks.push({
            name: 'Spaces',
            cap: 12,
            getCurrent: () => useSpaceStore.getState().spaces?.length ?? 0,
        });
    } catch { /* not loaded yet */ }

    for (const check of checks) {
        try {
            const current = check.getCurrent();
            if (current > check.cap) {
                console.warn(
                    `[Phase 23] ⚠️ Store cap exceeded: ${check.name} = ${current} > ${check.cap}`
                );
            } else {
                console.debug(
                    `[Phase 23] ✓ ${check.name}: ${current}/${check.cap}`
                );
            }
        } catch {
            // Store not available yet
        }
    }
}
