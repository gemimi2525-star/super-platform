'use client';

/**
 * Sites List Page (with i18n and guards)
 */

import { useSites, useSEOGuard } from '@modules/seo';
import { useAuthStore } from '@/lib/stores/authStore';
import { LanguageSwitcher } from '@modules/seo';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SitesPage() {
    const router = useRouter();
    const t = useTranslations();
    const authStore = useAuthStore();

    // Guard: Ensure organization is selected
    const { organizationId, organization, isReady } = useSEOGuard(authStore);

    // Fetch sites
    const { data: sites, isLoading, error } = useSites(organizationId);

    // Loading state
    if (!isReady || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">{t('common.loading')}</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md p-6 bg-white rounded-xl shadow-sm border border-red-200">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">
                        {t('common.error')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                    <button
                        onClick={() => router.push('/organizations')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        {t('dashboard.organizations')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('seo.sites.title', { defaultValue: 'เว็บไซต์ทั้งหมด' })}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {organization?.name}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ← {t('common.back', { defaultValue: 'กลับ' })}
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                + {t('seo.sites.addNew', { defaultValue: 'เพิ่มเว็บไซต์' })}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Sites Grid */}
                {sites && sites.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sites.map((site) => (
                            <div
                                key={site.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/seo/sites/${site.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">🌐</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${site.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {site.status === 'active'
                                            ? t('seo.sites.active', { defaultValue: 'ใช้งาน' })
                                            : t('seo.sites.inactive', { defaultValue: 'ไม่ใช้งาน' })
                                        }
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {site.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {site.domain}
                                </p>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                        {t('seo.sites.createdAt', { defaultValue: 'สร้างเมื่อ' })} {new Date(site.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-6xl">🌐</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('seo.sites.noData', { defaultValue: 'ยังไม่มีเว็บไซต์' })}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {t('seo.sites.noDataDesc', { defaultValue: 'เริ่มต้นโดยการเพิ่มเว็บไซต์แรกของคุณ' })}
                        </p>
                        <button
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            + {t('seo.sites.addNew', { defaultValue: 'เพิ่มเว็บไซต์ใหม่' })}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
