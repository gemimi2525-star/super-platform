/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Desktop Shortcut Types (Phase 19.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical data model for desktop shortcuts.
 * All mutations flow through Intent → API → Apply pipeline.
 *
 * @module coreos/desktop/shortcuts/types
 */

// ─── Desktop Shortcut (Canonical) ──────────────────────────────────────

export interface DesktopShortcut {
    /** Unique ID (ULID-like: timestamp + random) */
    readonly id: string;

    /** Capability that this shortcut launches */
    readonly capabilityId: string;

    /** Display title */
    readonly title: string;

    /** Emoji icon */
    readonly icon: string;

    /** ISO 8601 creation timestamp */
    readonly createdAt: string;

    /** Creator info */
    readonly createdBy: {
        readonly uid: string;
    };

    /** Trace ID for audit correlation */
    readonly traceId: string;

    /** Origin of the shortcut */
    readonly source: {
        readonly from: 'dock' | 'finder' | 'system';
        readonly appId?: string;
    };

    /** Grid position (future-proof) */
    readonly position?: {
        readonly x: number;
        readonly y: number;
    };
}

// ─── Intent Input (client → API) ───────────────────────────────────────

export interface CreateShortcutIntent {
    readonly action: 'desktop.shortcut.create';
    readonly target: { readonly desktopId: 'default' };
    readonly payload: {
        readonly capabilityId: string;
        readonly title: string;
        readonly icon: string;
        readonly position?: { x: number; y: number };
    };
    readonly traceId: string;
}

export interface RemoveShortcutIntent {
    readonly action: 'desktop.shortcut.remove';
    readonly target: { readonly desktopId: 'default' };
    readonly payload: {
        readonly shortcutId: string;
    };
    readonly traceId: string;
}

// ─── ULID-like ID Generator ────────────────────────────────────────────

export function generateShortcutId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `sc-${ts}-${rand}`;
}
