/**
 * CORE OS — Accessibility Zustand Store (Phase 22)
 * SSR-safe store. All mutations go through apply layer.
 */
'use client';

import { create } from 'zustand';
import type { AccessibilityState, FocusRingMode } from './types';
import { DEFAULT_ACCESSIBILITY } from './types';
import { loadAccessibility } from './storage';
import {
    applyAccessibilityToDom,
    applyHighContrastChanged,
    applyReducedMotionChanged,
    applyFocusRingChanged,
} from './apply';

interface A11yStoreState extends AccessibilityState {
    hydrate: () => void;
    setHighContrast: (enabled: boolean) => void;
    setReducedMotion: (enabled: boolean) => void;
    setFocusRing: (mode: FocusRingMode) => void;
}

export const useAccessibilityStore = create<A11yStoreState>((set) => ({
    ...DEFAULT_ACCESSIBILITY,

    hydrate: () => {
        const state = loadAccessibility();
        set(state);
        applyAccessibilityToDom(state);
    },

    setHighContrast: (enabled) => {
        const updated = applyHighContrastChanged(enabled);
        set(updated);
    },

    setReducedMotion: (enabled) => {
        const updated = applyReducedMotionChanged(enabled);
        set(updated);
    },

    setFocusRing: (mode) => {
        const updated = applyFocusRingChanged(mode);
        set(updated);
    },
}));
