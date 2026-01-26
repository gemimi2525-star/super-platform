'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
    // Desktop: Hide/Show Sidebar completely
    isDesktopHidden: boolean;
    toggleDesktopSidebar: () => void;
    hideDesktopSidebar: () => void;

    // Legacy collapse (for rail mode if needed later)
    isCollapsed: boolean;
    toggleCollapse: () => void;

    // Mobile: Overlay drawer
    isMobileOpen: boolean;
    toggleMobile: () => void;
    closeMobile: () => void;

    // UT (Program) Sidebar - LEFT
    isUTSidebarOpen: boolean;
    toggleUTSidebar: () => void;
    closeUTSidebar: () => void;

    // OR (Organization) Sidebar - LEFT
    isORSidebarOpen: boolean;
    toggleORSidebar: () => void;
    closeORSidebar: () => void;

    // Language Sidebar - RIGHT
    isLangSidebarOpen: boolean;
    toggleLangSidebar: () => void;
    closeLangSidebar: () => void;

    // User Sidebar - RIGHT
    isUserSidebarOpen: boolean;
    toggleUserSidebar: () => void;
    closeUserSidebar: () => void;

    // Search Panel - FROM TOP (below header)
    isSearchOpen: boolean;
    toggleSearchPanel: () => void;
    closeSearchPanel: () => void;

    // Popovers (legacy)
    isProgramMenuOpen: boolean;
    setProgramMenuOpen: (open: boolean) => void;
    activePopover: string | null;
    setActivePopover: (id: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isDesktopHidden, setIsDesktopHidden] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isProgramMenuOpen, setProgramMenuOpen] = useState(false);
    const [activePopover, setActivePopover] = useState<string | null>(null);

    // UT and OR Sidebar states (LEFT)
    const [isUTSidebarOpen, setIsUTSidebarOpen] = useState(false);
    const [isORSidebarOpen, setIsORSidebarOpen] = useState(false);

    // Language and User Sidebar states (RIGHT)
    const [isLangSidebarOpen, setIsLangSidebarOpen] = useState(false);
    const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);

    // Search Panel state (FROM TOP)
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const pathname = usePathname();

    // Helper to close all sidebars including search
    const closeAllSidebars = () => {
        setIsUTSidebarOpen(false);
        setIsORSidebarOpen(false);
        setIsLangSidebarOpen(false);
        setIsUserSidebarOpen(false);
        setIsSearchOpen(false);
        setIsMobileOpen(false);
    };

    // Reset all on route change
    useEffect(() => {
        setActivePopover(null);
        closeAllSidebars();
    }, [pathname]);

    // Initial load from localStorage
    useEffect(() => {
        const savedHidden = localStorage.getItem('sidebar_desktop_hidden');
        if (savedHidden !== null) {
            setIsDesktopHidden(JSON.parse(savedHidden));
        }
        const savedCollapsed = localStorage.getItem('sidebar_collapsed_state');
        if (savedCollapsed !== null) {
            setIsCollapsed(JSON.parse(savedCollapsed));
        }
    }, []);

    // Toggle Desktop Sidebar
    const toggleDesktopSidebar = () => {
        setIsDesktopHidden(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_desktop_hidden', JSON.stringify(next));
            return next;
        });
        // Close other sidebars when main sidebar toggles
        closeAllSidebars();
    };

    const hideDesktopSidebar = () => {
        setIsDesktopHidden(true);
        localStorage.setItem('sidebar_desktop_hidden', JSON.stringify(true));
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed_state', JSON.stringify(next));
            return next;
        });
    };

    const toggleMobile = () => setIsMobileOpen(prev => !prev);
    const closeMobile = () => setIsMobileOpen(false);

    // UT Sidebar - close others when opening
    const toggleUTSidebar = () => {
        setIsUTSidebarOpen(prev => {
            if (!prev) {
                // Close OTHER sidebars (not self)
                setIsORSidebarOpen(false);
                setIsLangSidebarOpen(false);
                setIsUserSidebarOpen(false);
                setIsMobileOpen(false);
                setIsDesktopHidden(true);
            }
            return !prev;
        });
    };
    const closeUTSidebar = () => setIsUTSidebarOpen(false);

    // OR Sidebar - close others when opening
    const toggleORSidebar = () => {
        setIsORSidebarOpen(prev => {
            if (!prev) {
                // Close OTHER sidebars (not self)
                setIsUTSidebarOpen(false);
                setIsLangSidebarOpen(false);
                setIsUserSidebarOpen(false);
                setIsMobileOpen(false);
                setIsDesktopHidden(true);
            }
            return !prev;
        });
    };
    const closeORSidebar = () => setIsORSidebarOpen(false);

    // Language Sidebar - close others when opening (RIGHT)
    const toggleLangSidebar = () => {
        setIsLangSidebarOpen(prev => {
            if (!prev) {
                // Close OTHER sidebars (not self)
                setIsUTSidebarOpen(false);
                setIsORSidebarOpen(false);
                setIsUserSidebarOpen(false);
                setIsMobileOpen(false);
                setIsDesktopHidden(true);
            }
            return !prev;
        });
    };
    const closeLangSidebar = () => setIsLangSidebarOpen(false);

    // User Sidebar - close others when opening (RIGHT)
    const toggleUserSidebar = () => {
        setIsUserSidebarOpen(prev => {
            if (!prev) {
                // Close OTHER sidebars (not self)
                setIsUTSidebarOpen(false);
                setIsORSidebarOpen(false);
                setIsLangSidebarOpen(false);
                setIsMobileOpen(false);
                setIsDesktopHidden(true);
            }
            return !prev;
        });
    };
    const closeUserSidebar = () => setIsUserSidebarOpen(false);

    // Search Panel - close others when opening (FROM TOP)
    const toggleSearchPanel = () => {
        setIsSearchOpen(prev => {
            if (!prev) {
                // Close OTHER sidebars (not self)
                setIsUTSidebarOpen(false);
                setIsORSidebarOpen(false);
                setIsLangSidebarOpen(false);
                setIsUserSidebarOpen(false);
                setIsMobileOpen(false);
                setIsDesktopHidden(true);
            }
            return !prev;
        });
    };
    const closeSearchPanel = () => setIsSearchOpen(false);
    return (
        <SidebarContext.Provider value={{
            isDesktopHidden,
            toggleDesktopSidebar,
            hideDesktopSidebar,
            isCollapsed,
            toggleCollapse,
            isMobileOpen,
            toggleMobile,
            closeMobile,
            isUTSidebarOpen,
            toggleUTSidebar,
            closeUTSidebar,
            isORSidebarOpen,
            toggleORSidebar,
            closeORSidebar,
            isLangSidebarOpen,
            toggleLangSidebar,
            closeLangSidebar,
            isUserSidebarOpen,
            toggleUserSidebar,
            closeUserSidebar,
            isSearchOpen,
            toggleSearchPanel,
            closeSearchPanel,
            isProgramMenuOpen,
            setProgramMenuOpen,
            activePopover,
            setActivePopover
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
