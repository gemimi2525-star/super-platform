import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
// import { AppShell } from '@/modules/design-system/src/patterns/AppShell'; // Direct import fails (no 'use client')
import { V2AppShell } from './_components/V2AppShell'; // Use wrapper
import { Divider } from '@/modules/design-system/src/components/Divider';

// Helper to check permissions
function canViewOrgs(role?: string) {
    return role === 'owner' || role === 'admin';
}

function canViewUsers(role?: string) {
    return role === 'owner' || role === 'admin';
}

function canViewAuditLogs(role?: string) {
    return role === 'owner';
}

interface PlatformV2LayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function PlatformV2Layout({ children, params }: PlatformV2LayoutProps) {
    const { locale } = await params;
    const auth = await getAuthContext();
    let role = 'user';

    // Fetch Role from Firestore
    if (auth) {
        try {
            const db = getAdminFirestore();
            const userDoc = await db.collection('platform_users').doc(auth.uid).get();
            if (userDoc.exists) {
                role = userDoc.data()?.role || 'user';
            }
        } catch (error) {
            console.error('Failed to fetch user role:', error);
            // Fallback to 'user' role on error
        }
    }
    // Simple sidebar for v2
    const sidebar = (
        <div className="p-6">
            <div className="text-lg font-bold text-neutral-900 mb-8">
                Platform V2
            </div>
            <nav className="flex flex-col gap-2">
                <a
                    href={`/${locale}/v2`}
                    className="px-4 py-3 text-neutral-700 no-underline rounded-md hover:bg-neutral-100 transition-colors"
                >
                    Dashboard
                </a>

                {/* Organizations - Admin/Owner Only */}
                {canViewOrgs(role) && (
                    <a
                        href={`/${locale}/v2/orgs`}
                        className="px-4 py-3 text-neutral-700 no-underline rounded-md hover:bg-neutral-100 transition-colors"
                    >
                        Organizations
                    </a>
                )}

                {/* Users - Admin/Owner Only */}
                {canViewUsers(role) && (
                    <a
                        href={`/${locale}/v2/users`}
                        className="px-4 py-3 text-neutral-700 no-underline rounded-md hover:bg-neutral-100 transition-colors"
                    >
                        Users
                    </a>
                )}

                {/* Audit Logs - Owner Only */}
                {canViewAuditLogs(role) && (
                    <a
                        href={`/${locale}/v2/audit-logs`}
                        className="px-4 py-3 text-neutral-700 no-underline rounded-md hover:bg-neutral-100 transition-colors"
                    >
                        Audit Logs
                    </a>
                )}


                {/* Test Login Link (DEV only) */}
                {process.env.ENABLE_TEST_LOGIN === 'true' && process.env.NODE_ENV !== 'production' && (
                    <>
                        <Divider spacing="md" />
                        <a
                            href={`/${locale}/v2/test-login`}
                            className="px-4 py-3 text-primary-600 no-underline rounded-md hover:bg-primary-50 transition-colors text-sm font-medium"
                        >
                            🧪 Test Login
                        </a>
                    </>
                )}
            </nav>
        </div>
    );

    // Simple topbar
    const topbar = (
        <div className="flex justify-between items-center w-full">
            <div className="text-base font-medium text-neutral-700">
                APICOREDATA Platform V2
            </div>
            <div className="flex gap-4 items-center">
                <span className="text-sm text-neutral-600">English</span>
                <button className="px-4 py-1 bg-white border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors">
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <V2AppShell
            sidebar={sidebar}
            topbar={topbar}
        >
            {children}
        </V2AppShell>
    );
}
