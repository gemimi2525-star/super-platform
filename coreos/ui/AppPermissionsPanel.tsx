
import { useState, useEffect } from 'react';
import { getCapabilityTier } from '@/lib/permissions/tiers';
import type { PermissionGrant } from '@/lib/permissions/types';

// Hardcoded for Phase 17.2 MVP
const KNOWN_APPS = ['os.calculator'];

export function AppPermissionsPanel() {
    const [selectedApp, setSelectedApp] = useState<string>(KNOWN_APPS[0]);
    const [grants, setGrants] = useState<PermissionGrant[]>([]);
    const [loading, setLoading] = useState(false);
    const [restartRequirments, setRestartRequirements] = useState<string[]>([]); // List of appIds needing restart

    const fetchGrants = async (appId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/platform/permissions?appId=${appId}`);
            const data = await res.json();
            if (data.success) {
                setGrants(data.grants);
            }
        } catch (e) {
            console.error('Failed to fetch grants:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedApp) {
            fetchGrants(selectedApp);
        }
    }, [selectedApp]);

    const handleToggle = async (grant: PermissionGrant) => {
        const newValue = !grant.granted;

        // Optimistic update
        setGrants(prev => prev.map(g =>
            g.capability === grant.capability ? { ...g, granted: newValue } : g
        ));

        try {
            await fetch('/api/platform/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: grant.appId,
                    capability: grant.capability,
                    granted: newValue,
                    traceId: `trace-${Date.now()}`,
                })
            });

            // If revoking, mark restart required
            if (!newValue && !restartRequirments.includes(grant.appId)) {
                setRestartRequirements(prev => [...prev, grant.appId]);
            }
        } catch (e) {
            console.error('Failed to update permission:', e);
            // Revert on error
            fetchGrants(selectedApp);
        }
    };

    const handleRestartApp = async (appId: string) => {
        // In a real implementation this would kill the worker.
        // For MVP we just clear the warning and maybe notify user to close the window.
        alert(`Please manually close and reopen ${appId} for changes to take effect.`);
        setRestartRequirements(prev => prev.filter(id => id !== appId));
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24 }}>
            {/* Sidebar: App List */}
            <div style={{
                background: '#f8fafc',
                borderRadius: 8,
                padding: 16,
                border: '1px solid #e2e8f0'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#64748b', textTransform: 'uppercase' }}>
                    Applications
                </h3>
                {KNOWN_APPS.map(appId => (
                    <div
                        key={appId}
                        onClick={() => setSelectedApp(appId)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            background: selectedApp === appId ? 'white' : 'transparent',
                            boxShadow: selectedApp === appId ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: selectedApp === appId ? 600 : 400,
                            color: selectedApp === appId ? '#0f172a' : '#64748b',
                        }}
                    >
                        {appId}
                    </div>
                ))}
            </div>

            {/* Main Content: Permissions */}
            <div>
                {restartRequirments.includes(selectedApp) && (
                    <div style={{
                        padding: 12,
                        marginBottom: 16,
                        background: '#fff7ed',
                        border: '1px solid #fdba74',
                        borderRadius: 6,
                        color: '#c2410c',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>⚠️ Restart required for changes to take effect.</span>
                        <button
                            onClick={() => handleRestartApp(selectedApp)}
                            style={{
                                background: '#c2410c',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600
                            }}
                        >
                            Restart App
                        </button>
                    </div>
                )}

                <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>
                    {selectedApp} Permissions
                </h2>

                {loading ? (
                    <div>Loading...</div>
                ) : grants.length === 0 ? (
                    <div style={{ color: '#64748b' }}>No permissions configured for this app. Launch it first.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {grants.map(grant => {
                            const tier = getCapabilityTier(grant.capability as any);
                            return (
                                <div key={grant.capability} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 16,
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                background:
                                                    tier === 'SAFE' ? '#10b981' :
                                                        tier === 'STANDARD' ? '#3b82f6' :
                                                            tier === 'DANGEROUS' ? '#f59e0b' : '#ef4444',
                                                color: 'white'
                                            }}>
                                                {tier}
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{grant.capability}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>
                                            Last updated: {new Date(grant.timestamp).toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: grant.granted ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                            {grant.granted ? 'ALLOWED' : 'DENIED'}
                                        </span>
                                        {tier !== 'SAFE' && tier !== 'CRITICAL' && (
                                            <button
                                                onClick={() => handleToggle(grant)}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: '1px solid #cbd5e1',
                                                    background: 'white',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                }}
                                            >
                                                {grant.granted ? 'Revoke' : 'Grant'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
