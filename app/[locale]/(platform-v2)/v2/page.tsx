/**
 * APICOREDATA OS Home Page (Desktop)
 * 
 * This is the main entry point of APICOREDATA OS.
 * Renders the OS Desktop experience (not a traditional dashboard).
 * 
 * ARCHITECTURE:
 * - Server Component: Auth, Entitlements, Registry Resolution
 * - Client Component (OSHomeDesktop): i18n, Rendering
 * 
 * DATA FLOW:
 * 1. Auth & Access Check → requirePlatformAccess()
 * 2. Org Context Resolution → Firestore lookup
 * 3. Entitlements Resolution → getOrgEntitlements()
 * 4. App Resolution → resolveNavigation() (from App Registry)
 * 5. Widget Resolution → resolveWidgets() (from Widget Registry)
 * 6. Serialize & Pass → OSHomeDesktop (client)
 * 
 * PRINCIPLES:
 * - Apps from Registry only (no hardcoding)
 * - Serializable data only (no functions passed to client)
 * - Entitlement-aware (filtered by user policies)
 */

import React from 'react';
import { getAuthContext, requirePlatformAccess } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { getOrgEntitlements } from '@super-platform/core/src/os/entitlements/get-org-entitlements';
import { resolveNavigation } from '@super-platform/core/src/os/navigation/resolve-navigation';
import { resolveWidgets } from '@super-platform/core/src/os/widgets/resolve-widgets';
import { OSShellRenderer } from './_components/OSShellRenderer';

interface PageProps {
    params: Promise<{ locale: string }>;
}

// Serializable app data to pass to client
interface SerializableApp {
    appId: string;
    i18nKey: string;
    iconKey: string;
    basePath: string;
    status: string;
    availability: string;
}

export default async function OSHomePage({ params }: PageProps) {
    const { locale } = await params;

    // ═══════════════════════════════════════════════════════════════════════
    // 1. AUTH & ACCESS CHECK
    // ═══════════════════════════════════════════════════════════════════════
    await requirePlatformAccess();
    const auth = await getAuthContext();

    // ═══════════════════════════════════════════════════════════════════════
    // 2. RESOLVE ORG CONTEXT
    // ═══════════════════════════════════════════════════════════════════════
    let currentOrgId = '';
    let role = 'user';

    if (auth?.uid) {
        try {
            const db = getAdminFirestore();
            const userDoc = await db.collection('platform_users').doc(auth.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                currentOrgId = userData?.defaultOrgId || '';
                role = userData?.role || 'user';
            }
        } catch (e) {
            // Ignore context errors - fallback to defaults
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. RESOLVE ENTITLEMENTS (Source of Truth)
    // ═══════════════════════════════════════════════════════════════════════
    const entitlements = await getOrgEntitlements(currentOrgId);

    // Map role to policies
    const userPolicies: string[] = [];
    if (role === 'owner') {
        userPolicies.push('users.read', 'orgs.read', 'audit.view', 'settings.read');
    } else if (role === 'admin') {
        userPolicies.push('users.read', 'orgs.read');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. RESOLVE APPS (from App Registry)
    // ═══════════════════════════════════════════════════════════════════════
    const { apps } = resolveNavigation({
        enabledFlags: entitlements.flags,
        userPolicies,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 5. RESOLVE WIDGETS (from Widget Registry)
    // ═══════════════════════════════════════════════════════════════════════
    const widgets = resolveWidgets({
        enabledFlags: entitlements.flags,
        userPolicies,
    });
    const widgetIds = widgets.map(w => w.widgetId);

    // ═══════════════════════════════════════════════════════════════════════
    // 6. SERIALIZE APP DATA (no functions)
    // ═══════════════════════════════════════════════════════════════════════
    const serializableApps: SerializableApp[] = apps.map(app => ({
        appId: app.appId,
        i18nKey: app.i18nKey,
        iconKey: app.iconKey,
        basePath: app.mount?.basePath || '',
        status: app.lifecycle?.status || 'active',
        availability: app.entitlement?.availability || 'ga',
    }));

    // ═══════════════════════════════════════════════════════════════════════
    // 7. RENDER OS SHELL (Single Surface)
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <OSShellRenderer
            apps={serializableApps}
            widgetIds={widgetIds}
            widgetCount={widgets.length}
            appCount={apps.length}
            userName={auth?.email || 'User'}
            locale={locale}
        />
    );
}


