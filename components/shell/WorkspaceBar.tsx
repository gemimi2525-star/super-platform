'use client';

/**
 * Workspace Bar Component (Top Menu Bar)
 * 
 * macOS-style top menu bar for APICOREDATA platform
 * HIG-FEEL SPEC v2 STRICT compliant
 * 
 * Structure:
 * LEFT: Brand Logo + Core Hub + Text Menus (File, Edit, View, Go, Window, Help)
 * RIGHT: Search + Language + User Avatar
 * 
 * SPEC COMPLIANCE:
 * - Height: 32px EXACT
 * - Background: rgba(0,0,0,0.18)
 * - Backdrop: blur(22px) saturate(1.2)
 * - Border: 1px solid rgba(255,255,255,0.06)
 * - Font: System stack, 13px/20px, weight 500
 * - Hover intent: 80ms delay for menu switching when open
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchPanel } from '@/components/SearchPanel';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLocale } from '@/lib/i18n';
import { Search, Globe, User, LogOut, Settings, Info } from 'lucide-react';

interface WorkspaceBarProps {
    onOpenCoreMenu?: () => void;
    onOpenAppLibrary?: () => void;
}

// Menu items configuration
const MENU_ITEMS = [
    { id: 'file', label: 'File', items: ['New Window', 'Open...', 'Close Window'] },
    { id: 'edit', label: 'Edit', items: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste'] },
    { id: 'view', label: 'View', items: ['Enter Full Screen', 'Show Sidebar', 'Zoom In', 'Zoom Out'] },
    { id: 'go', label: 'Go', items: ['Back', 'Forward', 'Home', 'Dashboard'] },
    { id: 'window', label: 'Window', items: ['Minimize', 'Zoom', 'Tile Window'] },
    { id: 'help', label: 'Help', items: ['Search', 'Documentation', 'Report Issue'] },
];

// Core Menu items (Apple menu equivalent)
const CORE_MENU_ITEMS = [
    { id: 'about', label: 'About APICOREDATA', action: 'about' },
    { id: 'divider1', divider: true },
    { id: 'settings', label: 'System Settings...', action: 'settings' },
    { id: 'divider2', divider: true },
    { id: 'logout', label: 'Log Out...', action: 'logout' },
];

// User menu items (Avatar dropdown)
const USER_MENU_ITEMS = [
    { id: 'profile', label: 'Profile', icon: User, action: 'profile' },
    { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
    { id: 'divider1', divider: true },
    { id: 'logout', label: 'Log Out', icon: LogOut, action: 'logout' },
];

// SPEC: Timing constants
const HOVER_ENTER_DELAY = 80;  // ms
const MENU_OPEN_DURATION = 140;  // ms
const MENU_CLOSE_DURATION = 110;  // ms

export function WorkspaceBar({ onOpenCoreMenu, onOpenAppLibrary }: WorkspaceBarProps) {
    const router = useRouter();
    const locale = useLocale();
    const { toggleSearchPanel, isSearchOpen } = useSidebar();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ESC key closes dropdown
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activeMenu) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeMenu]);

    // Focus first item when dropdown opens
    useEffect(() => {
        if (activeMenu) {
            const dropdown = dropdownRefs.current.get(activeMenu);
            if (dropdown) {
                const firstButton = dropdown.querySelector('button');
                if (firstButton) {
                    firstButton.focus();
                }
            }
        }
    }, [activeMenu]);

    // Cleanup hover timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    const handleMenuClick = (menuId: string) => {
        // Clear any pending hover timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setActiveMenu(activeMenu === menuId ? null : menuId);
    };

    // SPEC 2.4: Hover intent - switch menus after 80ms when one is already open
    const handleMenuHover = (menuId: string) => {
        if (activeMenu && activeMenu !== menuId) {
            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            // Set new timeout for hover intent
            hoverTimeoutRef.current = setTimeout(() => {
                setActiveMenu(menuId);
                hoverTimeoutRef.current = null;
            }, HOVER_ENTER_DELAY);
        }
    };

    const handleMenuLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleCoreMenuAction = useCallback((action: string) => {
        setActiveMenu(null);
        switch (action) {
            case 'settings':
                router.push(`/${locale}/platform/settings/appearance`);
                break;
            case 'logout':
                router.push(`/${locale}/auth/logout`);
                break;
            case 'about':
                // Could open a modal
                break;
        }
    }, [router, locale]);

    const handleUserMenuAction = useCallback((action: string) => {
        setActiveMenu(null);
        switch (action) {
            case 'settings':
                router.push(`/${locale}/platform/settings/appearance`);
                break;
            case 'logout':
                router.push(`/${locale}/auth/logout`);
                break;
            case 'profile':
                router.push(`/${locale}/platform/settings`);
                break;
        }
    }, [router, locale]);

    return (
        <>
            {/* SPEC 1.1: Bar Container - 32px height, rgba(0,0,0,0.18), blur(22px) saturate(1.2) */}
            <header
                style={{
                    fontFamily: 'var(--shell-font)',
                    backgroundColor: 'var(--menubar-bg)',
                    backdropFilter: 'blur(22px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: 'var(--menubar-text)',
                    paddingTop: 'env(safe-area-inset-top)',
                }}
                className="fixed top-0 left-0 right-0 z-50 min-h-[var(--menubar-h)] antialiased"
            >
                {/* SPEC 1.2: Inner Row Layout - 12px padding, proper gaps */}
                <div
                    ref={menuRef}
                    role="menubar"
                    className="flex items-center justify-between"
                    style={{
                        height: 'var(--menubar-h)',
                        padding: '0 var(--menubar-px)'
                    }}
                >
                    {/* LEFT: Brand Logo + Core Hub + Text Menus */}
                    <div className="flex items-center" style={{ gap: 'var(--menubar-gap-left)' }}>
                        {/* SPEC 1.4: Brand Logo - 14px icon, 28px target */}
                        <div className="relative">
                            <button
                                onClick={() => handleMenuClick('core')}
                                onMouseEnter={() => handleMenuHover('core')}
                                onMouseLeave={handleMenuLeave}
                                role="menuitem"
                                aria-haspopup="true"
                                aria-expanded={activeMenu === 'core'}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    backgroundColor: activeMenu === 'core' ? 'var(--menubar-active)' : 'transparent',
                                    borderRadius: '6px',
                                    transition: 'background-color 150ms ease-out',
                                }}
                                className="flex items-center justify-center hover:bg-[rgba(255,255,255,0.10)]"
                                title="Core Menu"
                            >
                                <BrandLogo
                                    size="sm"
                                    location="header"
                                    className="w-3.5 h-3.5"
                                />
                            </button>

                            {/* Core Menu Dropdown - SPEC 2.1-2.3 */}
                            {activeMenu === 'core' && (
                                <div
                                    ref={(el) => { if (el) dropdownRefs.current.set('core', el); }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: 'var(--dropdown-offset)',
                                        minWidth: '220px',
                                        backgroundColor: 'var(--dropdown-bg)',
                                        backdropFilter: 'blur(26px) saturate(1.2)',
                                        WebkitBackdropFilter: 'blur(26px) saturate(1.2)',
                                        borderRadius: 'var(--dropdown-radius)',
                                        border: '1px solid var(--dropdown-border)',
                                        boxShadow: 'var(--dropdown-shadow)',
                                        padding: 'var(--dropdown-p)',
                                        animation: `fadeIn ${MENU_OPEN_DURATION}ms ease-out`,
                                    }}
                                    role="menu"
                                >
                                    {CORE_MENU_ITEMS.map((item) => (
                                        item.divider ? (
                                            <div
                                                key={item.id}
                                                style={{
                                                    height: '1px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.10)',
                                                    margin: '6px 0',
                                                }}
                                            />
                                        ) : (
                                            <button
                                                key={item.id}
                                                onClick={() => handleCoreMenuAction(item.action!)}
                                                role="menuitem"
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0 var(--dropdown-row-px)',
                                                    height: 'var(--dropdown-row-h)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: '13px',
                                                    lineHeight: '20px',
                                                    fontWeight: 500,
                                                    color: 'var(--menubar-text)',
                                                    borderRadius: '6px',
                                                    transition: 'background-color 80ms ease-out',
                                                }}
                                                className="hover:bg-[var(--dropdown-row-hover)] active:bg-[rgba(255,255,255,0.14)]"
                                            >
                                                {item.label}
                                            </button>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SPEC 1.3: Core Hub Button - opens App Library */}
                        <button
                            onClick={() => {
                                onOpenAppLibrary?.();
                                setActiveMenu(null);
                            }}
                            role="menuitem"
                            style={{
                                padding: '4px 8px',
                                height: '24px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                lineHeight: '20px',
                                fontWeight: 600,
                                letterSpacing: 0,
                                color: 'var(--menubar-text)',
                                transition: 'all 150ms ease-out',
                            }}
                            className="hover:bg-[var(--menubar-hover)] active:bg-[var(--menubar-active)] hover:text-white"
                        >
                            Core Hub
                        </button>

                        {/* SPEC 1.3: Text Menus with 16px gap */}
                        <div className="flex items-center" style={{ gap: 'var(--menubar-gap-menu)' }}>
                            {MENU_ITEMS.map((menu) => (
                                <div key={menu.id} className="relative">
                                    <button
                                        onClick={() => handleMenuClick(menu.id)}
                                        onMouseEnter={() => handleMenuHover(menu.id)}
                                        onMouseLeave={handleMenuLeave}
                                        role="menuitem"
                                        aria-haspopup="true"
                                        aria-expanded={activeMenu === menu.id}
                                        style={{
                                            padding: '4px 8px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            lineHeight: '20px',
                                            fontWeight: 500,
                                            letterSpacing: 0,
                                            color: activeMenu === menu.id ? 'rgba(255, 255, 255, 1)' : 'var(--menubar-text-dim)',
                                            backgroundColor: activeMenu === menu.id ? 'var(--menubar-active)' : 'transparent',
                                            transition: 'all 150ms ease-out',
                                        }}
                                        className="hover:bg-[var(--menubar-hover)] hover:text-white"
                                    >
                                        {menu.label}
                                    </button>

                                    {/* SPEC 2: Dropdown */}
                                    {activeMenu === menu.id && (
                                        <div
                                            ref={(el) => { if (el) dropdownRefs.current.set(menu.id, el); }}
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                marginTop: 'var(--dropdown-offset)',
                                                minWidth: '220px',
                                                backgroundColor: 'var(--dropdown-bg)',
                                                backdropFilter: 'blur(26px) saturate(1.2)',
                                                WebkitBackdropFilter: 'blur(26px) saturate(1.2)',
                                                borderRadius: 'var(--dropdown-radius)',
                                                border: '1px solid var(--dropdown-border)',
                                                boxShadow: 'var(--dropdown-shadow)',
                                                padding: 'var(--dropdown-p)',
                                                animation: `fadeIn ${MENU_OPEN_DURATION}ms ease-out`,
                                            }}
                                            role="menu"
                                        >
                                            {menu.items.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveMenu(null)}
                                                    role="menuitem"
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '0 var(--dropdown-row-px)',
                                                        height: 'var(--dropdown-row-h)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontSize: '13px',
                                                        lineHeight: '20px',
                                                        fontWeight: 500,
                                                        color: 'var(--menubar-text)',
                                                        borderRadius: '6px',
                                                        transition: 'background-color 80ms ease-out',
                                                    }}
                                                    className="hover:bg-[var(--dropdown-row-hover)] active:bg-[rgba(255,255,255,0.14)]"
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Status Icons - SPEC 1.5 with gap */}
                    <div className="flex items-center" style={{ gap: 'var(--menubar-gap-right)' }}>
                        {/* Search - 14px icon, 28px target */}
                        <button
                            onClick={toggleSearchPanel}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                backgroundColor: isSearchOpen ? 'var(--menubar-active)' : 'transparent',
                                color: isSearchOpen ? 'rgba(255, 255, 255, 1)' : 'var(--menubar-text-dim)',
                                transition: 'all 150ms ease-out',
                            }}
                            className="flex items-center justify-center hover:bg-[var(--menubar-hover)] hover:text-white"
                            title="Search"
                        >
                            <Search style={{ width: '14px', height: '14px' }} />
                        </button>

                        {/* Language - 11px text, 28px target */}
                        <button
                            style={{
                                padding: '4px 8px',
                                height: '28px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                lineHeight: '14px',
                                fontWeight: 500,
                                color: 'var(--menubar-text-dim)',
                                transition: 'all 150ms ease-out',
                            }}
                            className="flex items-center gap-1 hover:bg-[var(--menubar-hover)] hover:text-white"
                            title="Language"
                        >
                            <Globe style={{ width: '14px', height: '14px' }} />
                            <span>EN</span>
                        </button>

                        {/* User Avatar - 18px circle with dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => handleMenuClick('user')}
                                onMouseEnter={() => handleMenuHover('user')}
                                onMouseLeave={handleMenuLeave}
                                aria-haspopup="true"
                                aria-expanded={activeMenu === 'user'}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    backgroundColor: activeMenu === 'user' ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.10)',
                                    color: activeMenu === 'user' ? 'rgba(255, 255, 255, 1)' : 'var(--menubar-text-dim)',
                                    transition: 'all 150ms ease-out',
                                }}
                                className="flex items-center justify-center hover:bg-[rgba(255,255,255,0.30)] hover:text-white"
                                title="User"
                            >
                                <User style={{ width: '12px', height: '12px' }} />
                            </button>

                            {/* User Menu Dropdown */}
                            {activeMenu === 'user' && (
                                <div
                                    ref={(el) => { if (el) dropdownRefs.current.set('user', el); }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: 'var(--dropdown-offset)',
                                        minWidth: '220px',
                                        backgroundColor: 'var(--dropdown-bg)',
                                        backdropFilter: 'blur(26px) saturate(1.2)',
                                        WebkitBackdropFilter: 'blur(26px) saturate(1.2)',
                                        borderRadius: 'var(--dropdown-radius)',
                                        border: '1px solid var(--dropdown-border)',
                                        boxShadow: 'var(--dropdown-shadow)',
                                        padding: 'var(--dropdown-p)',
                                        animation: `fadeIn ${MENU_OPEN_DURATION}ms ease-out`,
                                    }}
                                    role="menu"
                                >
                                    {USER_MENU_ITEMS.map((item) => (
                                        item.divider ? (
                                            <div
                                                key={item.id}
                                                style={{
                                                    height: '1px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.10)',
                                                    margin: '6px 0',
                                                }}
                                            />
                                        ) : (
                                            <button
                                                key={item.id}
                                                onClick={() => handleUserMenuAction(item.action!)}
                                                role="menuitem"
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0 var(--dropdown-row-px)',
                                                    height: 'var(--dropdown-row-h)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '13px',
                                                    lineHeight: '20px',
                                                    fontWeight: 500,
                                                    color: 'var(--menubar-text)',
                                                    borderRadius: '6px',
                                                    transition: 'background-color 80ms ease-out',
                                                }}
                                                className="hover:bg-[var(--dropdown-row-hover)] active:bg-[rgba(255,255,255,0.14)]"
                                            >
                                                {item.icon && <item.icon style={{ width: '14px', height: '14px' }} />}
                                                {item.label}
                                            </button>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Panel */}
            <SearchPanel />

            {/* CSS Animation for dropdown */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
