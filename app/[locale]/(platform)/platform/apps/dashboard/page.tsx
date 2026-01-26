'use client';

import { Card } from '@super-platform/ui';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';

import { PageHeader } from '@/components/PageHeader';

export default function DashboardAppPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.match(/^\/(en|th|zh)\//)?.[1] || 'en';
    const t = useTranslations('platform.controlPanel');

    // TODO: Fetch real stats from Firestore
    const stats = {
        organizations: 5, // Mock
        users: 12,        // Mock
        jobs: 24,         // Mock
    };

    return (
        <div className="p-8 space-y-8 bg-white/50 min-h-screen">
            <PageHeader
                title={t('title')}
                description={t('subtitle')}
            />

            {/* System Health */}
            <section>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-medium text-green-900">{t('systemOperational')}</span>
                    </div>
                    <span className="text-sm text-green-700">{t('authConnected')}</span>
                </div>
            </section>

            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t('organizations')}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.organizations}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                            🏢
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => router.push(`/${locale}/platform/orgs`)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {t('viewAll')} →
                        </button>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t('totalUsers')}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.users}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                            👥
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-400">{t('manageViaOrgs')}</span>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t('totalScans')}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.jobs}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                            🔍
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-400">{t('globalActivity')}</span>
                    </div>
                </Card>
            </section>

            {/* Functional Modules */}
            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('managementModules')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => router.push(`/${locale}/platform/orgs`)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow text-left"
                    >
                        <span className="text-2xl block mb-2">🏢</span>
                        <h3 className="font-semibold text-gray-900">{t('organizationsModule')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('manageTenantsSubscriptions')}</p>
                    </button>

                    <button
                        onClick={() => router.push(`/${locale}/platform/users`)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow text-left"
                    >
                        <span className="text-2xl block mb-2">👥</span>
                        <h3 className="font-semibold text-gray-900">{t('usersModule')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('usersModuleDesc')}</p>
                    </button>

                    <button
                        onClick={() => router.push(`/${locale}/platform/roles`)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow text-left"
                    >
                        <span className="text-2xl block mb-2">🔐</span>
                        <h3 className="font-semibold text-gray-900">{t('rolesModule')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('rolesModuleDesc')}</p>
                    </button>

                    <button
                        className="p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed text-left opacity-60"
                    >
                        <span className="text-2xl block mb-2">💰</span>
                        <h3 className="font-semibold text-gray-900">{t('billing')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('billingComingSoon')}</p>
                    </button>
                </div>
            </section>
        </div>
    );
}
