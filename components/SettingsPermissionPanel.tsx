import React, { useState, useEffect } from 'react';
import { Shield, Trash2, RefreshCw } from 'lucide-react';
import { getKernel } from '@/coreos'; // Ensure getKernel is imported
import { createCorrelationId } from '@/coreos/types';

// We need a way to fetch permissions. Since store is internal, we might 
// need an exposed method or just import for this system app.
// In a real OS, this would be an IPC call. For now, we'll direct import carefully.
import { permissionStore } from '@/coreos/permissions/store';
import { PermissionManifest, CapabilityId } from '@/coreos/manifests/types';
import { AIExplanationPanel } from './AIExplanationPanel'; // Phase 26.1
import { AIAssistPanel } from './AIAssistPanel'; // Phase 26.2A
import { toolRegistry } from '@/coreos/brain/registry'; // Phase 26.2B

export function SettingsPermissionPanel() {
    // Phase 20: Permission Management UI
    const [permissions, setPermissions] = useState<PermissionManifest[]>(permissionStore.getAll());
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [explainingPerm, setExplainingPerm] = useState<{ appName: string, capabilityId: string } | null>(null);
    const [assisting, setAssisting] = useState(false); // Phase 26.2A

    const refresh = () => {
        setPermissions(permissionStore.getAll());
        setRefreshTrigger(prev => prev + 1);
    };

    // Auto-refresh when mounted
    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 2000); // Poll for updates
        return () => clearInterval(interval);
    }, []);

    const handleRevoke = (appName: string, capabilityId: string) => {
        // Emit Revoke Intent
        getKernel().emit({
            type: 'REVOKE_PERMISSION',
            correlationId: createCorrelationId(),
            payload: {
                appName,
                capabilityId: capabilityId as any
            }
        });

        // Optimistic update
        setTimeout(refresh, 100);
    };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={18} />
                    App Permissions
                </h3>
                <button
                    onClick={refresh}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Phase 26.2A/B: AI Assist Button */}
            <div style={{ paddingBottom: 16 }}>
                <button
                    onClick={() => setAssisting(!assisting)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #007AFF',
                        background: 'white',
                        color: '#007AFF',
                        cursor: 'pointer',
                        fontSize: 13
                    }}
                >
                    ✨ Suggest Fixes
                </button>
            </div>

            {/* AI Assist Panel (Phase 26.2A/B) */}
            {assisting && (
                <div style={{ marginBottom: 20 }}>
                    <AIAssistPanel
                        appId="core.settings"
                        title="Permission Audit"
                        prompt="Scanning for unused permissions... (Simulated)"
                        contextParams={{ totalPerms: permissions.length }}
                        onClose={() => setAssisting(false)}
                        onApproveAction={async (action) => {
                            console.log(`[Settings] User Approved: ${action.description}`);

                            if (action.type === 'revoke') {
                                try {
                                    // Phase 26.2B: Real Execution
                                    await toolRegistry.executeTool('execute_revoke_permission', {
                                        appName: action.payload.app,
                                        capabilityId: action.payload.perm
                                    }, {
                                        appId: 'core.settings',
                                        correlationId: `exec-${Date.now()}`,
                                        userId: 'user-approved'
                                    });
                                    // Refresh permissions list
                                    refresh();
                                } catch (e) {
                                    console.error('Execution Failed:', e);
                                }
                            }
                        }}
                    />
                </div>
            )}

            {/* AI Explanation Area */}
            {explainingPerm && (
                <div style={{ marginBottom: 20 }}>
                    <AIExplanationPanel
                        appId={explainingPerm.appName}
                        title={`AI Insight: ${explainingPerm.capabilityId}`}
                        prompt={`Explain the security risks of the capability '${explainingPerm.capabilityId}' for the app '${explainingPerm.appName}'. Be concise.`}
                        contextParams={{ permission: explainingPerm.capabilityId }}
                        onClose={() => setExplainingPerm(null)}
                    />
                </div>
            )}

            {permissions.length === 0 ? (
                <div style={{
                    padding: 40,
                    textAlign: 'center',
                    color: '#888',
                    background: '#f5f5f5',
                    borderRadius: 8
                }}>
                    No permissions granted.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {permissions.map((perm, idx) => (
                        <div key={`${perm.appName}-${perm.capabilityId}-${idx}`} style={{
                            padding: 16,
                            background: 'white',
                            borderRadius: 8,
                            border: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{perm.appName}</div>
                                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                                    {perm.capabilityId}
                                </div>
                                <div style={{
                                    fontSize: 11,
                                    color: perm.scope === 'session' ? '#e67e22' : '#27ae60',
                                    marginTop: 4,
                                    fontWeight: 500,
                                    textTransform: 'uppercase'
                                }}>
                                    {perm.scope.replace('_', ' ')}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {/* Explain Button (Shadow AI) */}
                                <button
                                    onClick={() => setExplainingPerm({ appName: perm.appName, capabilityId: perm.capabilityId })}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: 6,
                                        border: '1px solid #e0e0e0',
                                        background: '#fff',
                                        color: '#666',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                    title="Ask AI to explain this permission"
                                >
                                    ✨ Explain
                                </button>

                                <button
                                    onClick={() => handleRevoke(perm.appName, perm.capabilityId)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: 6,
                                        border: '1px solid #fee',
                                        background: '#fff5f5',
                                        color: '#c0392b',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 12
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Revoke
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
