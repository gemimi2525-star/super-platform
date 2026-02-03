'use client';

/**
 * Simple Language Switcher Component
 * 
 * Minimal UI component for switching between EN/TH locales.
 * Works without SidebarContext or BrandContext - suitable for public pages.
 * 
 * Usage:
 *   <SimpleLanguageSwitcher /> - renders EN|TH toggle button
 */

import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';

const SUPPORTED_LOCALES = ['en', 'th'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

interface SimpleLanguageSwitcherProps {
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show globe icon */
    showIcon?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export function SimpleLanguageSwitcher({
    size = 'md',
    showIcon = true,
    className = '',
}: SimpleLanguageSwitcherProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [currentLocale, setCurrentLocale] = useState<Locale>('en');
    const initialized = useRef(false);

    // Detect current locale from pathname
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const pathParts = pathname.split('/');
        const urlLocale = pathParts[1] as Locale;

        if (SUPPORTED_LOCALES.includes(urlLocale)) {
            setCurrentLocale(urlLocale);
        }
    }, [pathname]);

    const handleSwitch = () => {
        const newLocale: Locale = currentLocale === 'en' ? 'th' : 'en';
        const pathParts = pathname.split('/');

        // Replace locale segment
        if (SUPPORTED_LOCALES.includes(pathParts[1] as Locale)) {
            pathParts[1] = newLocale;
        } else {
            // No locale in path - add it
            pathParts.splice(1, 0, newLocale);
        }

        let newPath = pathParts.join('/');

        // Preserve query string
        const query = searchParams?.toString();
        if (query) {
            newPath += `?${query}`;
        }

        window.location.href = newPath;
    };

    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs gap-1',
        md: 'px-3 py-1.5 text-sm gap-1.5',
        lg: 'px-4 py-2 text-base gap-2',
    };

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <button
            onClick={handleSwitch}
            className={`
                inline-flex items-center justify-center
                font-medium rounded-full
                border border-gray-200 bg-white/90 backdrop-blur-sm
                hover:bg-gray-50 hover:border-gray-300
                active:bg-gray-100
                transition-all duration-150
                shadow-sm hover:shadow
                ${sizeClasses[size]}
                ${className}
            `}
            title={currentLocale === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
        >
            {showIcon && (
                <Globe className={`${iconSize[size]} text-gray-500`} />
            )}
            <span className="text-gray-700 font-semibold">
                {currentLocale === 'en' ? 'TH' : 'EN'}
            </span>
        </button>
    );
}

export default SimpleLanguageSwitcher;
