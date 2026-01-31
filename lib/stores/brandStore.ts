/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA — Brand Store V2
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.8: Split Header vs Login Brand Settings
 * 
 * Features:
 * - Separate logo settings for Header and Login
 * - 2MB file upload limit
 * - localStorage persistence
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Settings for a single location (header or login) */
export interface LocationBrandSettings {
    /** Logo as Data URL (base64) */
    logoDataUrl: string | null;
    /** MIME type of the logo */
    logoMime: string | null;
    /** Logo size in pixels */
    logoSizePx: number;
    /** Gap between logo and brand name in pixels */
    brandGapPx: number;
    /** Whether to show brand name next to logo */
    showBrandName: boolean;
}

/** Complete brand settings for all locations */
export interface BrandSettings {
    header: LocationBrandSettings;
    login: LocationBrandSettings;
}

export interface BrandState {
    /** Brand settings for all locations */
    settings: BrandSettings;

    /** Update header settings */
    updateHeader: (settings: Partial<LocationBrandSettings>) => void;

    /** Update login settings */
    updateLogin: (settings: Partial<LocationBrandSettings>) => void;

    /** Set header logo */
    setHeaderLogo: (dataUrl: string | null, mime?: string | null) => void;

    /** Set login logo */
    setLoginLogo: (dataUrl: string | null, mime?: string | null) => void;

    /** Clear header logo */
    clearHeaderLogo: () => void;

    /** Clear login logo */
    clearLoginLogo: () => void;

    /** Reset all settings to defaults */
    resetAll: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_HEADER: LocationBrandSettings = {
    logoDataUrl: null,
    logoMime: null,
    logoSizePx: 28,
    brandGapPx: 8,
    showBrandName: true,
};

const DEFAULT_LOGIN: LocationBrandSettings = {
    logoDataUrl: null,
    logoMime: null,
    logoSizePx: 64,
    brandGapPx: 12,
    showBrandName: true,
};

const DEFAULT_SETTINGS: BrandSettings = {
    header: DEFAULT_HEADER,
    login: DEFAULT_LOGIN,
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useBrandStore = create<BrandState>()(
    persist(
        (set) => ({
            settings: DEFAULT_SETTINGS,

            updateHeader: (newSettings) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        header: { ...state.settings.header, ...newSettings }
                    }
                }));
            },

            updateLogin: (newSettings) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        login: { ...state.settings.login, ...newSettings }
                    }
                }));
            },

            setHeaderLogo: (dataUrl, mime = null) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        header: {
                            ...state.settings.header,
                            logoDataUrl: dataUrl,
                            logoMime: mime,
                        }
                    }
                }));
            },

            setLoginLogo: (dataUrl, mime = null) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        login: {
                            ...state.settings.login,
                            logoDataUrl: dataUrl,
                            logoMime: mime,
                        }
                    }
                }));
            },

            clearHeaderLogo: () => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        header: {
                            ...state.settings.header,
                            logoDataUrl: null,
                            logoMime: null,
                        }
                    }
                }));
            },

            clearLoginLogo: () => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        login: {
                            ...state.settings.login,
                            logoDataUrl: null,
                            logoMime: null,
                        }
                    }
                }));
            },

            resetAll: () => {
                set({ settings: DEFAULT_SETTINGS });
            },
        }),
        {
            name: 'apicoredata.brand.settings.v2',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// HYDRATION HOOK (for SSR safety)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to check if the store has been hydrated from localStorage.
 * Use this to prevent SSR hydration mismatches.
 * 
 * Usage:
 * const hasHydrated = useHasHydrated();
 * if (!hasHydrated) return <Skeleton />;
 */
export function useHasHydrated(): boolean {
    const [hasHydrated, setHasHydrated] = React.useState(false);

    React.useEffect(() => {
        // Access the store's API to check hydration
        const unsubFinishHydration = useBrandStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });

        // If already hydrated, set immediately
        if (useBrandStore.persist.hasHydrated()) {
            setHasHydrated(true);
        }

        return () => {
            unsubFinishHydration();
        };
    }, []);

    return hasHydrated;
}



// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Maximum file size: 2MB */
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/** Allowed file types */
export const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp',
];

/**
 * Validate file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (2MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: 'FILE_TOO_LARGE' };
    }

    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { valid: false, error: 'INVALID_TYPE' };
    }

    return { valid: true };
}

/**
 * Convert file to dataURL for localStorage storage
 * @param file - File to convert
 * @returns Promise<{ dataUrl: string, mime: string }>
 */
export async function fileToDataUrl(file: File): Promise<{ dataUrl: string; mime: string }> {
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            dataUrl: reader.result as string,
            mime: file.type,
        });
        reader.onerror = () => reject(new Error('FAILED_TO_READ'));
        reader.readAsDataURL(file);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { DEFAULT_HEADER, DEFAULT_LOGIN, DEFAULT_SETTINGS };
export default useBrandStore;
