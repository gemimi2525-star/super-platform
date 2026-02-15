'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Status Badge — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Combined user status + org status badge.
 * Supports: active, inactive, pending, suspended, disabled.
 *
 * @module coreos/system/shared/ui/StatusBadge
 * @version 1.0.0
 */

import React from 'react';

type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'disabled';

const COLORS: Record<Status, { bg: string; text: string }> = {
    active: { bg: '#e6f7e6', text: '#1a7f1a' },
    inactive: { bg: '#f0f0f0', text: '#666' },
    pending: { bg: '#fff3e0', text: '#e65100' },
    suspended: { bg: '#fff3e0', text: '#f57c00' },
    disabled: { bg: '#ffebee', text: '#c62828' },
};

interface StatusBadgeProps {
    status: string;
    variant?: 'light' | 'dark';
}

export function StatusBadge({ status, variant = 'light' }: StatusBadgeProps) {
    const key = (status || 'active') as Status;
    const c = COLORS[key] || COLORS.active;
    const isDark = variant === 'dark';

    return (
        <span
            style={{
                padding: '2px 8px',
                background: isDark ? `${c.bg}22` : c.bg,
                color: isDark ? c.text : c.text,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'capitalize',
            }}
        >
            {status || 'active'}
        </span>
    );
}
