/**
 * useApi Hook
 * 
 * React hook for type-safe API calls with automatic error mapping.
 * Handles loading states and error mapping without coupling to UI components.
 * 
 * @example
 * ```typescript
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, error, loading } = useApi<User>(`/api/users/${userId}`);
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   if (error) {
 *     if (error.type === 'toast') {
 *       // Show toast notification
 *       return <div>Error: {error.message}</div>;
 *     }
 *     if (error.type === 'redirect') {
 *       // Handle redirect
 *       router.push(error.redirectTo);
 *     }
 *   }
 *   
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch, isApiError, mapError, type MappedError } from '@super-platform/core';
import { ApiErrorCode } from '@/lib/api';

export interface UseApiOptions extends RequestInit {
    /** Skip automatic fetch on mount */
    skip?: boolean;
}

export interface UseApiResult<T> {
    /** The fetched data (undefined until loaded) */
    data: T | undefined;

    /** Mapped error with UI handling instructions (undefined if no error) */
    error: MappedError | undefined;

    /** Whether the request is in progress */
    loading: boolean;

    /** Manually trigger a refetch */
    refetch: () => Promise<void>;
}

/**
 * Hook for making type-safe API calls
 * 
 * @template T The expected response data type
 * @param url The API endpoint URL
 * @param options Fetch options and hook configuration
 * @returns Object containing data, error, loading state, and refetch function
 */
export function useApi<T = unknown>(
    url: string,
    options?: UseApiOptions
): UseApiResult<T> {
    const [data, setData] = useState<T | undefined>(undefined);
    const [error, setError] = useState<MappedError | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(!options?.skip);

    const fetchData = async () => {
        setLoading(true);
        setError(undefined);

        try {
            const result = await apiFetch<T>(url, options);
            setData(result);
        } catch (err) {
            // Check if it's an ApiError
            if (isApiError(err)) {
                // Map the error to UI handling strategy
                const mappedError = mapError(err.response);
                setError(mappedError);
            } else {
                // Handle unexpected errors
                setError({
                    type: 'toast',
                    message: 'An unexpected error occurred',
                    originalError: {
                        code: ApiErrorCode.INTERNAL_ERROR,
                        message: err instanceof Error ? err.message : 'Unknown error',
                        errorId: 'unknown',
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!options?.skip) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]); // Only re-fetch when URL changes

    return {
        data,
        error,
        loading,
        refetch: fetchData,
    };
}
