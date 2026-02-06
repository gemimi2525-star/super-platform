/**
 * App Launcher Component — Phase 17.1
 * 
 * Multi-app window manager with:
 * - Z-order management (click to focus)
 * - Minimize/restore
 * - Cascade positioning
 * - Max 10 concurrent windows
 * - Taskbar for running apps
 * 
 * ADDITIVE to Phase 16 — Runtime Contract v1 remains FROZEN.
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { AppManifest } from '@/lib/runtime/types';
import {
    WindowState,
    WindowManagerState,
    ZIndexManager,
    PositionManager,
    windowManagerReducer,
    canLaunchNewWindow,
    getMinimizedWindows,
    getVisibleWindows,
    WINDOW_CONSTANTS,
    createInitialWindowManagerState,
} from './WindowManager';

// ═══════════════════════════════════════════════════════════════════════════
// Main App Launcher Component
// ═══════════════════════════════════════════════════════════════════════════

export function AppLauncher() {
    // Window manager state
    const [wmState, setWmState] = useState<WindowManagerState>(createInitialWindowManagerState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [maxWindowsModal, setMaxWindowsModal] = useState(false);

    // Managers (stable references)
    const zIndexManagerRef = useRef(new ZIndexManager());
    const positionManagerRef = useRef(new PositionManager());

    // Derived state
    const visibleWindows = useMemo(() => getVisibleWindows(wmState), [wmState]);
    const minimizedWindows = useMemo(() => getMinimizedWindows(wmState), [wmState]);
    const runningCount = wmState.windows.length;

    // ─────────────────────────────────────────────────────────────────────────
    // Window Manager Actions
    // ─────────────────────────────────────────────────────────────────────────

    const dispatch = useCallback((action: Parameters<typeof windowManagerReducer>[1]) => {
        setWmState(prev =>
            windowManagerReducer(
                prev,
                action,
                zIndexManagerRef.current,
                positionManagerRef.current
            )
        );
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Process Registry Helpers
    // ─────────────────────────────────────────────────────────────────────────

    const updateProcessState = useCallback(async (pid: string, state: string) => {
        try {
            await fetch('/api/platform/process-registry', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid, state }),
            });
            console.log(`[AppLauncher] Updated PID ${pid} to ${state}`);
        } catch (e) {
            console.error('[AppLauncher] Failed to update state:', e);
        }
    }, []);

    const registerProcess = useCallback(async (
        pid: string,
        manifest: AppManifest
    ): Promise<boolean> => {
        try {
            const response = await fetch('/api/platform/process-registry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pid,
                    name: manifest.name || manifest.appId,
                    appId: manifest.appId,
                    state: 'RUNNING',
                    source: 'RUNTIME',
                    startedAt: new Date().toISOString(),
                    metadata: {
                        runtime: manifest.runtime,
                        capabilities: manifest.requestedCapabilities,
                    }
                }),
            });
            if (response.ok) {
                console.log('[AppLauncher] Process registered:', pid);
                return true;
            }
            console.warn('[AppLauncher] Failed to register:', await response.text());
            return false;
        } catch (e) {
            console.error('[AppLauncher] Registration error:', e);
            return false;
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Launch App
    // ─────────────────────────────────────────────────────────────────────────

    const launchApp = useCallback(async (appId: string) => {
        // Check max windows limit FIRST
        if (!canLaunchNewWindow(wmState)) {
            console.warn('[AppLauncher] Max windows reached, denying launch');
            setMaxWindowsModal(true);
            // Audit log
            try {
                await fetch('/api/platform/audit-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intent: 'window.launch.denied',
                        reason: 'MAX_CONCURRENT_WINDOWS',
                        appId,
                        limit: WINDOW_CONSTANTS.MAX_CONCURRENT_WINDOWS,
                        currentCount: wmState.windows.length,
                    }),
                });
            } catch { }
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Load manifest
            const manifestResponse = await fetch(`/apps/${appId}/manifest.json`);
            if (!manifestResponse.ok) {
                throw new Error(`Failed to load manifest for ${appId}`);
            }
            const manifest: AppManifest = await manifestResponse.json();

            // Generate unique PID
            const pid = `runtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            // Create worker (currently only calculator supported)
            let worker: Worker | null = null;
            if (appId === 'os.calculator') {
                const { calculatorWorkerCode } = await import('@/apps/os.calculator/worker-bundle');
                const blob = new Blob([calculatorWorkerCode], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                worker = new Worker(workerUrl);
                console.log('[AppLauncher] Worker created, PID:', pid);
            }

            // Register with process registry
            await registerProcess(pid, manifest);

            // Hook worker lifecycle
            if (worker) {
                worker.addEventListener('error', async (error) => {
                    console.error('[AppLauncher] Worker error:', error);
                    await updateProcessState(pid, 'CRASHED');
                });
            }

            // Dispatch LAUNCH action
            dispatch({
                type: 'LAUNCH',
                payload: {
                    id: pid,
                    appId,
                    pid,
                    manifest,
                    worker,
                    size: {
                        width: manifest.defaultWindow?.width || 400,
                        height: manifest.defaultWindow?.height || 500,
                    },
                    launchedAt: Date.now(),
                },
            });

            console.log(`[AppLauncher] Launched ${appId} (PID: ${pid})`);
        } catch (e: any) {
            setError(e.message || 'Failed to launch app');
            console.error('[AppLauncher] Launch error:', e);
        } finally {
            setLoading(false);
        }
    }, [wmState, dispatch, registerProcess, updateProcessState]);

    // ─────────────────────────────────────────────────────────────────────────
    // Window Actions
    // ─────────────────────────────────────────────────────────────────────────

    const focusWindow = useCallback((windowId: string) => {
        console.log('[AppLauncher] Focus window:', windowId);
        dispatch({ type: 'FOCUS', windowId });
    }, [dispatch]);

    const minimizeWindow = useCallback((windowId: string) => {
        console.log('[AppLauncher] Minimize window:', windowId);
        dispatch({ type: 'MINIMIZE', windowId });
    }, [dispatch]);

    const restoreWindow = useCallback((windowId: string) => {
        console.log('[AppLauncher] Restore window:', windowId);
        dispatch({ type: 'RESTORE', windowId });
    }, [dispatch]);

    const closeWindow = useCallback(async (windowId: string) => {
        console.log('[AppLauncher] Close window:', windowId);
        const window = wmState.windows.find(w => w.id === windowId);

        // Update process registry
        if (window?.pid) {
            await updateProcessState(window.pid, 'TERMINATED');
        }

        dispatch({ type: 'CLOSE', windowId });
    }, [wmState.windows, dispatch, updateProcessState]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Launch Controls */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                    onClick={() => launchApp('os.calculator')}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: loading ? '#555' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: 14,
                    }}
                >
                    {loading ? '⏳ Launching...' : '🧮 Launch Calculator'}
                </button>

                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {runningCount} / {WINDOW_CONSTANTS.MAX_CONCURRENT_WINDOWS} apps
                </span>

                {error && (
                    <div style={{
                        padding: '8px 12px',
                        background: '#dc2626',
                        borderRadius: 4,
                        color: 'white',
                        fontSize: 12,
                    }}>
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Taskbar — Running Apps */}
            {runningCount > 0 && (
                <Taskbar
                    windows={wmState.windows}
                    onFocus={focusWindow}
                    onRestore={restoreWindow}
                    onMinimize={minimizeWindow}
                    onClose={closeWindow}
                />
            )}

            {/* App Windows (visible only) */}
            {visibleWindows.map(window => (
                <AppWindow
                    key={window.id}
                    window={window}
                    onFocus={() => focusWindow(window.id)}
                    onMinimize={() => minimizeWindow(window.id)}
                    onClose={() => closeWindow(window.id)}
                />
            ))}

            {/* Max Windows Modal */}
            {maxWindowsModal && (
                <MaxWindowsModal onClose={() => setMaxWindowsModal(false)} />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Taskbar Component
// ═══════════════════════════════════════════════════════════════════════════

interface TaskbarProps {
    windows: WindowState[];
    onFocus: (id: string) => void;
    onRestore: (id: string) => void;
    onMinimize: (id: string) => void;
    onClose: (id: string) => void;
}

function Taskbar({ windows, onFocus, onRestore, onMinimize, onClose }: TaskbarProps) {
    return (
        <div style={{
            padding: 12,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: 8,
            border: '1px solid #334155',
        }}>
            <div style={{
                fontWeight: 'bold',
                marginBottom: 8,
                fontSize: 12,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                📊 Running Apps ({windows.length})
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {windows.map(window => (
                    <TaskbarItem
                        key={window.id}
                        window={window}
                        onFocus={() => window.minimized ? onRestore(window.id) : onFocus(window.id)}
                        onMinimize={() => onMinimize(window.id)}
                        onClose={() => onClose(window.id)}
                    />
                ))}
            </div>
        </div>
    );
}

interface TaskbarItemProps {
    window: WindowState;
    onFocus: () => void;
    onMinimize: () => void;
    onClose: () => void;
}

function TaskbarItem({ window, onFocus, onMinimize, onClose }: TaskbarItemProps) {
    const { manifest, focused, minimized, pid } = window;
    const icon = manifest.defaultWindow?.icon || '📦';

    return (
        <div
            onClick={onFocus}
            style={{
                padding: '8px 12px',
                background: focused
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : minimized
                        ? '#1e293b'
                        : '#334155',
                borderRadius: 6,
                border: focused ? '1px solid #667eea' : '1px solid #475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 120,
                opacity: minimized ? 0.6 : 1,
                transition: 'all 0.15s ease',
            }}
        >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: 12,
                    fontWeight: focused ? 'bold' : 'normal',
                    color: 'white',
                }}>
                    {manifest.name}
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8' }}>
                    {minimized ? '(Minimized)' : `PID: ${pid.slice(-6)}`}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                    style={{
                        background: '#f59e0b',
                        border: 'none',
                        borderRadius: 3,
                        color: 'white',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        fontSize: 9,
                    }}
                    title="Minimize"
                >
                    ─
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: 3,
                        color: 'white',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        fontSize: 9,
                    }}
                    title="Close"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// App Window Component
// ═══════════════════════════════════════════════════════════════════════════

interface AppWindowProps {
    window: WindowState;
    onFocus: () => void;
    onMinimize: () => void;
    onClose: () => void;
}

function AppWindow({ window, onFocus, onMinimize, onClose }: AppWindowProps) {
    const { appId, manifest, worker, focused, zIndex, position, size } = window;
    const { title, icon } = manifest.defaultWindow || {};

    // Render app-specific UI
    const renderUI = () => {
        if (!worker) {
            return <div style={{ padding: 20, color: 'white' }}>Worker not available</div>;
        }

        if (appId === 'os.calculator') {
            const { CalculatorUI } = require('@/apps/os.calculator/ui');
            return <CalculatorUI worker={worker} onClose={onClose} />;
        }

        return (
            <div style={{ padding: 20, color: 'white' }}>
                App UI not found for {appId}
            </div>
        );
    };

    return (
        <div
            onMouseDown={onFocus}
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                width: size.width,
                height: size.height,
                background: '#1e293b',
                border: focused ? '2px solid #667eea' : '1px solid #475569',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: focused
                    ? '0 25px 50px -12px rgba(102, 126, 234, 0.4)'
                    : '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
                zIndex,
                display: 'flex',
                flexDirection: 'column',
                transition: 'border 0.15s ease, box-shadow 0.15s ease',
            }}
        >
            {/* Title Bar */}
            <div
                style={{
                    padding: '8px 12px',
                    background: focused
                        ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(90deg, #334155 0%, #1e293b 100%)',
                    borderBottom: '1px solid #475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 'bold',
                    cursor: 'move',
                }}
            >
                <span>
                    {icon} {title || manifest.name}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                        style={{
                            background: '#f59e0b',
                            border: 'none',
                            borderRadius: 4,
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: 11,
                        }}
                        title="Minimize"
                    >
                        ─
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        style={{
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: 4,
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: 11,
                        }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* App Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {renderUI()}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Max Windows Modal
// ═══════════════════════════════════════════════════════════════════════════

function MaxWindowsModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1e293b',
                    borderRadius: 12,
                    padding: 24,
                    maxWidth: 400,
                    border: '1px solid #475569',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                <div style={{
                    fontSize: 48,
                    textAlign: 'center',
                    marginBottom: 16
                }}>
                    ⚠️
                </div>
                <h2 style={{
                    color: 'white',
                    margin: '0 0 12px 0',
                    textAlign: 'center',
                }}>
                    Maximum Apps Reached
                </h2>
                <p style={{
                    color: '#94a3b8',
                    margin: '0 0 20px 0',
                    textAlign: 'center',
                    fontSize: 14,
                }}>
                    You can only run up to {WINDOW_CONSTANTS.MAX_CONCURRENT_WINDOWS} apps at the same time.
                    Close an app to launch a new one.
                </p>
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: 14,
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
}
