'use client';

/**
 * Language Switcher Component
 * 
 * Allows users to switch between th, en, zh
 * Uses localStorage to persist language preference
 */

import { useState, useEffect, useRef } from 'react';

const languages = [
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

export function LanguageSwitcher() {
    const [currentLocale, setCurrentLocale] = useState<LanguageCode>('en');
    const [isChanging, setIsChanging] = useState(false);
    const initialized = useRef(false);

    // Initialize once on mount - NO dependency that causes re-run
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Get saved language from localStorage only on first mount
        const savedLocale = localStorage.getItem('locale') as LanguageCode;
        if (savedLocale && languages.some(l => l.code === savedLocale)) {
            setCurrentLocale(savedLocale);
        }
    }, []); // Empty dependency - run only once

    const handleLanguageChange = (newLocale: LanguageCode) => {
        if (newLocale === currentLocale || isChanging) {
            return; // ป้องกัน double click
        }

        console.log('[LanguageSwitcher] Changing language to:', newLocale);
        setIsChanging(true);

        // Save to localStorage
        localStorage.setItem('locale', newLocale);
        setCurrentLocale(newLocale);

        // Dispatch custom event for next-intl to pick up
        window.dispatchEvent(new CustomEvent('localeChange', { detail: newLocale }));

        // Hard reload for i18n to reload messages (needed for server components)
        // BUT only do it once, not in a loop
        setTimeout(() => {
            // Only reload if we're still on same page
            const currentPath = window.location.pathname;
            window.location.href = currentPath; // Navigate to same URL with new locale
        }, 100);
    };

    return (
        <div className="relative inline-block">
            <select
                value={currentLocale}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                disabled={isChanging}
                className="px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}
