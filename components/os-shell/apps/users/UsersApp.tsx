/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USERS APP — Main Component (Phase 27C.2 — Shared Core Refactor)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Thin wrapper around shared UsersPanel. All CRUD, governance, and UI
 * logic now lives in coreos/system/shared.
 * 
 * @module components/os-shell/apps/users/UsersApp
 * @version 4.0.0 — Phase 27C.2 Shared Core
 */

'use client';

import React from 'react';
import type { AppProps } from '../registry';
import { tokens } from '../../tokens';
import { MigrationBanner } from '@/coreos/system/ui/MigrationBanner';
import { UsersPanel } from '@/coreos/system/shared/ui/users/UsersPanel';

// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DATA_SOURCE_MODE: 'mock' | 'api' = 'api';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UsersApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: tokens.fontFamily,
                position: 'relative',
            }}
        >
            {/* Phase 27A: Migration Banner */}
            <div style={{ padding: '12px 20px 0' }}>
                <MigrationBanner hubTab="users" hubLabel="User Management" />
            </div>

            {/* Shared Users Panel (light variant for legacy) */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <UsersPanel
                    variant="light"
                    dataSourceMode={DATA_SOURCE_MODE}
                />
            </div>
        </div>
    );
}
