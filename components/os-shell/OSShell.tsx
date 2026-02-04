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
import { activateKeyboardHandler, deactivateKeyboardHandler } from '@/coreos/keyboard-handler';
import { runStartupValidation } from './apps/manifest-validation';

// Debug: Check for undefined components
console.log('[OSShell Debug] Component imports:', {
    CalmDesktop: CalmDesktop ? 'OK' : 'UNDEFINED',
    TopBar: TopBar ? 'OK' : 'UNDEFINED',
    DockBar: DockBar ? 'OK' : 'UNDEFINED',
    WindowChrome: WindowChrome ? 'OK' : 'UNDEFINED',
    StepUpModal: StepUpModal ? 'OK' : 'UNDEFINED',
    SystemLogPanel: SystemLogPanel ? 'OK' : 'UNDEFINED',
    ServiceWorkerRegistration: ServiceWorkerRegistration ? 'OK' : 'UNDEFINED',
});

export function OSShell() {
    const windows = useWindows();
    const bootstrap = useKernelBootstrap();
    const state = useSystemState();
    const focusedWindowId = state.focusedWindowId;

    // Lock Screen decoupled to /login page
    // const [isLocked, setIsLocked] = React.useState(true);
    // handleUnlock removed in favor of middleware protection

    // Log panel visibility
    const [isLogPanelOpen, setIsLogPanelOpen] = React.useState(false);

    // Track if we've restored already
    const [hasRestored, setHasRestored] = React.useState(false);

    // Get userId from security context
    const userId = state.security.userId || 'guest';

    // Phase 9.1: Run manifest/registry validation on startup
    React.useEffect(() => {
        runStartupValidation();
    }, []);

    // Phase 7.3: Activate keyboard handler on mount
    React.useEffect(() => {
        activateKeyboardHandler();
        return () => deactivateKeyboardHandler();
    }, []);

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

            {/* Top Bar */}
            <TopBar
                onToggleLogs={() => setIsLogPanelOpen(!isLogPanelOpen)}
                isLogPanelOpen={isLogPanelOpen}
            />

            {/* Windows Layer */}
            <div style={{
                position: 'absolute',
                inset: 0,
                paddingTop: 'var(--nx-menubar-height)',
                paddingBottom: 'calc(var(--nx-dock-height) + 20px)',
            }}>
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
        </div>
    );
}

export default OSShell;
