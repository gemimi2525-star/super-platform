/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PERMISSION CLIENT CHECK (Phase 19)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Intercepts dangerous operations and requests permission from the Kernel.
 * This runs in the Client (App) context.
 * 
 * @module coreos/permissions/client-check
 */

import { getKernel, IntentFactory, createCorrelationId } from '@/coreos';
import { getEventBus } from '@/coreos/event-bus';
import type { CapabilityId, CorrelationId } from '@/coreos/types';

/**
 * Check if a capability is allowed.
 * If not implicitly allowed, it will prompt the user via WindowManager.
 * Returns Promise<boolean> resolving to true (granted) or false (denied).
 */
export async function checkPermission(
    capabilityId: CapabilityId,
    traceId: string
): Promise<boolean> {
    const kernel = getKernel();
    const eventBus = getEventBus();
    const correlationId = createCorrelationId(); // Unique ID for this request

    // 1. Emit Request Intent
    kernel.emit({
        type: 'REQUEST_PERMISSION',
        correlationId,
        payload: {
            capabilityId,
            appName: 'Application', // In real system, derive from context
            scope: 'session',
            correlationId,
        }
    });

    // 2. Wait for Decision Event (Async)
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            unsub();
            resolve(false); // Default deny on timeout
        }, 60000); // 1 minute timeout

        const unsub = eventBus.subscribe((event) => {
            if (event.type === 'PERMISSION_DECIDED' && event.payload.requestId === correlationId) {
                clearTimeout(timeout);
                unsub();
                resolve(event.payload.status === 'granted');
            }
        });
    });
}
