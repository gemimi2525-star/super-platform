'use client';

import RoleForm from '@/components/roles/RoleForm';
import { PlatformRole } from '@/lib/roles/service';

export default function EditRoleClient({ role }: { role: PlatformRole }) {
    const handleSubmit = async (data: any) => {
        const res = await fetch(`/api/roles/${role.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error || 'Failed to update role');
        }
    };

    return (
        <RoleForm
            mode="edit"
            initialData={role}
            onSubmit={handleSubmit}
        />
    );
}
