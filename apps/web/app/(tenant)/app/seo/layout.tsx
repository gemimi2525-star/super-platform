/**
 * SEO App Layout
 * 
 * SERVER-SIDE ENFORCEMENT:
 * Checks if SEO app is enabled for org before rendering
 */

import { requireTenantMember, checkAppEnabled } from '@/lib/auth/server';
import { Card, Button } from '@platform/ui-kit';
import Link from 'next/link';

async function AppNotEnabled() {
    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">SEO App Not Enabled</h2>
                    <p className="text-gray-600 mb-6">
                        This application has not been enabled for your organization.
                        Please contact your administrator or visit the Apps Library.
                    </p>
                    <Link href="/app/apps">
                        <Button>View Apps Library</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default async function SEOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = await requireTenantMember();

    // platform_owner bypasses app enablement check (global access)
    if (auth.role === 'platform_owner') {
        return <>{children}</>;
    }

    // Check if SEO app is enabled for this org
    const isEnabled = await checkAppEnabled(auth.orgId!, 'seo');

    if (!isEnabled) {
        return <AppNotEnabled />;
    }

    return <>{children}</>;
}
