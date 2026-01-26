'use client';

/**
 * Desktop Canvas Component
 * 
 * Main content area for APICOREDATA platform
 * - Shows App content when app is open
 * - Shows empty state when no app (after login)
 * - Supports Wallpaper switching (via Settings)
 * 
 * Naming Convention (STEP 1 Locked):
 * - Desktop Canvas = พื้นที่กลางจอ
 */

import React from 'react';
import { useAppearance } from '@/contexts/AppearanceContext';

interface DesktopCanvasProps {
    children: React.ReactNode;
    isEmpty?: boolean;
}

export function DesktopCanvas({ children, isEmpty = false }: DesktopCanvasProps) {
    const { currentWallpaperClass } = useAppearance();

    if (isEmpty) {
        return (
            <div className={`
                flex-1 
                flex items-center justify-center
                relative
                transition-all duration-500 ease-in-out
                ${currentWallpaperClass}
            `}>
                {/* Empty State - Clean wallpaper only */}
                {/* Wallpaper controls moved to Settings > Appearance */}
            </div>
        );
    }

    // When app is active (not empty), we typically show a simpler background or the app's own background.
    // However, for OS-like feel, some apps might be transparent. 
    // For now, let's keep the content background clean (white/gray) BUT if we want OS-feel, 
    // maybe we allow transparency? 
    // Blueprint says "Desktop Canvas" is the container. 
    // Most standard apps need a solid background for readability.

    return (
        <main className={`
            flex-1 
            overflow-y-auto overflow-x-hidden
            relative
            transition-all duration-500
            ${currentWallpaperClass}
        `}>
            {/* Overlay for readability when app is open */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm -z-10" />

            <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 min-h-full pb-24 relative z-0">
                {children}
            </div>
        </main>
    );
}
