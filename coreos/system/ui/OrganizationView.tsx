'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OrganizationView — System Hub Tab (Phase 27C.2 — Shared Core)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Full-parity organization management view powered by shared
 * OrganizationsPanel (dark). Replaces read-only list with full CRUD
 * + governance. Endpoint fixed to canonical /api/platform/orgs.
 *
 * @module coreos/system/ui/OrganizationView
 * @version 2.0.0 — Phase 27C.2
 */

import React from 'react';
import { OrganizationsPanel } from '@/coreos/system/shared/ui/orgs/OrganizationsPanel';

interface OrganizationViewProps {
    compact?: boolean;
}

export function OrganizationView({ compact }: OrganizationViewProps) {
    return (
        <OrganizationsPanel
            variant="dark"
            dataSourceMode="api"
            compact={compact}
        />
    );
}
