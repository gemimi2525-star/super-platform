'use client';

import { useEffect } from 'react';

/**
 * LocaleSyncScript - Syncs cookie to URL locale on every page show
 * 
 * Fixes bfcache issue where Back button loads page from cache
 * without going through middleware, causing cookie to get out of sync.
 * 
 * Uses `pageshow` event which fires on:
 * - Normal page loads
 * - Back/Forward navigation (from bfcache)
 */
export function LocaleSyncScript({ locale }: { locale: string }) {
    useEffect(() => {
        // Sync cookie immediately on mount
        const syncCookie = () => {
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        };

        syncCookie();

        // Handle bfcache (back/forward navigation)
        const handlePageShow = (e: PageTransitionEvent) => {
            // e.persisted = true means page was restored from bfcache
            // But we sync on both cases to ensure consistency
            syncCookie();
        };

        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [locale]);

    // Render nothing - this is just for side effects
    return null;
}

export default LocaleSyncScript;
