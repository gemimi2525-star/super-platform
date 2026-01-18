'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card } from '@platform/ui-kit';
import { useRouter } from 'next/navigation';

/**
 * Tenant Portal Dashboard
 * Main landing page for /app
 */
export default function TenantDashboardPage() {
    const t = useTranslations();
    const { currentOrganization } = useAuthStore();
    const router = useRouter();

    return (
        <div className="p-8 space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-gray-600 mt-1">{currentOrganization?.name || 'Loading...'}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="font-semibold mb-2">SEO Pro</h3>
                    <p className="text-sm text-gray-600 mb-4">Keyword tracking and analysis</p>
                    <button
                        onClick={() => router.push('/app/seo/keywords')}
                        className="text-blue-600 hover:underline"
                    >
                        Open →
                    </button>
                </Card>

                {/* TODO: Add more enabled apps dynamically */}
            </div>
        </div>
    );
}
