import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
// import { AppShell } from '@/modules/design-system/src/patterns/AppShell'; // Direct import fails (no 'use client')
import { V2AppShell } from './_components/V2AppShell'; // Use wrapper
import { OSTopBar } from './_components/OSTopBar'; // OS Control Plane component
import { Divider } from '@/modules/design-system/src/components/Divider';
import { resolveNavigation } from '@super-platform/core/src/os/navigation/resolve-navigation';
import { OSSidebar } from '@/modules/design-system/src/patterns/OSSidebar';
import { getOrgEntitlements } from '@super-platform/core/src/os/entitlements/get-org-entitlements';

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
    // --- START OS NAVIGATION ENGINE (Phase A-2 & A-3) ---
    // 1. Resolve Entitlements (Real DB Check)
    // Try to find an orgId context. Ideally this comes from path params or user preference.
    // For Phase A, we'll look at the user's primary org if available, or just mock for now if user doc doesn't have it.
    // NOTE: In Phase A-4, we will have a clearer 'currentOrg' context.

    let currentOrgId = '';
    // Quick attempt to find an orgId from user data (if we fetched it)
    try {
        if (auth?.uid) {
            const db = getAdminFirestore();
            const userDoc = await db.collection('platform_users').doc(auth.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Assuming user might have 'defaultOrgId' or we pick the first one
                currentOrgId = userData?.defaultOrgId || '';
            }
        }
    } catch (e) {
        // Ignore errors in context resolution
    }

    const entitlements = await getOrgEntitlements(currentOrgId);
    const enabledFlags = entitlements.flags;

    if (process.env.NODE_ENV === 'development') {
        console.log(`[OS] Entitlements for org '${currentOrgId}':`, entitlements.flags, `(Source: ${entitlements.source})`);
    }

    // Map role to policies (Backward compatibility logic)
    const userPolicies: string[] = [];
    if (role === 'owner') {
        userPolicies.push('users.read', 'orgs.read', 'audit.view', 'settings.read');
    } else if (role === 'admin') {
        userPolicies.push('users.read', 'orgs.read');
    } else {
        // User has minimal access
        userPolicies.push();
    }

    // 2. Resolve Navigation
    const navigation = resolveNavigation({
        enabledFlags,
        userPolicies,
        locale
    });

    const sidebar = (
        <OSSidebar
            navigation={navigation}
            locale={locale}
        />
    );
    // --- END OS NAVIGATION ENGINE ---

    // OS TopBar with Language Switcher and Logout
    const topbar = <OSTopBar locale={locale} />;

    return (
        <V2AppShell
            sidebar={sidebar}
            topbar={topbar}
        >
            {children}
        </V2AppShell>
    );
}
