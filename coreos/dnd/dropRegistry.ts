/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Drop Target Registry (Phase 19.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS-level registry for drop targets. Validates payloads and builds
 * intents — NO mutation logic. The registry only decides whether a
 * drop is valid and what intent it should produce.
 *
 * @module coreos/dnd/dropRegistry
 */

import type { DragPayload, DragItemType } from './dragTypes';
import type { CreateShortcutIntent } from '@/coreos/desktop/shortcuts/types';

// ─── Drop Target Config ────────────────────────────────────────────────

export interface DropTargetConfig {
    /** Unique target identifier */
    readonly targetId: string;

    /** What drag item types this target accepts */
    readonly accepts: readonly DragItemType[];

    /** Optional: restrict to specific capabilities */
    readonly capabilityScope?: readonly string[];

    /** Build an intent from the drag payload — NO mutations */
    readonly buildIntent: (payload: DragPayload, traceId: string) => CreateShortcutIntent | null;
}

// ─── Validation Result ─────────────────────────────────────────────────

export interface DropValidation {
    readonly ok: boolean;
    readonly reason?: string;
}

// ─── Registry (In-memory, session-scoped) ──────────────────────────────

const targets = new Map<string, DropTargetConfig>();

export function registerDropTarget(targetId: string, config: DropTargetConfig): void {
    targets.set(targetId, config);
}

export function unregisterDropTarget(targetId: string): void {
    targets.delete(targetId);
}

export function getDropTarget(targetId: string): DropTargetConfig | undefined {
    return targets.get(targetId);
}

/**
 * Validate whether a payload can be dropped on the target.
 */
export function validateDrop(payload: DragPayload, targetId: string): DropValidation {
    const config = targets.get(targetId);
    if (!config) {
        return { ok: false, reason: `Target "${targetId}" not registered` };
    }

    if (!config.accepts.includes(payload.type)) {
        return { ok: false, reason: `Target "${targetId}" does not accept "${payload.type}"` };
    }

    if (config.capabilityScope && payload.capabilityId) {
        if (!config.capabilityScope.includes(payload.capabilityId)) {
            return { ok: false, reason: `Capability "${payload.capabilityId}" not in scope` };
        }
    }

    return { ok: true };
}

/**
 * Build an intent for a validated drop.
 * Returns null if the drop is invalid or target doesn't produce an intent.
 */
export function buildDropIntent(
    payload: DragPayload,
    targetId: string,
    traceId: string,
): CreateShortcutIntent | null {
    const config = targets.get(targetId);
    if (!config) return null;

    const validation = validateDrop(payload, targetId);
    if (!validation.ok) return null;

    return config.buildIntent(payload, traceId);
}

// ─── Desktop Target (Pre-registered) ───────────────────────────────────

/**
 * Register the default desktop drop target.
 * Called once during OS initialization.
 */
export function registerDesktopTarget(): void {
    registerDropTarget('desktop', {
        targetId: 'desktop',
        accepts: ['capability'],
        buildIntent: (payload, traceId) => {
            if (payload.type !== 'capability' || !payload.capabilityId) return null;
            return {
                action: 'desktop.shortcut.create',
                target: { desktopId: 'default' },
                payload: {
                    capabilityId: payload.capabilityId,
                    title: payload.label,
                    icon: payload.icon ?? '📦',
                },
                traceId,
            };
        },
    });
}
