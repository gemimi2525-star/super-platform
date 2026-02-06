/**
 * App Launcher Component
 * 
 * Launches sandboxed apps via RuntimeHost.
 * Manages window lifecycle and IPC bridge.
 */

'use client';

import { useState } from 'react';
import { runtimeHost } from '@/lib/runtime';
import type { AppManifest } from '@/lib/runtime/types';

interface LaunchedApp {
    appId: string;
    manifest: AppManifest;
    worker: Worker | null;
    windowOpen: boolean;
}

export function AppLauncher() {
    const [launchedApps, setLaunchedApps] = useState<LaunchedApp[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const launchCalculator = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load manifest
            const manifestResponse = await fetch('/apps/os.calculator/manifest.json');
            if (!manifestResponse.ok) {
                throw new Error('Failed to load manifest');
            }
            const manifest: AppManifest = await manifestResponse.json();

            // Spawn runtime via runtimeHost instance
            const result = await runtimeHost.spawn(manifest, false);

            if (!result.success) {
                throw new Error(result.reason || 'Failed to spawn runtime');
            }

            // Get worker from registry
            const runtime = runtimeHost.getRuntime(manifest.appId);
            if (!runtime) {
                throw new Error('Runtime not found in registry');
            }

            setLaunchedApps(prev => [
                ...prev,
                {
                    appId: manifest.appId,
                    manifest,
                    worker: runtime.worker || null,
                    windowOpen: true,
                },
            ]);
        } catch (e: any) {
            setError(e.message || 'Failed to launch app');
            console.error('[AppLauncher] Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const closeApp = (appId: string) => {
        setLaunchedApps(prev =>
            prev.map(app =>
                app.appId === appId
                    ? { ...app, windowOpen: false }
                    : app
            )
        );

        // Terminate worker after a delay
        setTimeout(() => {
            const app = launchedApps.find(a => a.appId === appId);
            if (app?.worker) {
                app.worker.terminate();
            }
            setLaunchedApps(prev => prev.filter(a => a.appId !== appId));
        }, 300);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Launcher Controls */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                    onClick={launchCalculator}
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

            {/* Running Apps */}
            {launchedApps.length > 0 && (
                <div style={{
                    padding: 12,
                    background: '#1e293b',
                    borderRadius: 6,
                    fontSize: 12,
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        Running Apps ({launchedApps.length})
                    </div>
                    {launchedApps.map(app => (
                        <div key={app.appId} style={{
                            padding: '6px 8px',
                            background: '#334155',
                            borderRadius: 4,
                            marginBottom: 4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span>
                                {app.manifest.defaultWindow?.icon} {app.manifest.name}
                            </span>
                            <span style={{ fontSize: 10, opacity: 0.7 }}>
                                {app.appId}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* App Windows */}
            {launchedApps.map(app => (
                app.windowOpen && (
                    <AppWindow
                        key={app.appId}
                        appId={app.appId}
                        manifest={app.manifest}
                        worker={app.worker}
                        onClose={() => closeApp(app.appId)}
                    />
                )
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// App Window Component
// ═══════════════════════════════════════════════════════════════════════════

interface AppWindowProps {
    appId: string;
    manifest: AppManifest;
    worker: Worker | null;
    onClose: () => void;
}

function AppWindow({ appId, manifest, worker, onClose }: AppWindowProps) {
    const { title, icon, width, height } = manifest.defaultWindow || {};

    // Dynamically load UI component based on appId
    const renderUI = () => {
        if (!worker) {
            return <div style={{ padding: 20, color: 'white' }}>Worker not available</div>;
        }

        if (appId === 'os.calculator') {
            // Import CalculatorUI dynamically
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
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: width || 400,
                height: height || 500,
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Title Bar */}
            <div
                style={{
                    padding: '8px 12px',
                    background: 'linear-gradient(90deg, #334155 0%, #1e293b 100%)',
                    borderBottom: '1px solid #475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 'bold',
                }}
            >
                <span>
                    {icon} {title || manifest.name}
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: 4,
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: 11,
                    }}
                >
                    ✕
                </button>
            </div>

            {/* App Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {renderUI()}
            </div>
        </div>
    );
}
