/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core System Host
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4: Orchestrates all Core System components:
 * - Core System Menu (in TopBar)
 * - System Settings Panel
 * - About Core OS Panel
 * - Lock Screen Overlay
 * 
 * This is the integration layer between Core System components.
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CoreSystemMenu } from './CoreSystemMenu';
import { SystemSettingsPanel, type SettingsSection } from './SystemSettingsPanel';
import { AboutCoreOSPanel } from './AboutCoreOSPanel';
import { AuthGateOverlayWithStore } from './AuthGateOverlay';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreSystemHostProps {
    locale: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreSystemHost({ locale }: CoreSystemHostProps) {
    const router = useRouter();

    // Panel States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    // ─────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────

    const handleOpenSettings = useCallback((section?: string) => {
        if (section === 'appearance' || section === 'brand' || section === 'session' || section === 'general') {
            setSettingsSection(section);
        } else {
            setSettingsSection('general');
        }
        setIsSettingsOpen(true);
    }, []);

    const handleCloseSettings = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);

    const handleOpenAbout = useCallback(() => {
        setIsAboutOpen(true);
    }, []);

    const handleCloseAbout = useCallback(() => {
        setIsAboutOpen(false);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            // Clear session via API
            await fetch('/api/auth/session', { method: 'DELETE' });
            // Redirect to login
            router.push(`/${locale}/auth/login`);
        } catch (error) {
            console.error('[CoreSystemHost] Logout error:', error);
            // Force redirect on error
            router.push(`/${locale}/auth/login`);
        }
    }, [router, locale]);

    return (
        <>
            {/* AuthGate (Lock + Login unified overlay) */}
            <AuthGateOverlayWithStore />

            {/* Settings Panel */}
            <SystemSettingsPanel
                isOpen={isSettingsOpen}
                onClose={handleCloseSettings}
                initialSection={settingsSection}
                locale={locale}
            />

            {/* About Panel */}
            <AboutCoreOSPanel
                isOpen={isAboutOpen}
                onClose={handleCloseAbout}
                locale={locale}
            />
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU COMPONENT FOR TOPBAR
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreSystemMenuHostProps {
    locale: string;
    onOpenSettings: (section?: string) => void;
    onOpenAbout: () => void;
    onLogout: () => void;
}

export function CoreSystemMenuHost({
    locale,
    onOpenSettings,
    onOpenAbout,
    onLogout,
}: CoreSystemMenuHostProps) {
    return (
        <CoreSystemMenu
            locale={locale}
            onOpenSettings={onOpenSettings}
            onOpenAbout={onOpenAbout}
            onLogout={onLogout}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT FOR DEEP INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

interface CoreSystemContextValue {
    openSettings: (section?: string) => void;
    openAbout: () => void;
    logout: () => void;
}

const CoreSystemContext = React.createContext<CoreSystemContextValue | null>(null);

export function useCoreSystem() {
    const context = React.useContext(CoreSystemContext);
    if (!context) {
        throw new Error('useCoreSystem must be used within CoreSystemProvider');
    }
    return context;
}

export interface CoreSystemProviderProps {
    locale: string;
    children: React.ReactNode;
}

export function CoreSystemProvider({ locale, children }: CoreSystemProviderProps) {
    const router = useRouter();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    const openSettings = useCallback((section?: string) => {
        if (section === 'appearance' || section === 'brand' || section === 'session' || section === 'general') {
            setSettingsSection(section);
        }
        setIsSettingsOpen(true);
    }, []);

    const openAbout = useCallback(() => {
        setIsAboutOpen(true);
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/session', { method: 'DELETE' });
            router.push(`/${locale}/auth/login`);
        } catch {
            router.push(`/${locale}/auth/login`);
        }
    }, [router, locale]);

    const value = React.useMemo(() => ({
        openSettings,
        openAbout,
        logout,
    }), [openSettings, openAbout, logout]);

    return (
        <CoreSystemContext.Provider value={value}>
            {children}

            {/* AuthGate (Lock + Login unified overlay) */}
            <AuthGateOverlayWithStore />

            {/* Settings Panel */}
            <SystemSettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                initialSection={settingsSection}
                locale={locale}
            />

            {/* About Panel */}
            <AboutCoreOSPanel
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
                locale={locale}
            />
        </CoreSystemContext.Provider>
    );
}

export default CoreSystemHost;
