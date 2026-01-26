'use client';

/**
 * Language Switcher Component
 * Opens as a right-side sidebar panel
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Portal } from '@/components/ui-base/Portal';
import { useSidebar } from '@/contexts/SidebarContext';
import { useBrand } from '@/contexts/BrandContext';
import { BrandLogo } from '@/components/BrandLogo';
import { X, Globe, Check } from 'lucide-react';

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
    const { isLangSidebarOpen, toggleLangSidebar, closeLangSidebar } = useSidebar();
    const { sidebar } = useBrand();

    // Animation state - separate from visibility for smooth transition
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isLangSidebarOpen) {
            // Small delay to trigger CSS transition after mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isLangSidebarOpen]);

    // Initialize once on mount - detect from URL
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const pathParts = window.location.pathname.split('/');
        const urlLocale = pathParts[1] as LanguageCode;

        if (urlLocale && languages.some(l => l.code === urlLocale)) {
            setCurrentLocale(urlLocale);
            localStorage.setItem('locale', urlLocale);
        } else {
            const savedLocale = localStorage.getItem('locale') as LanguageCode;
            if (savedLocale && languages.some(l => l.code === savedLocale)) {
                setCurrentLocale(savedLocale);
            }
        }
    }, []);

    const handleLanguageChange = (newLocale: LanguageCode) => {
        if (newLocale === currentLocale || isChanging) {
            return;
        }

        setIsChanging(true);
        localStorage.setItem('locale', newLocale);
        setCurrentLocale(newLocale);

        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');

        if (languages.some(l => l.code === pathParts[1])) {
            pathParts[1] = newLocale;
        } else {
            pathParts.splice(1, 0, newLocale);
        }

        const newPath = pathParts.join('/');
        window.location.href = newPath;
    };

    const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

    return (
        <>
            {/* Language Button */}
            <button
                onClick={toggleLangSidebar}
                className={`
                    flex items-center justify-center gap-1
                    h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] md:h-[42px] md:w-[42px]
                    rounded-full transition-all duration-150 border group outline-none
                    shadow-sm hover:shadow-md focus-visible:ring-2 ring-blue-500/20
                    ${isLangSidebarOpen
                        ? 'bg-purple-50 border-purple-300 shadow-md'
                        : 'bg-white/80 hover:bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }
                `}
                title={currentLang.name}
            >
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold uppercase text-[#242424] leading-none">
                    {currentLang.code.toUpperCase()}
                </span>
            </button>

            {/* Language Sidebar Panel - FROM RIGHT */}
            {isLangSidebarOpen && (
                <Portal>
                    {/* Backdrop - No blur/opacity */}
                    <div
                        className="fixed inset-0 z-[240]"
                        onClick={closeLangSidebar}
                    />

                    {/* Sidebar Panel - RIGHT SIDE, Using transition-transform like Main Sidebar */}
                    <aside className={`
                        fixed top-0 right-0 bottom-0 z-[250] w-[180px]
                        bg-[#FAFAFA] border-l border-[#E8E8E8] flex flex-col
                        transition-transform duration-300 ease-in-out
                        ${isVisible ? 'translate-x-0 shadow-lg' : 'translate-x-full'}
                    `}>
                        {/* Sidebar Header with BrandLogo - Same as Main Sidebar */}
                        <div className="px-4 py-4 border-b border-gray-100">
                            <Link href="/platform" className="flex items-center group" onClick={closeLangSidebar}>
                                <BrandLogo size="sm" location="sidebar" />
                                <span className="font-bold text-[#111827] text-sm ml-2 group-hover:text-gray-700 transition-colors truncate">
                                    {sidebar.brandName}
                                </span>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-3 border-b border-[#E8E8E8]">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[#0F6FDE]" />
                                <div>
                                    <h2 className="text-sm font-bold text-[#111827]">Language</h2>
                                    <p className="text-[10px] text-[#8E8E8E]">Select your language</p>
                                </div>
                            </div>
                            <button
                                onClick={closeLangSidebar}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Language List */}
                        <div className="flex-1 overflow-y-auto py-2 px-3">
                            <div className="space-y-0.5">
                                {languages.map((lang) => {
                                    const isActive = currentLocale === lang.code;
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            disabled={isChanging}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                                transition-all duration-200
                                                ${isActive
                                                    ? 'bg-white text-[#0F6FDE] shadow-sm ring-1 ring-[#E8E8E8]'
                                                    : 'text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424]'
                                                }
                                                ${isChanging ? 'opacity-50' : ''}
                                            `}
                                        >
                                            <span className="text-xl flex-shrink-0">{lang.flag}</span>
                                            <span className="truncate">{lang.name}</span>
                                            {isActive && (
                                                <Check className="w-4 h-4 text-[#0F6FDE] flex-shrink-0 ml-auto" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-3 py-2 border-t border-[#E8E8E8]">
                            <p className="text-[10px] text-[#8E8E8E] text-center">
                                Current: {currentLang.flag} {currentLang.name}
                            </p>
                        </div>
                    </aside>
                </Portal>
            )}
        </>
    );
}
