'use client';

/**
 * Brand Context
 * 
 * Provides global state for brand settings per location
 * Fetches from Firestore on mount, updates when settings change
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    getBrandSettings,
    type BrandSettings,
    type LocationBrandSettings,
    DEFAULT_HEADER,
    DEFAULT_SIDEBAR,
    DEFAULT_LOGIN
} from '@/lib/firebase/brand';
import { BRAND } from '@/config/brand';

interface BrandContextValue {
    /** Current logo URL (from Firebase or fallback to default) */
    logoUrl: string;
    /** Brand name (from Firebase or fallback to default) */
    brandName: string;
    /** Header settings */
    header: LocationBrandSettings;
    /** Sidebar settings */
    sidebar: LocationBrandSettings;
    /** Login page settings */
    login: LocationBrandSettings;
    /** Whether brand settings are loading */
    isLoading: boolean;
    /** Force refresh brand settings from Firestore */
    /** Force refresh brand settings from Firestore */
    refreshBrand: () => Promise<void>;
    /** Update logo URL locally */
    updateLogo: (url: string) => void;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

interface BrandProviderProps {
    children: ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
    const [settings, setSettings] = useState<BrandSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBrandSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBrandSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch brand settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrandSettings();
    }, [fetchBrandSettings]);

    // Get per-location settings with brandName fallback to BRAND.name if empty
    const headerSettings: LocationBrandSettings = {
        ...(settings?.header || DEFAULT_HEADER),
        brandName: settings?.header?.brandName || BRAND.name,
    };
    const sidebarSettings: LocationBrandSettings = {
        ...(settings?.sidebar || DEFAULT_SIDEBAR),
        brandName: settings?.sidebar?.brandName || BRAND.name,
    };
    const loginSettings: LocationBrandSettings = {
        ...(settings?.login || DEFAULT_LOGIN),
        brandName: settings?.login?.brandName || BRAND.name,
    };

    const value: BrandContextValue = {
        logoUrl: settings?.logoUrl || BRAND.logo,
        brandName: headerSettings.brandName, // Legacy: use header brandName as default
        header: headerSettings,
        sidebar: sidebarSettings,
        login: loginSettings,
        isLoading,
        refreshBrand: fetchBrandSettings,
        updateLogo: (url: string) => {
            // Local override for demo/session
            setSettings(prev => prev ? { ...prev, logoUrl: url } : { logoUrl: url } as BrandSettings);
        }
    };

    return (
        <BrandContext.Provider value={value}>
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand(): BrandContextValue {
    const context = useContext(BrandContext);
    if (context === undefined) {
        // Return default values if not wrapped in provider
        return {
            logoUrl: BRAND.logo,
            brandName: BRAND.name,
            header: DEFAULT_HEADER,
            sidebar: DEFAULT_SIDEBAR,
            login: DEFAULT_LOGIN,
            isLoading: false,
            refreshBrand: async () => { },
            updateLogo: () => { },
        };
    }
    return context;
}

export { BrandContext };
export type { LocationBrandSettings };
