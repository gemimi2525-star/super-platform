/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Restore Flow (V2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Policy-gated restore algorithm.
 * Every restore/open goes through governance adapter.
 * 
 * @module components/os-shell/restore-flow
 * @version 1.0.0
 */

import {
    getKernel,
    IntentFactory,
    getEventBus,
    type CapabilityId,
} from '@/governance/synapse';
import type { ShellSnapshot, WindowSnapshot } from './shell-persistence';
import { addDecisionLog, type DecisionLogEntry } from './system-log';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RestoreResult {
    restored: string[];    // Window IDs that were restored
    denied: string[];      // Window IDs that were denied
    skipped: string[];     // Window IDs that were skipped
    focusRestored: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESTORE ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Restore shell state from snapshot.
 * Every window restore goes through governance intent.
 * 
 * @param snapshot - The shell snapshot to restore
 * @returns RestoreResult with details of what was restored/denied/skipped
 */
export async function restoreFromSnapshot(
    snapshot: ShellSnapshot
): Promise<RestoreResult> {
    const result: RestoreResult = {
        restored: [],
        denied: [],
        skipped: [],
        focusRestored: false,
    };

    const kernel = getKernel();
    const eventBus = getEventBus();

    // Sort windows by zIndex to preserve stacking order
    const sortedWindows = [...snapshot.windows].sort((a, b) => a.zIndex - b.zIndex);

    // Restore each window through governance
    for (const windowSnapshot of sortedWindows) {
        const restoreResult = await restoreWindow(windowSnapshot, kernel, eventBus);

        if (restoreResult.decision === 'ALLOW') {
            result.restored.push(windowSnapshot.id);
        } else if (restoreResult.decision === 'DENY') {
            result.denied.push(windowSnapshot.id);

            // Log the denial
            addDecisionLog({
                timestamp: Date.now(),
                action: 'RESTORE_WINDOW',
                capabilityId: windowSnapshot.capabilityId,
                decision: 'DENY',
                reasonChain: restoreResult.reasonChain || ['Permission denied during restore'],
                failedRule: restoreResult.failedRule,
                correlationId: restoreResult.correlationId,
            });
        } else {
            result.skipped.push(windowSnapshot.id);
        }
    }

    // Restore focus
    if (snapshot.focusedWindowId && result.restored.includes(snapshot.focusedWindowId)) {
        // Try to focus the previously focused window
        kernel.emit(IntentFactory.focusWindow(snapshot.focusedWindowId));
        result.focusRestored = true;
    } else if (result.restored.length > 0) {
        // Fallback: focus the first restored window
        kernel.emit(IntentFactory.focusWindow(result.restored[0]));
    }

    return result;
}

/**
 * Restore a single window through governance
 */
async function restoreWindow(
    windowSnapshot: WindowSnapshot,
    kernel: ReturnType<typeof getKernel>,
    eventBus: ReturnType<typeof getEventBus>
): Promise<{
    decision: 'ALLOW' | 'DENY' | 'SKIP';
    reasonChain?: string[];
    failedRule?: string;
    correlationId?: string;
}> {
    return new Promise((resolve) => {
        // Set up one-time listener for decision
        let resolved = false;
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve({ decision: 'SKIP', reasonChain: ['Restore timeout'] });
            }
        }, 2000);

        const unsubscribe = eventBus.subscribe((event: unknown) => {
            const evt = event as { type: string; payload?: Record<string, unknown> };

            // Check for window opened (ALLOW)
            if (evt.type === 'WINDOW_OPENED' &&
                (evt.payload?.capabilityId === windowSnapshot.capabilityId)) {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({ decision: 'ALLOW' });
                }
            }

            // Check for policy denied
            if (evt.type === 'POLICY_DENIED' &&
                (evt.payload?.capabilityId === windowSnapshot.capabilityId)) {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({
                        decision: 'DENY',
                        reasonChain: evt.payload?.reasonChain as string[] | undefined,
                        failedRule: evt.payload?.failedRule as string | undefined,
                        correlationId: evt.payload?.correlationId as string | undefined,
                    });
                }
            }
        });

        // Emit the restore intent
        // If window was minimized, open it minimized
        if (windowSnapshot.state === 'minimized') {
            kernel.emit(IntentFactory.openCapability(windowSnapshot.capabilityId as CapabilityId));
            // After open, minimize it
            setTimeout(() => {
                if (resolved) {
                    kernel.emit(IntentFactory.minimizeWindow(windowSnapshot.id));
                }
            }, 100);
        } else {
            kernel.emit(IntentFactory.openCapability(windowSnapshot.capabilityId as CapabilityId));
        }
    });
}

/**
 * Synchronous restore (for simple cases where we don't wait for events)
 * Used when kernel is already bootstrapped
 *
 * Phase 39: Validates capabilityIds against appRegistry and enforces
 * single-instance dedup before replaying.
 */
export function restoreFromSnapshotSync(
    snapshot: ShellSnapshot
): void {
    const kernel = getKernel();
    const { appRegistry } = require('./apps/registry');
    const { isSingleInstance } = require('./apps/manifest');

    // Sort windows by zIndex
    const sortedWindows = [...snapshot.windows].sort((a, b) => a.zIndex - b.zIndex);

    // Phase 39: Track opened single-instance apps to prevent dupes
    const openedSingleInstance = new Set<string>();

    // Emit intents for each window — with validation
    for (const windowSnapshot of sortedWindows) {
        const capId = windowSnapshot.capabilityId;

        // Phase 39: Skip if capabilityId is not in current registry
        if (!appRegistry[capId]) {
            console.log(`[RestoreFlow] Skipping unregistered capability: ${capId}`);
            continue;
        }

        // Phase 39: Skip if single-instance and already opened
        if (isSingleInstance(capId)) {
            if (openedSingleInstance.has(capId)) {
                console.log(`[RestoreFlow] Skipping duplicate single-instance: ${capId}`);
                continue;
            }
            openedSingleInstance.add(capId);
        }

        kernel.emit(IntentFactory.openCapability(capId as CapabilityId));
    }

    // Restore focus after a delay
    setTimeout(() => {
        if (snapshot.focusedWindowId) {
            // Note: focusedWindowId from snapshot may not match new window IDs
            // The kernel will handle this gracefully
        }
    }, 200);
}

