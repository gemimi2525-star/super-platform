'use client';

import { useTranslations } from '@/lib/i18n';
import { Card, Table, type ColumnDef } from '@super-platform/ui';
import { useState } from 'react';

// TODO: Replace with actual Firestore fetch
const mockOrgs = [
    { id: 'org1', name: 'Acme Corp', status: 'active', createdAt: new Date('2024-01-01') },
    { id: 'org2', name: 'TechStart Inc', status: 'active', createdAt: new Date('2024-02-15') },
];

interface Org {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
}

/**
 * Platform: Tenants List
 * Shows all organizations (for owner)
 */
export default function PlatformTenantsPage() {
    const t = useTranslations();
    const [orgs] = useState<Org[]>(mockOrgs);

    const columns: ColumnDef<Org>[] = [
        {
            key: 'name',
            header: 'Organization',
            render: (org) => (
                <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">{org.id}</div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (org) => (
                <span className={`px-2 py-1 text-xs rounded-full ${org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {org.status}
                </span>
            )
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (org) => org.createdAt.toLocaleDateString()
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (org) => (
                <a href={`/platform/tenants/${org.id}`} className="text-blue-600 hover:underline">
                    View Details
                </a>
            )
        }
    ];

    return (
        <div className="p-8 space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Platform Console - Organizations</h1>
                <p className="text-gray-600 mt-1">Manage all tenant organizations</p>
            </header>

            <Card>
                <Table
                    columns={columns}
                    data={orgs}
                    keyExtractor={(org) => org.id}
                    emptyMessage="No organizations found"
                />
            </Card>
        </div>
    );
}
