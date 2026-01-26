'use client';

/**
 * Platform App Shell
 * 
 * Layout wrapper for Platform area
 * Structure: Header (Fixed Top) + Sidebar (Fixed Left) + Main (Scrollable Right)
 * 
 */

import { PlatformHeader } from '@/components/PlatformHeader';
import { PlatformSidebar } from '@/components/PlatformSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface PlatformShellProps {
    children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
    return (
        <SidebarProvider>
            <div className="flex flex-col h-[100dvh] bg-[#FAFAFA] overflow-hidden">
                {/* Header - Fixed Top */}
                <div className="flex-shrink-0 z-50">
                    <PlatformHeader />
                </div>

                {/* Sidebar - Fixed Overlay (rendered once, handles all screen sizes) */}
                <PlatformSidebar />

                {/* Main Content - Always full width, sidebar overlays when open */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
