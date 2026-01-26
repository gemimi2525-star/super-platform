'use client';

/**
 * useRoles Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { PlatformRoleDefinition } from '../types';

export function useRoles() {
    const [roles, setRoles] = useState<PlatformRoleDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/platform/roles');
            if (!res.ok) throw new Error('Failed to fetch roles');
            const data = await res.json();
            setRoles(data.roles || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const updateRole = async (roleId: string, permissions: string[]) => {
        try {
            setLoading(true);
            const res = await fetch('/api/platform/roles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId, permissions }),
            });

            if (!res.ok) throw new Error('Failed to update role');
            await fetchRoles();
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        } finally {
            setLoading(false);
        }
    };

    return { roles, loading, error, refetch: fetchRoles, updateRole };
}
