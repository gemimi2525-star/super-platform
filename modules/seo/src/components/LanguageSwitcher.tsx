'use client';

/**
 * Language Switcher Component
 * 
 * Allows users to switch between th, en, zh
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const languages = [
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const [currentLocale, setCurrentLocale] = useState<LanguageCode>('th');

    useEffect(() => {
        // Get saved language from localStorage
        const saved = localStorage.getItem('preferred-language') as LanguageCode;
        if (saved && languages.some(l => l.code === saved)) {
            setCurrentLocale(saved);
        }
    }, []);

    const handleLanguageChange = (newLocale: LanguageCode) => {
        // Save to localStorage
        localStorage.setItem('preferred-language', newLocale);
        setCurrentLocale(newLocale);

        // Update URL (for future implementation with locale prefix)
        // For now, just reload with new locale
        window.location.reload();
    };

    return (
        <div className="relative inline-block">
            <select
                value={currentLocale}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                className="px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
