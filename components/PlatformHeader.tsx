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
import { useBrand } from '@/contexts/BrandContext';
import { Menu, Search } from 'lucide-react';

export function PlatformHeader() {
    const { toggleMobile, toggleDesktopSidebar, isDesktopHidden, toggleSearchPanel, isSearchOpen } = useSidebar();
    const { header } = useBrand();

    // Calculate sizes based on per-location settings
    const logoSize = Math.round(36 * (header.logoScale / 100));
    const fontSize = Math.round(16 * (header.brandNameScale / 100));
    const gap = header.gap;

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
                            <a href="/platform" className="flex items-center group">
                                <BrandLogo
                                    size="sm"
                                    location="header"
                                    className="transition-transform group-hover:scale-105"
                                />
                                <span
                                    className="font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors whitespace-nowrap"
                                    style={{ fontSize: `${fontSize}px`, marginLeft: `${gap}px` }}
                                >
                                    {header.brandName}
                                </span>
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
                            <a href="/platform" className="flex items-center group">
                                <BrandLogo
                                    size="sm"
                                    location="header"
                                    className="transition-transform group-hover:scale-105"
                                />
                                <span
                                    className="font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                                    style={{ fontSize: `${Math.max(fontSize * 0.85, 12)}px`, marginLeft: `${gap}px` }}
                                >
                                    {header.brandName}
                                </span>
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

