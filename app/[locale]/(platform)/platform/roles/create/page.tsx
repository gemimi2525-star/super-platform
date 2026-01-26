'use client';

import RoleForm from '@/components/roles/RoleForm';

export default function CreateRolePage() {
    const handleSubmit = async (data: any) => {
        const res = await fetch('/api/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error || 'Failed to create role');
        }
    };

    return <RoleForm mode="create" onSubmit={handleSubmit} />;
}
