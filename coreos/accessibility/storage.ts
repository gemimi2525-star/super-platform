/**
 * CORE OS — Accessibility Storage Adapter (Phase 22)
 * SSR-safe localStorage adapter. Write methods called ONLY by apply layer.
 */
import { type AccessibilityState, DEFAULT_ACCESSIBILITY, A11Y_STORAGE_KEY } from './types';

export function loadAccessibility(): AccessibilityState {
    if (typeof window === 'undefined') return DEFAULT_ACCESSIBILITY;
    try {
        const raw = localStorage.getItem(A11Y_STORAGE_KEY);
        if (!raw) return DEFAULT_ACCESSIBILITY;
        const parsed = JSON.parse(raw) as AccessibilityState;
        if (!parsed || typeof parsed.highContrast !== 'boolean') return DEFAULT_ACCESSIBILITY;
        return { ...DEFAULT_ACCESSIBILITY, ...parsed };
    } catch {
        return DEFAULT_ACCESSIBILITY;
    }
}

export function saveAccessibility(state: AccessibilityState): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(state));
}
