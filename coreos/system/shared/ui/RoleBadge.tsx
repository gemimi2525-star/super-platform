'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Role Badge — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Extracted from UsersApp.tsx.
 *
 * @module coreos/system/shared/ui/RoleBadge
 * @version 1.0.0
 */

import React from 'react';
import type { UserRole } from '../types';

const COLORS: Record<UserRole, { bg: string; text: string }> = {
    owner: { bg: '#fce4ec', text: '#c2185b' },
    admin: { bg: '#e3f2fd', text: '#1565c0' },
    user: { bg: '#f3e5f5', text: '#7b1fa2' },
    viewer: { bg: '#f5f5f5', text: '#666' },
};

interface RoleBadgeProps {
    role: UserRole;
    variant?: 'light' | 'dark';
}

export function RoleBadge({ role, variant = 'light' }: RoleBadgeProps) {
    const c = COLORS[role] || COLORS.user;
    const isDark = variant === 'dark';

    return (
        <span
            style={{
                padding: '2px 8px',
                background: isDark ? `${c.bg}22` : c.bg,
                color: c.text,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'capitalize',
            }}
        >
            {role}
        </span>
    );
}
