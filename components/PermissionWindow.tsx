import React from 'react';
import { ShieldAlert, Check, X, Info } from 'lucide-react';
import { useSystemState, useWindowControls } from '@/coreos/react';
import { getKernel, IntentFactory, type Window, type PermissionRequest } from '@/coreos';
import { getCapabilityDescription } from '@/coreos/manifests/descriptions';

interface PermissionWindowProps {
    window: Window;
}

export function PermissionWindow({ window }: PermissionWindowProps) {
    const { close } = useWindowControls(window.id);
    const systemState = useSystemState();

    // In a real implementation, the permission request details would be passed 
    // via window.context or retrieved from a PermissionManager state.
    // For this implementation, we'll assume the contextId contains the encoded request 
    // or we fetch it from a store (omitted for brevity, determining from context).

    // Fallback/Mock data if context missing (for development)
    const capabilityId = window.metadata?.capabilityId as string || 'fs.write';
    const appName = window.metadata?.appName as string || 'Unknown App';
    const requestId = window.metadata?.requestId as string || window.contextId || 'unknown-req';

    const description = getCapabilityDescription(capabilityId);

    const handleAllow = (scope: 'session' | 'persistent_app') => {
        if (!window.correlationId) return; // Should not happen for modal context

        getKernel().emit({
            type: 'GRANT_PERMISSION',
            correlationId: window.correlationId,
            payload: {
                requestId,
                scope,
                capabilityId: capabilityId as any, // Cast for Phase 20 MVP
                appName,
            }
        });
        close();
    };

    const handleDeny = () => {
        if (!window.correlationId) return;

        getKernel().emit({
            type: 'DENY_PERMISSION',
            correlationId: window.correlationId,
            payload: {
                requestId,
            }
        });
        close();
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--nx-glass-background)',
            backdropFilter: 'blur(20px)',
            color: 'var(--nx-text-primary)'
        }}>
            {/* Header */}
            <div style={{
                padding: '24px 24px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'var(--nx-status-warning-bg)',
                    color: 'var(--nx-status-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Permission Required</h2>
                    <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '13px' }}>
                        {appName} is requesting access
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', flex: 1 }}>
                <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                        {capabilityId}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>
                        {description}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Info size={16} style={{ marginTop: '2px', opacity: 0.7 }} />
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.7, lineHeight: 1.5 }}>
                        This action may modify your system state or expose data.
                        Only allow if you trust this application.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <button
                    onClick={handleDeny}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'var(--nx-text-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                    }}
                >
                    Deny
                </button>
                <button
                    onClick={() => handleAllow('session')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--nx-primary)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                    }}
                >
                    Allow Once
                </button>
            </div>
        </div>
    );
}
