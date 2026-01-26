/**
 * Organization Detail Page
 * 
 * Shows detailed information about a specific organization.
 * Protected: Platform Owner only
 */

'use client';

import { Card } from '@super-platform/ui';
import { useTranslations } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PageProps {
    params: Promise<{ locale: string; id: string }>;
}

// UI-level type for organization data
interface Organization {
    id: string;
    name: string;
    slug?: string;
    plan?: string;
    domain?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    disabled?: boolean;
}

// Date formatter helper
function formatDate(isoString: string | null | undefined, locale: string): string {
    if (!isoString) {
        return '—';
    }

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Plan badge colors (from list page)
const PLAN_COLORS: Record<string, string> = {
    free: 'bg-[#F5F5F5] text-[#525252]',
    starter: 'bg-[#E6F1FC] text-[#0F6FDE]',
    pro: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-[#FFF4E6] text-[#D97706]',
};

async function getOrganization(id: string): Promise<{ organization?: Organization; error?: string }> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
        const res = await fetch(`${baseUrl}/api/platform/orgs/${id}`, {
            cache: 'no-store',
        });

        if (res.status === 404) {
            return { error: 'not_found' };
        }

        if (!res.ok) {
            return { error: 'server_error' };
        }

        const data = await res.json();
        return { organization: data.data?.organization };

    } catch (error) {
        return { error: 'server_error' };
    }
}

export default function OrganizationDetailPage() {
    const params = useParams();
    const locale = params.locale as string;
    const id = params.id as string;

    // i18n setup
    const t = useTranslations('platform.orgs.detail');

    // State for organization data
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch organization data
    useEffect(() => {
        async function fetchOrg() {
            const result = await getOrganization(id);
            if (result.organization) {
                setOrganization(result.organization);
            } else if (result.error) {
                setError(result.error);
            }
            setLoading(false);
        }
        fetchOrg();
    }, [id]);

    // Handle 404 error (Command 7)
    if (error === 'not_found') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🏢</div>
                    <h1 className="text-2xl font-bold text-[#242424] mb-2">
                        {t('error.notFound.title')}
                    </h1>
                    <p className="text-[#6B6B6B]">
                        {t('error.notFound.subtitle')}
                    </p>
                </div>
            </div>
        );
    }

    // Handle server error (Command 7)
    if (error === 'server_error' || !organization) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-[#242424] mb-2">
                        {t('error.failed.title')}
                    </h1>
                    <p className="text-[#6B6B6B]">
                        {t('error.failed.subtitle')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section (Command 2) */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#242424]">{organization.name}</h1>
                        <p className="text-[#6B6B6B] mt-1">
                            <code className="text-xs bg-[#F5F5F5] px-2 py-1 rounded font-mono">
                                {organization.id}
                            </code>
                        </p>
                    </div>
                    {/* Edit Button (Command 2) */}
                    <button
                        disabled
                        className="px-4 py-2 bg-[#0F6FDE] text-white rounded-lg opacity-50 cursor-not-allowed font-medium text-sm"
                    >
                        {t('edit')}
                    </button>
                </div>
            </div>

            {/* Main Content - 3 Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information Card (Commands 3, 4) */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-[#242424] mb-4">
                            {t('section.basic')}
                        </h2>
                        <div className="space-y-3">
                            {/* Name (Command 4) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.name')}</label>
                                <p className="text-[#242424] mt-1">{organization.name}</p>
                            </div>
                            {/* Slug (Command 4) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.slug')}</label>
                                <p className="text-[#242424] mt-1">
                                    <code className="bg-[#F5F5F5] px-2 py-1 rounded text-sm">
                                        {organization.slug || '—'}
                                    </code>
                                </p>
                            </div>
                            {/* Plan (Command 4) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.plan')}</label>
                                <p className="text-[#242424] mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[organization.plan || 'free'] || PLAN_COLORS.free}`}>
                                        {(organization.plan || 'Free').toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            {/* Status (Commands 2, 4) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.status')}</label>
                                <p className="text-[#242424] mt-1">
                                    {organization.disabled ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            {t('status.disabled')}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {t('status.active')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Domain Card (Commands 3, 5) */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-[#242424] mb-4">
                            {t('section.domain')}
                        </h2>
                        <div className="space-y-3">
                            {/* Domain (Command 5) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.domain')}</label>
                                <p className="text-[#242424] mt-1">{organization.domain || '—'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Audit Information Card (Commands 3, 6) */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-[#242424] mb-4">
                            {t('section.audit')}
                        </h2>
                        <div className="space-y-3">
                            {/* Created At (Command 6) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.createdAt')}</label>
                                <p className="text-[#242424] mt-1 text-sm">{formatDate(organization.createdAt, locale)}</p>
                            </div>
                            {/* Updated At (Command 6) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.updatedAt')}</label>
                                <p className="text-[#242424] mt-1 text-sm">{formatDate(organization.updatedAt, locale)}</p>
                            </div>
                            {/* Created By (Command 6) */}
                            <div>
                                <label className="text-sm font-medium text-[#6B6B6B]">{t('field.createdBy')}</label>
                                <p className="text-[#242424] mt-1">
                                    <code className="text-xs bg-[#F5F5F5] px-2 py-1 rounded font-mono">
                                        {organization.createdBy || '—'}
                                    </code>
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
