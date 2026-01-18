/**
 * Platform Console Layout
 * Wrapper for /platform/* routes
 * 
 * SERVER-SIDE AUTH ENFORCEMENT:
 * Requires platform_owner role via Firebase Admin token verification
 */

import { requirePlatformOwner } from '@/lib/auth/server';

export default async function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Enforce platform_owner role (throws/redirects if not authorized)
    await requirePlatformOwner();

    return (
        <div className="platform-layout min-h-screen bg-gray-50">
            <header className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Platform Console</h2>
                    <span className="text-sm text-gray-500">Authenticated as Platform Owner</span>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
