'use client';

/**
 * Owner Dashboard
 * 
 * Main dashboard for logged-in users
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@platform/firebase';
import { onAuthStateChanged, signOut } from '@platform/firebase';
import { useTranslations } from 'next-intl';

export default function OwnerPage() {
    const router = useRouter();
    const t = useTranslations();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Super Platform
                            </h1>
                            <p className="text-sm text-gray-500">
                                Welcome back, {user?.email}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Organizations Card */}
                    <div
                        onClick={() => router.push('/organizations')}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🏢</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Organizations</h3>
                                <p className="text-sm text-gray-600">Manage workspaces</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-blue-700">Click to view →</p>
                        </div>
                    </div>

                    {/* Modules Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Modules</h3>
                                <p className="text-sm text-gray-600">Coming soon</p>
                            </div>
                        </div>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">⚙️</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Settings</h3>
                                <p className="text-sm text-gray-600">Coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        🎉 Welcome to Super Platform!
                    </h2>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>✅ Phase 1: Core Platform - Complete!</p>
                        <p>🚀 Multi-tenant architecture ready</p>
                        <p>📦 Next: Add business modules (SEO, CRM, etc.)</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
