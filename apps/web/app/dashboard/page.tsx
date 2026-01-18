'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@platform/firebase';
import { onAuthStateChanged, signOut } from '@platform/firebase';
import { useAuthStore } from '@/lib/stores/authStore';
import { LanguageSwitcher } from '@modules/seo';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
    const router = useRouter();
    const t = useTranslations();
    const { firebaseUser, currentOrganization } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        // Redirect to organizations if no org selected
        if (!loading && !currentOrganization) {
            router.push('/organizations');
        }
    }, [loading, currentOrganization, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/auth/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">{t('common.loading')}</div>
            </div>
        );
    }

    if (!currentOrganization) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentOrganization.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {t('common.welcome')}, {firebaseUser?.email}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            <button
                                onClick={() => router.push('/organizations')}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {t('dashboard.organizations')}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {t('common.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.plan')}</p>
                                <p className="text-2xl font-bold text-gray-900 capitalize">
                                    {currentOrganization.plan}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">💎</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.modules')}</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {currentOrganization.modules?.length || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.yourRole')}</p>
                                <p className="text-2xl font-bold text-gray-900">{t('dashboard.owner')}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">👑</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.status')}</p>
                                <p className="text-2xl font-bold text-green-600">{t('dashboard.active')}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('dashboard.activeModules')}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {(currentOrganization.modules || []).map((module) => (
                            <div
                                key={module}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">
                                            {module === 'seo' ? '🔍' : '📊'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 capitalize">
                                            {module}
                                        </h3>
                                        <p className="text-xs text-gray-500">{t('dashboard.clickToOpen')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        🎉 {t('dashboard.liveBanner.title')}
                    </h2>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>✅ {t('dashboard.liveBanner.organization')}: <strong>{currentOrganization.name}</strong></p>
                        <p>✅ {t('dashboard.liveBanner.multiTenant')}</p>
                        <p>✅ {t('dashboard.liveBanner.rbac')}</p>
                        <p>✅ {t('dashboard.liveBanner.audit')}</p>
                        <p className="pt-2 text-blue-700">
                            🚀 {t('dashboard.liveBanner.ready')}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
