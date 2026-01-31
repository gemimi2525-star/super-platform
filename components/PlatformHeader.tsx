'use client';

/**
 * Platform Header Component - Desktop Redesign
 * 
 * Desktop Layout (xl+):
 * LEFT: Hamburger (circle - toggle sidebar) | UT (circle) | OR (circle)
 * CENTER: Logo + Brand Name
 * RIGHT: Search (circle) | Lang (circle, 2-letter) | User (circle)
 * 
 * Mobile/Tablet: Uses different layout
 */

import { UserMenu } from '@/components/UserMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AdminOrgSwitcher } from '@/components/platform/AdminOrgSwitcher';
import { ProgramSwitcher } from '@/components/ProgramSwitcher';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchPanel } from '@/components/SearchPanel';
import { useSidebar } from '@/contexts/SidebarContext';
import { useBrandStore } from '@/lib/stores/brandStore';
import { Menu, Search } from 'lucide-react';
import Image from 'next/image';
import { BRAND } from '@/config/brand';

export function PlatformHeader() {
    const { toggleMobile, toggleDesktopSidebar, isDesktopHidden, toggleSearchPanel, isSearchOpen } = useSidebar();

    // Use store directly for reactive updates (bypassing context for direct subscription)
    const headerSettings = useBrandStore((state) => state.settings.header);
    const brandName = BRAND.name;

    // Logo URL: localStorage > default
    const headerLogoUrl = headerSettings.logoDataUrl || BRAND.logo;
    const logoSize = headerSettings.logoSizePx;
    const gap = headerSettings.brandGapPx;
    const showBrandName = headerSettings.showBrandName;

    return (
        <>
            <header className="bg-white flex-shrink-0 z-20 relative pt-[env(safe-area-inset-top)] shadow-sm border-b border-gray-100">
                {/* Main Header Row */}
                <div className="h-[56px] sm:h-[64px] w-full flex items-center px-3 sm:px-4 md:px-6">

                    {/* ========== DESKTOP LAYOUT (xl+) ========== */}
                    <div className="hidden xl:flex items-center w-full">

                        {/* LEFT ZONE: Hamburger + Switchers */}
                        <div className="flex items-center gap-2">
                            {/* Hamburger Menu - ONLY toggles Sidebar Show/Hide */}
                            <button
                                onClick={toggleDesktopSidebar}
                                className="h-[42px] w-[42px] flex items-center justify-center rounded-full border outline-none shadow-sm hover:shadow-md bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all"
                                title={isDesktopHidden ? "Show Sidebar" : "Hide Sidebar"}
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {/* UT - Utility Tools (circle + sidebar) */}
                            <ProgramSwitcher />

                            {/* OR - Organizations (circle + sidebar) */}
                            <AdminOrgSwitcher />
                        </div>

                        {/* CENTER ZONE: Logo + Brand Name */}
                        <div className="flex-1 flex items-center justify-center">
                            <a href="/platform" className="flex items-center group" style={{ gap: `${gap}px` }}>
                                {/* Use logoUrl from context - includes localStorage override */}
                                <div
                                    className="rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105"
                                    style={{ width: logoSize, height: logoSize }}
                                >
                                    <Image
                                        src={headerLogoUrl}
                                        alt={brandName}
                                        width={logoSize}
                                        height={logoSize}
                                        className="object-cover w-full h-full"
                                        priority
                                        unoptimized={headerLogoUrl.startsWith('data:') || headerLogoUrl.startsWith('http')}
                                    />
                                </div>
                                {showBrandName && (
                                    <span
                                        className="font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors whitespace-nowrap text-base"
                                    >
                                        {brandName}
                                    </span>
                                )}
                            </a>
                        </div>

                        {/* RIGHT ZONE: Search + Language + User */}
                        <div className="flex items-center gap-3 mr-2">
                            {/* Search - Circle icon, opens panel from top */}
                            <button
                                onClick={toggleSearchPanel}
                                className={`
                                    flex items-center justify-center h-[42px] w-[42px]
                                    rounded-full transition-all duration-150 border group outline-none
                                    shadow-sm hover:shadow-md focus-visible:ring-2 ring-indigo-500/20
                                    ${isSearchOpen
                                        ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                        : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300'
                                    }
                                `}
                                title="Search (⌘K)"
                            >
                                <Search className={`w-4 h-4 ${isSearchOpen ? 'text-indigo-500' : 'text-gray-400'}`} />
                            </button>

                            {/* Language Switcher - Circle, 2-letter code only */}
                            <LanguageSwitcher />

                            {/* User Menu - AD (rightmost) */}
                            <UserMenu />
                        </div>
                    </div>

                    {/* ========== MOBILE/TABLET LAYOUT (< xl) ========== */}
                    <div className="xl:hidden flex items-center w-full">

                        {/* LEFT: Hamburger + UT + OR */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Hamburger Menu - Toggle Sidebar Show/Hide */}
                            <button
                                onClick={toggleMobile}
                                className="h-[32px] w-[32px] sm:h-[36px] sm:w-[36px] flex items-center justify-center rounded-full border outline-none shadow-sm hover:shadow-md bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all"
                                title="Toggle Sidebar"
                            >
                                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>

                            {/* UT - Utility Tools */}
                            <ProgramSwitcher />

                            {/* OR - Organizations */}
                            <AdminOrgSwitcher />
                        </div>

                        {/* CENTER: Logo + Brand */}
                        <div className="flex-1 flex items-center justify-center">
                            <a href="/platform" className="flex items-center group" style={{ gap: `${gap}px` }}>
                                {/* Use smaller logo for mobile */}
                                <div
                                    className="rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105"
                                    style={{ width: Math.round(logoSize * 0.8), height: Math.round(logoSize * 0.8) }}
                                >
                                    <Image
                                        src={headerLogoUrl}
                                        alt={brandName}
                                        width={Math.round(logoSize * 0.8)}
                                        height={Math.round(logoSize * 0.8)}
                                        className="object-cover w-full h-full"
                                        priority
                                        unoptimized={headerLogoUrl.startsWith('data:') || headerLogoUrl.startsWith('http')}
                                    />
                                </div>
                                {showBrandName && (
                                    <span
                                        className="font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                                    >
                                        {brandName}
                                    </span>
                                )}
                            </a>
                        </div>

                        {/* RIGHT: Search + Language + User */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Search - Compact on mobile */}
                            <button
                                onClick={toggleSearchPanel}
                                className={`
                                    h-[32px] w-[32px] sm:h-[36px] sm:w-[36px] flex items-center justify-center
                                    rounded-full transition-all duration-150 border outline-none
                                    shadow-sm hover:shadow-md
                                    ${isSearchOpen
                                        ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                        : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300'
                                    }
                                `}
                                title="Search"
                            >
                                <Search className={`w-4 h-4 ${isSearchOpen ? 'text-indigo-500' : 'text-gray-400'}`} />
                            </button>

                            {/* Language Switcher */}
                            <LanguageSwitcher />

                            {/* User Menu - AD */}
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Panel - Opens from below header */}
            <SearchPanel />
        </>
    );
}

