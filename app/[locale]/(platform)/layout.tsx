/**
 * Platform Console Layout
 * Wrapper for /platform/* routes
 * 
 * SERVER-SIDE AUTH ENFORCEMENT:
 * Requires platform access via Firebase Admin token verification
 * 
 * OS-LIKE SHELL (STEP 1 Blueprint):
 * - Workspace Bar (Top)
 * - Desktop Canvas (Center)
 * - App Strip (Bottom)
 */

import '@/components/shell/shell-tokens.css';
import { requirePlatformAccess } from '@/lib/auth/server';
import { OSShell } from '@/components/shell/OSShell';
import { AdminProvider } from '@/contexts/AdminContext';
import { AppearanceProvider } from '@/contexts/AppearanceContext';

// import { ProgramProvider } from '@/contexts/ProgramContext';

export default async function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Enforce Platform Owner role
    await requirePlatformAccess();

    return (
        <AdminProvider>
            {/* <ProgramProvider> */}
            <AppearanceProvider>
                <OSShell>
                    {children}
                </OSShell>
            </AppearanceProvider>
            {/* </ProgramProvider> */}
        </AdminProvider>
    );
}

