'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UsersView — System Hub Tab (Phase 27C.2 — Shared Core)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Full-parity user management view powered by shared UsersPanel (dark).
 * Replaces read-only list with full CRUD + governance.
 *
 * @module coreos/system/ui/UsersView
 * @version 2.0.0 — Phase 27C.2
 */

import React from 'react';
import { UsersPanel } from '@/coreos/system/shared/ui/users/UsersPanel';

interface UsersViewProps {
    compact?: boolean;
}

export function UsersView({ compact }: UsersViewProps) {
    return (
        <UsersPanel
            variant="dark"
            dataSourceMode="api"
            compact={compact}
        />
    );
}
