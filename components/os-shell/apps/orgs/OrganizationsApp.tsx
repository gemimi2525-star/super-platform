/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORGANIZATIONS APP — Main Component (Phase 27C.2 — Shared Core Refactor)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Thin wrapper around shared OrganizationsPanel. All CRUD, governance,
 * and UI logic now lives in coreos/system/shared.
 * 
 * @module components/os-shell/apps/orgs/OrganizationsApp
 * @version 2.0.0 — Phase 27C.2 Shared Core
 */

'use client';

import React from 'react';
import type { AppProps } from '../registry';
import { tokens } from '../../tokens';
import { MigrationBanner } from '@/coreos/system/ui/MigrationBanner';
import { OrganizationsPanel } from '@/coreos/system/shared/ui/orgs/OrganizationsPanel';

// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DATA_SOURCE_MODE: 'mock' | 'api' = 'api';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OrganizationsApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: tokens.fontFamily,
            padding: 20,
        }}>
            {/* Phase 27A: Migration Banner */}
            <MigrationBanner hubTab="organization" hubLabel="Organization Management" />

            {/* Shared Organizations Panel (light variant for legacy) */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <OrganizationsPanel
                    variant="light"
                    dataSourceMode={DATA_SOURCE_MODE}
                />
            </div>
        </div>
    );
}
