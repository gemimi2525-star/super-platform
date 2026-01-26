'use client';

/**
 * useAuditLogs Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { AuditLog, AuditLogFilters } from '../types';

export function useAuditLogs(filters?: AuditLogFilters) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters?.action) params.set('action', filters.action);
            if (filters?.limit) params.set('limit', String(filters.limit));

            const res = await fetch(`/api/platform/audit-logs?${params}`);
            if (!res.ok) throw new Error('Failed to fetch audit logs');

            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [filters?.action, filters?.limit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, refetch: fetchLogs };
}
