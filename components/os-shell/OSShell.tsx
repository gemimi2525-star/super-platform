/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Main Component (+ Persistence V1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete OS Shell with Desktop, TopBar, DockBar, Windows, and Persistence.
 * All interactions go through the governance adapter.
 * 
 * Phase 8: Updated to use NEXUS Design Tokens
 * Phase 9.1: Added manifest SSOT validation on startup
 * 
 * @module components/os-shell/OSShell
 * @version 3.1.0 (Phase 9.1)
 */

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';
// Phase 9.4: Removed LoginScreen import (decoupled to /login page)
import { CalmDesktop } from './CalmDesktop';

import { TopBar } from './TopBar';
import { DockBar } from './DockBar';
import { WindowChrome } from './WindowChrome';
import { StepUpModal } from './StepUpModal';
import { SystemLogPanel } from './SystemLogPanel';
import {
    useWindows,
    useSystemState,
    useKernelBootstrap,
    useSingleInstanceOpen,
} from '@/governance/synapse';
import {
    loadSnapshot,
    debouncedSave,
    sanitizeSnapshot,
    type ShellSnapshot,
} from './shell-persistence';
import { restoreFromSnapshotSync } from './restore-flow';
import { addDecisionLog } from './system-log';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { activateKeyboardHandler, deactivateKeyboardHandler, getKeyboardHandler } from '@/coreos/keyboard-handler';
import { runStartupValidation } from './apps/manifest-validation';
import { BrainChatOverlay } from './BrainChatOverlay'; // Phase 18
import { SpotlightOverlay } from './SpotlightOverlay'; // Phase 17N
import { useGlobalSearch } from '@/coreos/search/useGlobalSearch'; // Phase 17N
import type { SearchAction } from '@/coreos/search/searchTypes'; // Phase 17N
import type { CapabilityId } from '@/coreos/types'; // Phase 17N
import { ContextMenu, type ContextMenuEntry } from './ContextMenu'; // Phase 13
import { useContextMenu } from './hooks/useContextMenu'; // Phase 13
// Phase 36: Offline Kernel + Dev Clarity
import { DevBadge } from '@/coreos/ops/ui/DevBadge';
import { OfflineBanner } from '@/coreos/offline/OfflineBanner';
// Phase 15B: Process Model
import { useProcessStore } from '@/coreos/process/process-store';

// Phase 18.5: OS Event Bus
import { initEventBus } from '@/coreos/events';

export function OSShell() {
    const windows = useWindows();
    const bootstrap = useKernelBootstrap();
    const state = useSystemState();
    const focusedWindowId = state.focusedWindowId;

    // Phase 40E: ?reset=1 → clear persisted session + SW → redirect /os
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('reset') === '1') {
            console.log('[OSShell] Reset session requested via ?reset=1');
            // Clear all shell persistence keys
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('apicoredata:coreos:')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            console.log(`[OSShell] Cleared ${keysToRemove.length} session keys`);

            // Unregister service workers
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                    regs.forEach(r => r.unregister());
                    console.log(`[OSShell] Unregistered ${regs.length} service workers`);
                });
            }

            // Redirect to clean URL (remove ?reset=1)
            window.location.replace('/os');
            return;
        }
    }, []);

    // Phase 18.5: Initialize OS Event Bus (sources + sinks)
    React.useEffect(() => {
        const cleanup = initEventBus();
        return cleanup;
    }, []);

    // Lock Screen decoupled to /login page
    // const [isLocked, setIsLocked] = React.useState(true);
    // handleUnlock removed in favor of middleware protection

    // Log panel visibility
    const [isLogPanelOpen, setIsLogPanelOpen] = React.useState(false);

    // Phase 18: Brain Chat ⌘+K overlay state
    const [isBrainOverlayOpen, setIsBrainOverlayOpen] = React.useState(false);

    // Phase 17N: Global Search / Spotlight
    const openCapability = useSingleInstanceOpen();
    const handleSearchAction = React.useCallback((action: SearchAction) => {
        switch (action.type) {
            case 'openApp':
                openCapability(action.capabilityId as CapabilityId);
                break;
            case 'navigate':
                window.location.href = action.route;
                break;
            case 'openTab':
                openCapability(action.capabilityId as CapabilityId);
                break;
            case 'custom':
                action.handler();
                break;
        }
    }, [openCapability]);
    const spotlight = useGlobalSearch(handleSearchAction);

    // Phase 13: Desktop context menu
    const { menuState, showMenu, hideMenu } = useContextMenu();

    // Track if we've restored already
    const [hasRestored, setHasRestored] = React.useState(false);

    // Get userId from security context
    const userId = state.security.userId || 'guest';

    // Phase 9.1: Run manifest/registry validation on startup
    React.useEffect(() => {
        runStartupValidation();
    }, []);

    // Phase 7.3: Activate keyboard handler on mount
    // Phase 18: Register ⌘+K brain toggle callback
    // Phase 17N: Register ⌘+Space spotlight toggle callback
    React.useEffect(() => {
        activateKeyboardHandler();
        getKeyboardHandler().setBrainToggleCallback(() => {
            setIsBrainOverlayOpen(prev => !prev);
        });
        getKeyboardHandler().setSpotlightToggleCallback(() => {
            spotlight.toggle();
        });
        return () => {
            getKeyboardHandler().setBrainToggleCallback(null);
            getKeyboardHandler().setSpotlightToggleCallback(null);
            deactivateKeyboardHandler();
        };
    }, [spotlight.toggle]);

    // Bootstrap on mount if not authenticated
    React.useEffect(() => {
        if (!state.security.authenticated) {
            bootstrap('admin@apicoredata.com', 'owner', [
                'users.read',
                'users.write',
                'orgs.read',
                'audit.view',
                'settings.read',
                'system.admin',
            ]);
        }
    }, [state.security.authenticated, bootstrap]);

    // Restore from snapshot after bootstrap (once)
    React.useEffect(() => {
        if (state.security.authenticated && !hasRestored) {
            setHasRestored(true);

            // Load and restore snapshot
            const snapshot = loadSnapshot(userId);
            if (snapshot) {
                const safeSnapshot = sanitizeSnapshot(snapshot);

                // Log the restore attempt
                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'RESTORE_SESSION',
                    capabilityId: 'system',
                    decision: 'ALLOW',
                    reasonChain: [
                        `Loaded snapshot with ${safeSnapshot.windows.length} windows`,
                        `Saved at ${new Date(safeSnapshot.savedAt).toLocaleString()}`,
                    ],
                });

                // Restore windows through governance
                restoreFromSnapshotSync(safeSnapshot);
            }
        }
    }, [state.security.authenticated, hasRestored, userId]);

    // Save state on changes (debounced)
    React.useEffect(() => {
        if (state.security.authenticated && hasRestored) {
            debouncedSave(userId, state.windows, state.focusedWindowId, null);
        }
    }, [state.windows, state.focusedWindowId, state.security.authenticated, hasRestored, userId]);

    // Phase 15B: Process lifecycle tracking
    React.useEffect(() => {
        if (!state.security.authenticated) return;

        const focusedWin = focusedWindowId ? state.windows[focusedWindowId] : null;
        const focusedAppId = focusedWin?.capabilityId ?? null;

        // Ensure process exists for all open windows
        Object.values(state.windows).forEach(w => {
            if (w.state !== 'hidden') {
                useProcessStore.getState().ensureProcess(w.capabilityId, w.title);
            }
        });

        // Handle focus change
        useProcessStore.getState().handleFocusChange(focusedAppId);
    }, [focusedWindowId, state.windows, state.security.authenticated]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            fontFamily: 'var(--nx-font-system)',
        }}>
            {/* Phase XI: Lock Screen - Removed in favor of /login page */}
            {/* isLocked logic removed */}

            {/* Background */}
            <CalmDesktop />

            {/* Phase 7.2: Service Worker Registration */}
            <ServiceWorkerRegistration />

            {/* Phase 36: Offline Mode Banner */}
            <OfflineBanner />

            {/* Phase 36A: Dev Badge */}
            <DevBadge />

            {/* Top Bar */}
            <TopBar
                onToggleLogs={() => setIsLogPanelOpen(!isLogPanelOpen)}
                isLogPanelOpen={isLogPanelOpen}
            />

            {/* Windows Layer */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    paddingTop: 'var(--nx-menubar-height)',
                    paddingBottom: 'calc(var(--nx-dock-height) + 20px)',
                }}
                onContextMenu={(e) => {
                    // Only show desktop context menu if clicking on the desktop area (not on a window)
                    if ((e.target as HTMLElement).closest('[data-window-chrome]')) return;
                    const desktopItems: ContextMenuEntry[] = [
                        { id: 'show-all', label: 'Show All Windows', icon: '🪟', onClick: () => { } },
                        { id: 'div-1', type: 'divider' },
                        { id: 'about', label: 'About This OS', icon: 'ℹ️', onClick: () => { } },
                    ];
                    showMenu(e, desktopItems);
                }}
            >
                {windows.map(window => (
                    <WindowChrome
                        key={window.id}
                        window={window}
                        isFocused={window.id === focusedWindowId}
                    />
                ))}
            </div>

            {/* Dock */}
            <DockBar />

            {/* Step-up Modal */}
            <StepUpModal />

            {/* System Log Panel (Dev) */}
            <SystemLogPanel
                isOpen={isLogPanelOpen}
                onClose={() => setIsLogPanelOpen(false)}
            />

            {/* Phase 18: Brain Chat Overlay (⌘+K) */}
            <BrainChatOverlay
                isOpen={isBrainOverlayOpen}
                onClose={() => setIsBrainOverlayOpen(false)}
            />

            {/* Phase 17N: Global Search Spotlight (⌘+Space) */}
            <SpotlightOverlay
                isOpen={spotlight.state.isOpen}
                query={spotlight.state.query}
                results={spotlight.state.results}
                selectedIndex={spotlight.state.selectedIndex}
                onQueryChange={spotlight.setQuery}
                onSelectNext={spotlight.selectNext}
                onSelectPrev={spotlight.selectPrev}
                onExecuteSelected={spotlight.executeSelected}
                onExecuteAction={spotlight.executeAction}
                onClose={spotlight.close}
            />

            {/* Phase 13: Context Menu */}
            {menuState.isOpen && (
                <ContextMenu
                    x={menuState.x}
                    y={menuState.y}
                    items={menuState.items}
                    onClose={hideMenu}
                />
            )}
        </div>
    );
}

export default OSShell;
