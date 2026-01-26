import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/auth/server';
import { getRole } from '@/lib/roles/service';
import EditRoleClient from './client';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
    await requireOwner();
    const { id } = await params;
    const role = await getRole(id);

    if (!role) {
        notFound();
    }

    return <EditRoleClient role={role} />;
}
