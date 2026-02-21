/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Accessibility Types (Phase 22)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @module coreos/accessibility/types
 */

export type FocusRingMode = 'auto' | 'always' | 'keyboard-only';

export interface AccessibilityState {
    readonly highContrast: boolean;
    readonly reducedMotion: boolean;
    readonly focusRingMode: FocusRingMode;
    readonly updatedAt: string;
}

export const DEFAULT_ACCESSIBILITY: AccessibilityState = {
    highContrast: false,
    reducedMotion: false,
    focusRingMode: 'auto',
    updatedAt: new Date(0).toISOString(),
};

export const A11Y_STORAGE_KEY = 'coreos:accessibility:v1';
