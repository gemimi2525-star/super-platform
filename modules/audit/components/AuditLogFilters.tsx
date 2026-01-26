'use client';

/**
 * Audit Log Filters Component
 */

import { useState } from 'react';
import type { AuditAction, AuditLogFilters } from '../types';

const ACTIONS: AuditAction[] = [
    'user.created',
    'user.updated',
    'user.deleted',
    'user.disabled',
    'user.enabled',
    'role.updated',
    'login.success',
    'login.failed',
];

interface AuditLogFiltersProps {
    filters: AuditLogFilters;
    onFiltersChange: (filters: AuditLogFilters) => void;
}

export function AuditLogFilters({ filters, onFiltersChange }: AuditLogFiltersProps) {
    return (
        <div className="flex flex-wrap gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                </label>
                <select
                    value={filters.action || ''}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            action: e.target.value as AuditAction || undefined,
                        })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="">All Actions</option>
                    {ACTIONS.map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit
                </label>
                <select
                    value={filters.limit || 50}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            limit: Number(e.target.value),
                        })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
    );
}
