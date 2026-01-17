'use client';

/**
 * Organizations Page
 * 
 * List and create organizations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@platform/firebase';
import { onAuthStateChanged } from '@platform/firebase';
import {
    createOrganization,
    getUserOrganizations
} from '@platform/core';
import type { Organization } from '@platform/types';
import { useTranslations } from 'next-intl';

export default function OrganizationsPage() {
    const router = useRouter();
    const t = useTranslations();
    const [user, setUser] = useState<any>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);

            // Load organizations
            const orgs = await getUserOrganizations(user.uid);
            setOrganizations(orgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setCreating(true);
        try {
            const orgId = await createOrganization({
                name,
                slug,
                domain: null,
                logoURL: null,
                plan: 'free',
                settings: {
                    timezone: 'Asia/Bangkok',
                    currency: 'THB',
                    dateFormat: 'DD/MM/YYYY',
                    language: 'th',
                },
                modules: ['seo'],
                createdBy: user.uid,
            });

            // Get the created organization
            const orgs = await getUserOrganizations(user.uid);
            const newOrg = orgs.find(o => o.id === orgId);

            if (newOrg) {
                // Save to auth store
                const { useAuthStore } = await import('@/lib/stores/authStore');
                useAuthStore.getState().setCurrentOrganization(newOrg);

                // Redirect to dashboard
                router.push('/dashboard');
            }

            setOrganizations(orgs);
            setShowCreate(false);
            setName('');
            setSlug('');
        } catch (error) {
            console.error('Create organization error:', error);
            alert('Failed to create organization');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                        <p className="text-gray-600 mt-1">Manage your workspaces</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + New Organization
                    </button>
                </div>

                {/* Organizations List */}
                <div className="grid md:grid-cols-2 gap-4">
                    {organizations.map((org) => (
                        <div
                            key={org.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={async () => {
                                const { useAuthStore } = await import('@/lib/stores/authStore');
                                useAuthStore.getState().setCurrentOrganization(org);
                                router.push('/dashboard');
                            }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">@{org.slug}</p>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {org.plan}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {org.modules.length} modules
                                </span>
                            </div>
                        </div>
                    ))}

                    {organizations.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-500">
                            No organizations yet. Create your first one!
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Create Organization
                            </h2>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Acme Corp"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Slug (URL identifier)
                                    </label>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="acme-corp"
                                    />
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {creating ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
