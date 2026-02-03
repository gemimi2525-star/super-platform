'use client';

/**
 * Language Dropdown Component
 * 
 * Dropdown menu for switching between locales (EN/TH/future ZH).
 * Uses Portal for proper rendering and click-outside-to-close.
 * 
 * Usage:
 *   <LanguageDropdown />
 *   <LanguageDropdown mode="goHome" homeTarget="localized" />
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Portal } from '@/components/ui-base/Portal';

// Supported locales - add new languages here
const SUPPORTED_LOCALES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    // { code: 'zh', name: '中文', flag: '🇨🇳' }, // Ready for future
] as const;

type LocaleCode = typeof SUPPORTED_LOCALES[number]['code'];

interface LanguageDropdownProps {
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
    /** 
     * Navigation mode:
     * - 'preservePath': Keep current path, just swap locale (default)
     * - 'goHome': Navigate to home page after switching
     */
    mode?: 'preservePath' | 'goHome';
    /**
     * Home target when mode='goHome':
     * - 'root': Navigate to /
     * - 'localized': Navigate to /{locale} (default)
     */
    homeTarget?: 'root' | 'localized';
}

export function LanguageDropdown({
    size = 'md',
    className = '',
    mode = 'preservePath',
    homeTarget = 'localized',
}: LanguageDropdownProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [currentLocale, setCurrentLocale] = useState<LocaleCode>('en');
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Detect current locale from pathname
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const pathParts = pathname.split('/');
        const urlLocale = pathParts[1] as LocaleCode;

        if (SUPPORTED_LOCALES.some(l => l.code === urlLocale)) {
            setCurrentLocale(urlLocale);
        }
    }, [pathname]);

    // Update dropdown position when button is clicked
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    };

    const handleSelectLocale = (newLocale: LocaleCode) => {
        if (newLocale === currentLocale) {
            setIsOpen(false);
            return;
        }

        let newPath: string;

        // Determine target path based on mode
        if (mode === 'goHome') {
            // Navigate to home page
            newPath = homeTarget === 'root' ? '/' : `/${newLocale}`;
        } else {
            // preservePath: swap locale in current path
            const pathParts = pathname.split('/');

            if (SUPPORTED_LOCALES.some(l => l.code === pathParts[1] as LocaleCode)) {
                pathParts[1] = newLocale;
            } else {
                pathParts.splice(1, 0, newLocale);
            }

            newPath = pathParts.join('/');
        }

        // Preserve query string
        const query = searchParams?.toString();
        if (query) {
            newPath += `?${query}`;
        }

        // CRITICAL: Sync cookie BEFORE navigation
        // This ensures middleware and system state use the new locale
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

        // Use replaceState to avoid adding history entry (prevents Back loop)
        window.history.replaceState(null, '', newPath);
        window.location.reload();
    };

    const currentLang = SUPPORTED_LOCALES.find(l => l.code === currentLocale) || SUPPORTED_LOCALES[0];

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
        <>
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`
                    inline-flex items-center justify-center
                    font-medium rounded-full
                    border border-gray-200 bg-white/90 backdrop-blur-sm
                    hover:bg-gray-50 hover:border-gray-300
                    active:bg-gray-100
                    transition-all duration-150
                    shadow-sm hover:shadow
                    ${sizeClasses[size]}
                    ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-300' : ''}
                    ${className}
                `}
                title="Change language"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Globe className={`${iconSize[size]} text-gray-500`} />
                <span className="text-gray-700 font-semibold uppercase">
                    {currentLang.code}
                </span>
                <ChevronDown className={`${iconSize[size]} text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <Portal>
                    <div
                        ref={dropdownRef}
                        className="fixed z-[200] min-w-[160px] py-1 bg-white rounded-lg shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-150"
                        style={{
                            top: dropdownPosition.top,
                            right: dropdownPosition.right,
                        }}
                        role="listbox"
                        aria-label="Select language"
                    >
                        {SUPPORTED_LOCALES.map((locale) => {
                            const isActive = currentLocale === locale.code;
                            return (
                                <button
                                    key={locale.code}
                                    onClick={() => handleSelectLocale(locale.code)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                        transition-colors duration-100
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                    role="option"
                                    aria-selected={isActive}
                                >
                                    <span className="text-lg">{locale.flag}</span>
                                    <span className="flex-1 text-left">{locale.name}</span>
                                    {isActive && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Portal>
            )}
        </>
    );
}

export default LanguageDropdown;
