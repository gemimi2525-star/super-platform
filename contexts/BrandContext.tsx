'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Brand Context V2
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.8: Split Header vs Login Brand Settings
 * 
 * Provides global state for brand settings with:
 * - Separate settings for Header and Login (from localStorage)
 * - Firebase fallback for legacy compatibility
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    getBrandSettings,
    type BrandSettings as FirebaseBrandSettings,
    type LocationBrandSettings as FirebaseLocationSettings,
    DEFAULT_HEADER as FB_DEFAULT_HEADER,
    DEFAULT_SIDEBAR as FB_DEFAULT_SIDEBAR,
    DEFAULT_LOGIN as FB_DEFAULT_LOGIN
} from '@/lib/firebase/brand';
import { BRAND } from '@/config/brand';
import {
    useBrandStore,
    type BrandSettings as LocalBrandSettings,
    type LocationBrandSettings as LocalLocationSettings,
    DEFAULT_HEADER as LOCAL_DEFAULT_HEADER,
    DEFAULT_LOGIN as LOCAL_DEFAULT_LOGIN,
} from '@/lib/stores/brandStore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BrandContextValue {
    /** Brand name */
    brandName: string;

    /** Whether brand settings are loading from Firebase */
    isLoading: boolean;

    /** Force refresh brand settings from Firestore */
    refreshBrand: () => Promise<void>;

    // ─────────────────────────────────────────────────────────────────────────
    // HEADER SETTINGS (from localStorage - MVP)
    // ─────────────────────────────────────────────────────────────────────────

    /** Header logo URL (localStorage > default) */
    headerLogoUrl: string;

    /** Header settings from localStorage */
    headerSettings: LocalLocationSettings;

    /** Update header settings */
    updateHeaderSettings: (settings: Partial<LocalLocationSettings>) => void;

    /** Set header logo */
    setHeaderLogo: (dataUrl: string | null, mime?: string | null) => void;

    /** Clear header logo */
    clearHeaderLogo: () => void;

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN SETTINGS (from localStorage - MVP)
    // ─────────────────────────────────────────────────────────────────────────

    /** Login logo URL (localStorage > default) */
    loginLogoUrl: string;

    /** Login settings from localStorage */
    loginSettings: LocalLocationSettings;

    /** Update login settings */
    updateLoginSettings: (settings: Partial<LocalLocationSettings>) => void;

    /** Set login logo */
    setLoginLogo: (dataUrl: string | null, mime?: string | null) => void;

    /** Clear login logo */
    clearLoginLogo: () => void;

    // ─────────────────────────────────────────────────────────────────────────
    // LEGACY (Firebase) - for backward compatibility
    // ─────────────────────────────────────────────────────────────────────────

    /** Legacy: Firebase header settings */
    header: FirebaseLocationSettings;

    /** Legacy: Firebase sidebar settings */
    sidebar: FirebaseLocationSettings;

    /** Legacy: Firebase login settings */
    login: FirebaseLocationSettings;

    /** Legacy: Firebase logo URL */
    logoUrl: string;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

interface BrandProviderProps {
    children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function BrandProvider({ children }: BrandProviderProps) {
    const [firebaseSettings, setFirebaseSettings] = useState<FirebaseBrandSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Local store for MVP persistence (separate Header vs Login)
    const localSettings = useBrandStore((state) => state.settings);
    const updateHeader = useBrandStore((state) => state.updateHeader);
    const updateLogin = useBrandStore((state) => state.updateLogin);
    const setHeaderLogo = useBrandStore((state) => state.setHeaderLogo);
    const setLoginLogo = useBrandStore((state) => state.setLoginLogo);
    const clearHeaderLogo = useBrandStore((state) => state.clearHeaderLogo);
    const clearLoginLogo = useBrandStore((state) => state.clearLoginLogo);

    // Fetch Firebase settings (legacy fallback)
    const fetchBrandSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBrandSettings();
            setFirebaseSettings(data);
        } catch (error) {
            console.error('Failed to fetch brand settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrandSettings();
    }, [fetchBrandSettings]);

    // ─────────────────────────────────────────────────────────────────────────
    // DERIVED VALUES
    // ─────────────────────────────────────────────────────────────────────────

    // Header logo: localStorage > Firebase > default
    const headerLogoUrl = localSettings.header.logoDataUrl || firebaseSettings?.logoUrl || BRAND.logo;

    // Login logo: localStorage > Firebase > default
    const loginLogoUrl = localSettings.login.logoDataUrl || firebaseSettings?.logoUrl || BRAND.logo;

    // Legacy Firebase settings (for components still using old API)
    const headerFirebase: FirebaseLocationSettings = {
        ...(firebaseSettings?.header || FB_DEFAULT_HEADER),
        brandName: firebaseSettings?.header?.brandName || BRAND.name,
    };
    const sidebarFirebase: FirebaseLocationSettings = {
        ...(firebaseSettings?.sidebar || FB_DEFAULT_SIDEBAR),
        brandName: firebaseSettings?.sidebar?.brandName || BRAND.name,
    };
    const loginFirebase: FirebaseLocationSettings = {
        ...(firebaseSettings?.login || FB_DEFAULT_LOGIN),
        brandName: firebaseSettings?.login?.brandName || BRAND.name,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // CONTEXT VALUE
    // ─────────────────────────────────────────────────────────────────────────

    const value: BrandContextValue = {
        brandName: BRAND.name,
        isLoading,
        refreshBrand: fetchBrandSettings,

        // Header (localStorage - MVP)
        headerLogoUrl,
        headerSettings: localSettings.header,
        updateHeaderSettings: updateHeader,
        setHeaderLogo,
        clearHeaderLogo,

        // Login (localStorage - MVP)
        loginLogoUrl,
        loginSettings: localSettings.login,
        updateLoginSettings: updateLogin,
        setLoginLogo,
        clearLoginLogo,

        // Legacy (Firebase)
        header: headerFirebase,
        sidebar: sidebarFirebase,
        login: loginFirebase,
        logoUrl: firebaseSettings?.logoUrl || BRAND.logo,
    };

    return (
        <BrandContext.Provider value={value}>
            {children}
        </BrandContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useBrand(): BrandContextValue {
    const context = useContext(BrandContext);

    if (context === undefined) {
        // Return default values if not wrapped in provider
        return {
            brandName: BRAND.name,
            isLoading: false,
            refreshBrand: async () => { },

            // Header defaults
            headerLogoUrl: BRAND.logo,
            headerSettings: LOCAL_DEFAULT_HEADER,
            updateHeaderSettings: () => { },
            setHeaderLogo: () => { },
            clearHeaderLogo: () => { },

            // Login defaults
            loginLogoUrl: BRAND.logo,
            loginSettings: LOCAL_DEFAULT_LOGIN,
            updateLoginSettings: () => { },
            setLoginLogo: () => { },
            clearLoginLogo: () => { },

            // Legacy defaults
            header: FB_DEFAULT_HEADER,
            sidebar: FB_DEFAULT_SIDEBAR,
            login: FB_DEFAULT_LOGIN,
            logoUrl: BRAND.logo,
        };
    }
    return context;
}

export { BrandContext };
export type { FirebaseLocationSettings as LocationBrandSettings };
