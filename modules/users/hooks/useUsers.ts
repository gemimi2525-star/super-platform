'use client';

/**
 * useUsers Hook
 * 
 * Custom hooks for user management
 */

import { useState, useEffect, useCallback } from 'react';
import type { PlatformUser, CreateUserRequest, UpdateUserRequest, UserActionResult } from '../types';

interface UseUsersOptions {
    autoFetch?: boolean;
}

export function useUsers(options: UseUsersOptions = { autoFetch: true }) {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/platform/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (options.autoFetch) {
            fetchUsers();
        }
    }, [options.autoFetch, fetchUsers]);

    return { users, loading, error, refetch: fetchUsers };
}

export function useCreateUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createUser = async (data: CreateUserRequest): Promise<UserActionResult> => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/platform/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to create user');
            }

            return {
                success: true,
                user: result.user,
                temporaryPassword: result.temporaryPassword,
            };
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    return { createUser, loading, error };
}

export function useUpdateUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateUser = async (uid: string, data: UpdateUserRequest): Promise<UserActionResult> => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/platform/users/${uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to update user');
            }

            return { success: true, user: result.user };
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    return { updateUser, loading, error };
}
