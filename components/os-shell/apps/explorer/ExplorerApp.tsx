/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Files / Data Explorer App
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style Finder for browsing data and launching apps.
 * Intent-based navigation, single-instance window.
 * 
 * Phase 9: Updated with NEXUS Design Tokens
 * 
 * @module components/os-shell/apps/explorer/ExplorerApp
 * @version 2.0.0 (Phase 9)
 */

'use client';

import React, { useState } from 'react';
import '@/styles/nexus-tokens.css';
import { Sidebar } from './Sidebar';
import { MainList } from './MainList';
import { useOpenCapability } from '@/governance/synapse';

export function ExplorerApp() {
    // Current Path State
    const [currentPath, setCurrentPath] = useState('/');

    // Launch App Hook
    const openCapability = useOpenCapability();

    // Wrapper to cast string to CapabilityId (as OMS returns strings)
    const handleLaunch = (appId: string) => {
        openCapability(appId as any);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--nx-surface-panel)',
            color: 'var(--nx-text-primary)',
            fontFamily: 'var(--nx-font-system)',
        }}>
            {/* Header / Path Bar */}
            <div style={{
                height: 40,
                borderBottom: '1px solid var(--nx-border-divider)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 var(--nx-space-4)',
                gap: 'var(--nx-space-3)',
                background: 'var(--nx-surface-toolbar)',
                backdropFilter: 'blur(10px)',
            }}>
                <button
                    onClick={() => setCurrentPath('/')}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--nx-text-section)',
                        color: 'var(--nx-text-secondary)',
                    }}
                    title="Home"
                >
                    🏠
                </button>
                <div style={{
                    fontSize: 'var(--nx-text-body)',
                    color: 'var(--nx-text-secondary)',
                    background: 'var(--nx-surface-input)',
                    padding: 'var(--nx-space-1) var(--nx-space-3)',
                    borderRadius: 'var(--nx-radius-sm)',
                    flex: 1,
                }}>
                    {currentPath}
                </div>
            </div>

            {/* Split View */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar
                    currentPath={currentPath}
                    onNavigate={setCurrentPath}
                />
                <MainList
                    currentPath={currentPath}
                    onNavigate={setCurrentPath}
                    onLaunchApp={handleLaunch}
                />
            </div>
        </div>
    );
}

// OS Registry Metadata
export const EXPLORER_APP_ID = 'system.explorer';
export const EXPLORER_APP_META = {
    id: EXPLORER_APP_ID,
    title: 'Finder',
    icon: '🗂️',
    width: 800,
    height: 500
};
