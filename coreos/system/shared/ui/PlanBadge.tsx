'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Plan Badge — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Extracted from OrganizationsApp.tsx.
 *
 * @module coreos/system/shared/ui/PlanBadge
 * @version 1.0.0
 */

import React from 'react';
import type { OrgPlan } from '../types';

const COLORS: Record<OrgPlan, { bg: string; text: string }> = {
    free: { bg: '#f0f0f0', text: '#666' },
    starter: { bg: '#e3f2fd', text: '#1976d2' },
    pro: { bg: '#e8f5e9', text: '#388e3c' },
    enterprise: { bg: '#f3e5f5', text: '#7b1fa2' },
};

interface PlanBadgeProps {
    plan?: OrgPlan;
    variant?: 'light' | 'dark';
}

export function PlanBadge({ plan, variant = 'light' }: PlanBadgeProps) {
    const c = COLORS[plan || 'free'];
    const isDark = variant === 'dark';

    return (
        <span
            style={{
                padding: '4px 10px',
                background: isDark ? `${c.bg}22` : c.bg,
                color: c.text,
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'capitalize',
            }}
        >
            {plan || 'free'}
        </span>
    );
}
