'use client';

/**
 * OS Shell Component (Main Wrapper)
 * 
 * APICOREDATA Desktop OS-like Shell
 * 
 * Structure (STEP 1 Blueprint - LOCKED):
 * TOP: Workspace Bar (fixed)
 * CENTER: Desktop Canvas (scrollable)
 * BOTTOM: App Strip (fixed)
 * 
 * This replaces PlatformShell when OS-like mode is enabled
 */

import React, { useState } from 'react';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WorkspaceBar } from './WorkspaceBar';
import { DesktopCanvas } from './DesktopCanvas';
import { AppStrip } from './AppStrip';
import { AppLibrary } from './AppLibrary';
import { CoreMenu } from './CoreMenu';

import { useAppearance } from '@/contexts/AppearanceContext';

interface OSShellProps {
    children: React.ReactNode;
}

export function OSShell({ children }: OSShellProps) {
    const [isAppLibraryOpen, setIsAppLibraryOpen] = useState(false);
    const [isCoreMenuOpen, setIsCoreMenuOpen] = useState(false);
    const { themeMode } = useAppearance();

    // Dynamic styles for Light vs Dark theme
    const themeStyles = themeMode === 'light' ? {
        '--menubar-bg': 'rgba(255, 255, 255, 0.35)',
        '--menubar-text': 'rgba(0, 0, 0, 0.85)',
        '--menubar-text-dim': 'rgba(0, 0, 0, 0.60)',
        '--menubar-hover': 'rgba(0, 0, 0, 0.10)',
        '--menubar-active': 'rgba(0, 0, 0, 0.15)',
        '--dock-bg': 'rgba(255, 255, 255, 0.35)',
        '--dock-border': 'rgba(0, 0, 0, 0.05)',
        '--dock-shadow': '0 10px 30px rgba(0, 0, 0, 0.15)',
        '--dock-dot': 'rgba(0, 0, 0, 0.70)',
    } as React.CSSProperties : {};

    return (
        <SidebarProvider>
            <div className="flex flex-col h-[100dvh] overflow-hidden" style={themeStyles}>
                {/* TOP: Workspace Bar (macOS Menu Bar) */}
                <WorkspaceBar
                    onOpenCoreMenu={() => setIsCoreMenuOpen(true)}
                    onOpenAppLibrary={() => setIsAppLibraryOpen(true)}
                />

                {/* CENTER: Desktop Canvas */}
                <DesktopCanvas>
                    {children}
                </DesktopCanvas>

                {/* BOTTOM: App Strip (fixed) */}
                <AppStrip onOpenLibrary={() => setIsAppLibraryOpen(true)} />

                {/* Modals */}
                <AppLibrary
                    isOpen={isAppLibraryOpen}
                    onClose={() => setIsAppLibraryOpen(false)}
                />
                <CoreMenu
                    isOpen={isCoreMenuOpen}
                    onClose={() => setIsCoreMenuOpen(false)}
                    onOpenAppLibrary={() => {
                        setIsCoreMenuOpen(false);
                        setIsAppLibraryOpen(true);
                    }}
                />
            </div>
        </SidebarProvider>
    );
}
