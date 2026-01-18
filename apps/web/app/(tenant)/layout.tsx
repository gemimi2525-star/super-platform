/**
 * Tenant Portal Layout
 * Wrapper for /app/* routes
 * 
 * SERVER-SIDE AUTH ENFORCEMENT:
 * Requires org membership (org_admin, org_member, or platform_owner)
 */

import { requireTenantMember } from '@/lib/auth/server';

export default async function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Enforce tenant membership (throws/redirects if not authorized)
    const auth = await requireTenantMember();

    return (
        <div className="tenant-layout min-h-screen bg-gray-50">
            <header className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Tenant Portal</h2>
                    <span className="text-sm text-gray-500">
                        {auth.role === 'platform_owner' ? 'Platform Owner (Global Access)' : `Org: ${auth.orgId}`}
                    </span>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
