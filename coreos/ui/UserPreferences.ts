/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — User Preferences (Phase H)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * User-owned preferences for Dock and Finder
 * 
 * CONTRACT COMPLIANCE:
 * @see /docs/contracts/DOCK_CONTRACT_v1.md Section 6
 * 
 * RULES:
 * - ✅ Pinned capabilities are user-explicit choice
 * - ✅ Add/Remove via explicit user action only
 * - ❌ No auto-pin on launch
 * 
 * @module coreos/ui/UserPreferences
 * @version 1.0.0 (Phase H)
 */

import type { CapabilityId } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// USER PREFERENCES SHAPE
// ═══════════════════════════════════════════════════════════════════════════

export interface UserPreferences {
    /** User-pinned capability IDs (Dock) */
    readonly pinnedCapabilities: readonly CapabilityId[];
    /** Finder preferences (future expansion) */
    readonly finder: {
        readonly showSearchable: boolean; // Show searchable-only items in search
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    pinnedCapabilities: [
        'core.finder',
        'core.settings',
    ],
    finder: {
        showSearchable: true,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEY (LocalStorage)
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'synapse:user_preferences';

// ═══════════════════════════════════════════════════════════════════════════
// PERSISTENCE LAYER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load user preferences from storage
 */
export function loadUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
        return DEFAULT_USER_PREFERENCES;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return DEFAULT_USER_PREFERENCES;
        }

        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        return {
            pinnedCapabilities: parsed.pinnedCapabilities ?? DEFAULT_USER_PREFERENCES.pinnedCapabilities,
            finder: {
                showSearchable: parsed.finder?.showSearchable ?? DEFAULT_USER_PREFERENCES.finder.showSearchable,
            },
        };
    } catch {
        return DEFAULT_USER_PREFERENCES;
    }
}

/**
 * Save user preferences to storage
 */
export function saveUserPreferences(preferences: UserPreferences): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
        // Storage full or unavailable
        console.warn('[UserPreferences] Failed to save preferences');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PIN/UNPIN ACTIONS (Explicit User Choice Only)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pin a capability to Dock (user action)
 */
export function pinCapability(
    preferences: UserPreferences,
    capabilityId: CapabilityId
): UserPreferences {
    if (preferences.pinnedCapabilities.includes(capabilityId)) {
        return preferences; // Already pinned
    }

    return {
        ...preferences,
        pinnedCapabilities: [...preferences.pinnedCapabilities, capabilityId],
    };
}

/**
 * Unpin a capability from Dock (user action)
 */
export function unpinCapability(
    preferences: UserPreferences,
    capabilityId: CapabilityId
): UserPreferences {
    return {
        ...preferences,
        pinnedCapabilities: preferences.pinnedCapabilities.filter(id => id !== capabilityId),
    };
}

/**
 * Check if capability is pinned
 */
export function isCapabilityPinned(
    preferences: UserPreferences,
    capabilityId: CapabilityId
): boolean {
    return preferences.pinnedCapabilities.includes(capabilityId);
}
