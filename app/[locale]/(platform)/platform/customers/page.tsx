'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { apiClient } from '@/lib/api-client';
import { Table, Badge, Card, CardBody } from '@super-platform/ui';
import { useAdminContext } from '@/contexts/AdminContext';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from '@/lib/i18n';

interface Customer {
    id: string;
    name: string;
    code: string;
    status: 'active' | 'inactive' | 'pending';
    contactPerson?: {
        name: string;
        email: string;
        phone: string;
    };
    createdAt: string;
}

export default function CustomersPage() {
    const t = useTranslations();
    const locale = useLocale();
    const { selectedOrgId } = useAdminContext();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reset state on org change or initial load
        setCustomers([]);
        setError(null);

        if (!selectedOrgId) {
            setIsLoading(false);
            return;
        }

        async function fetchCustomers() {
            setIsLoading(true);
            try {
                // apiClient automatically injects x-org-id from localStorage
                // We trust AdminContext to sync localStorage key 'admin_context_org_id'
                const res = await apiClient<{ data: { customers: Customer[] } }>('/api/platform/customers');
                setCustomers(res.data.customers || []);
            } catch (err: any) {
                console.error('Failed to fetch customers:', err);
                const msg = err.message || t('platform.customers.form.error');

                // Handle specific errors
                if (msg.includes('Organization Context Missing') || msg.includes('missing-org')) {
                    setError(t('common.states.noOrgTitle'));
                } else if (msg.includes('Permission Denied') || msg.includes('Forbidden')) {
                    setError(t('platform.customers.errors.permissionDenied'));
                } else {
                    setError(msg);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchCustomers();
    }, [selectedOrgId]); // Re-run when context changes

    const columns: any[] = [
        {
            key: 'code',
            header: t('platform.customers.form.fields.code.label'),
            accessorKey: 'code',
            cell: (row: Customer) => (
                <Link href={`/${locale}/platform/customers/${row.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    {row.code}
                </Link>
            )
        },
        {
            key: 'name',
            header: t('platform.customers.form.fields.name.label'),
            accessorKey: 'name',
            cell: (row: Customer) => (
                <div>
                    <Link href={`/${locale}/platform/customers/${row.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                        {row.name}
                    </Link>
                    {row.contactPerson?.name && (
                        <div className="text-xs text-gray-500">
                            {t('platform.customers.form.fields.contactName.label')}: {row.contactPerson.name}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            header: t('common.status'),
            accessorKey: 'status',
            cell: (row: Customer) => {
                const colors: Record<string, string> = {
                    active: 'success',
                    inactive: 'neutral',
                    pending: 'warning'
                };
                const normalizedStatus = row.status?.toLowerCase() || 'inactive';
                const statusKey = `common.status.${normalizedStatus}`;
                return <Badge variant={colors[normalizedStatus] as any || 'neutral'}>{t(statusKey)}</Badge>;
            }
        },
        {
            key: 'createdAt',
            header: t('common.crud.create'), // Approximated, or add created date key
            accessorKey: 'createdAt',
            cell: (row: Customer) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
        }
    ];

    // Case 1: No Org Selected (Friendly Guide - Not an Error)
    if (!selectedOrgId) {
        return (
            <div>
                <PageHeader
                    title={t('platform.customers.list.title')}
                    description={t('common.states.noOrgDesc')}
                />
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{t('common.states.noOrgTitle')}</h3>
                    <p className="mt-1 text-gray-500">{t('common.states.noOrgDesc')}</p>
                </div>
            </div>
        );
    }



    return (
        <div>
            <PageHeader
                title={t('platform.customers.list.title')}
                description={t('platform.customers.list.subtitle').replace('{orgId}', selectedOrgId)}
                action={
                    <Link
                        href={`/${locale}/platform/customers/create`}
                        className="px-4 py-2 bg-[#0F6FDE] text-white rounded-lg hover:bg-[#0A5AC4] transition-colors duration-150 font-medium text-sm whitespace-nowrap inline-flex items-center gap-2"
                    >
                        <span>➕</span>
                        <span>{t('platform.customers.list.actions.create')}</span>
                    </Link>
                }
            />

            {error ? (
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 mb-4 animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">{t('common.states.errorTitle')}</p>
                    </div>
                    <p className="text-sm mt-1 ml-7">{error}</p>
                </div>
            ) : (
                <Card>
                    <CardBody className="p-0">
                        <Table
                            data={customers}
                            columns={columns}
                            loading={isLoading}
                            keyExtractor={(item: Customer) => item.id}
                            emptyMessage={t('customers.list.empty')}
                        />
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
