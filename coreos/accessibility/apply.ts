/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Accessibility Apply Layer (Phase 22)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sole writer to localStorage + CSS side-effects.
 * Called only after API success.
 */
import type { AccessibilityState, FocusRingMode } from './types';
import { loadAccessibility, saveAccessibility } from './storage';

/** Apply full accessibility state to DOM */
export function applyAccessibilityToDom(state: AccessibilityState): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // High contrast
    root.dataset.highContrast = String(state.highContrast);

    // Reduced motion
    root.dataset.reducedMotion = String(state.reducedMotion);

    // Focus ring mode
    root.dataset.focusRing = state.focusRingMode;
}

function applyAndPersist(partial: Partial<AccessibilityState>): AccessibilityState {
    const current = loadAccessibility();
    const updated: AccessibilityState = {
        ...current,
        ...partial,
        updatedAt: new Date().toISOString(),
    };
    saveAccessibility(updated);
    applyAccessibilityToDom(updated);
    return updated;
}

export function applyHighContrastChanged(enabled: boolean): AccessibilityState {
    return applyAndPersist({ highContrast: enabled });
}

export function applyReducedMotionChanged(enabled: boolean): AccessibilityState {
    return applyAndPersist({ reducedMotion: enabled });
}

export function applyFocusRingChanged(mode: FocusRingMode): AccessibilityState {
    return applyAndPersist({ focusRingMode: mode });
}
