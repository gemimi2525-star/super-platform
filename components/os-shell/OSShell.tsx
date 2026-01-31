/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Main Component (+ Persistence V1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete OS Shell with Desktop, TopBar, DockBar, Windows, and Persistence.
 * All interactions go through the governance adapter.
 * 
 * @module components/os-shell/OSShell
 * @version 2.0.0
 */

'use client';

import React from 'react';
import { tokens } from './tokens';
import { LoginScreen } from './LoginScreen';
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

export function OSShell() {
    const windows = useWindows();
    const bootstrap = useKernelBootstrap();
    const state = useSystemState();
    const focusedWindowId = state.focusedWindowId;

    // Lock Screen State (Phase XI)
    const [isLocked, setIsLocked] = React.useState(true);

    const handleUnlock = () => {
        setIsLocked(false);

        // Log the login event
        addDecisionLog({
            timestamp: Date.now(),
            action: 'USER_LOGIN_SUCCESS',
            capabilityId: 'auth',
            decision: 'ALLOW',
            reasonChain: [
                'User authenticated via lock screen',
                'Simulated session started'
            ],
        });
    };

    // Log panel visibility
    const [isLogPanelOpen, setIsLogPanelOpen] = React.useState(false);

    // Track if we've restored already
    const [hasRestored, setHasRestored] = React.useState(false);

    // Get userId from security context
    const userId = state.security.userId || 'guest';

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
            fontFamily: tokens.fontFamily,
        }}>
            {/* Phase XI: Lock Screen */}
            {isLocked && (
                <LoginScreen onLoginSuccess={handleUnlock} />
            )}

            {/* Background */}
            <CalmDesktop />

            {/* Top Bar */}
            <TopBar
                onToggleLogs={() => setIsLogPanelOpen(!isLogPanelOpen)}
                isLogPanelOpen={isLogPanelOpen}
            />

            {/* Windows Layer */}
            <div style={{
                position: 'absolute',
                inset: 0,
                paddingTop: tokens.menubarHeight,
                paddingBottom: tokens.dockHeight + 20,
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
