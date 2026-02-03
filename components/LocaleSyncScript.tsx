'use client';

import { useEffect } from 'react';

/**
 * LocaleSyncScript - Ensures cookie locale preference is respected
 * 
 * On pageshow (including bfcache restoration from Back button):
 * - If cookie locale differs from URL locale → redirect to cookie locale
 * - This ensures user's language preference persists across navigation
 * 
 * Uses `pageshow` event which fires on:
 * - Normal page loads
 * - Back/Forward navigation (from bfcache)
 */
export function LocaleSyncScript({ locale }: { locale: string }) {
    useEffect(() => {
        // Check if cookie locale differs from current URL locale
        const checkAndRedirect = () => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const cookieLocale = cookies['NEXT_LOCALE'];

            // If cookie locale is set AND differs from URL locale → redirect
            if (cookieLocale && cookieLocale !== locale) {
                // Build new URL with cookie locale
                const currentPath = window.location.pathname;
                const pathParts = currentPath.split('/');

                // Replace locale in path
                if (['en', 'th'].includes(pathParts[1])) {
                    pathParts[1] = cookieLocale;
                } else {
                    pathParts.splice(1, 0, cookieLocale);
                }

                const newPath = pathParts.join('/') || '/';
                const query = window.location.search;

                // Redirect to correct locale (use replace to avoid adding history)
                window.location.replace(newPath + query);
                return;
            }

            // If no mismatch, sync cookie to URL (normal case)
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        };

        // Check on mount (handles fresh page loads)
        checkAndRedirect();

        // Handle bfcache (back/forward navigation)
        const handlePageShow = (e: PageTransitionEvent) => {
            // e.persisted = true means restored from bfcache
            if (e.persisted) {
                checkAndRedirect();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [locale]);

    // Render nothing - this is just for side effects
    return null;
}

export default LocaleSyncScript;
