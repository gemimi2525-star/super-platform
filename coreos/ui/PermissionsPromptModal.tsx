
import { useState, useMemo } from 'react';
import type { AppManifest, Capability } from '@/lib/runtime/types';
import { getCapabilityTier, CAPABILITY_TIER_MAP, DEFAULT_TIER_STATE } from '@/lib/permissions/tiers';
import type { CapabilityTier } from '@/lib/permissions/types';

interface PermissionsPromptModalProps {
    manifest: AppManifest;
    capabilities: Capability[];
    onConfirm: (decisions: Record<Capability, boolean>) => void;
    onCancel: () => void;
}

export function PermissionsPromptModal({ manifest, capabilities, onConfirm, onCancel }: PermissionsPromptModalProps) {
    // Group capabilities by tier
    const tieredCaps = useMemo(() => {
        const groups: Record<CapabilityTier, Capability[]> = {
            SAFE: [],
            STANDARD: [],
            DANGEROUS: [],
            CRITICAL: [],
        };
        capabilities.forEach(cap => {
            const tier = getCapabilityTier(cap);
            groups[tier].push(cap);
        });
        return groups;
    }, [capabilities]);

    // Initialize state based on default tier behavior
    const [decisions, setDecisions] = useState<Record<Capability, boolean>>(() => {
        const initial: Record<Capability, boolean> = {} as any;
        capabilities.forEach(cap => {
            const tier = getCapabilityTier(cap);
            initial[cap] = DEFAULT_TIER_STATE[tier];
        });
        return initial;
    });

    const toggleCapability = (cap: Capability) => {
        const tier = getCapabilityTier(cap);
        if (tier === 'SAFE' || tier === 'CRITICAL') return; // Locked

        setDecisions(prev => ({
            ...prev,
            [cap]: !prev[cap]
        }));
    };

    const handleConfirm = () => {
        onConfirm(decisions);
    };

    // Helper to render a capability row
    const renderRow = (cap: Capability) => {
        const tier = getCapabilityTier(cap);
        const isLocked = tier === 'SAFE' || tier === 'CRITICAL';
        const isChecked = decisions[cap];

        // Color coding
        let badgeColor = '#94a3b8';
        if (tier === 'SAFE') badgeColor = '#10b981'; // Green
        if (tier === 'STANDARD') badgeColor = '#3b82f6'; // Blue
        if (tier === 'DANGEROUS') badgeColor = '#f59e0b'; // Amber
        if (tier === 'CRITICAL') badgeColor = '#ef4444'; // Red

        return (
            <div key={cap} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid #334155',
                background: isChecked ? '#1e293b' : '#0f172a',
                opacity: tier === 'CRITICAL' ? 0.6 : 1,
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: badgeColor,
                            color: 'white'
                        }}>
                            {tier}
                        </span>
                        <span style={{ color: 'white', fontSize: 13, fontFamily: 'monospace' }}>
                            {cap}
                        </span>
                    </div>
                </div>
                <div
                    onClick={() => toggleCapability(cap)}
                    style={{
                        width: 40,
                        height: 20,
                        background: isChecked ? '#10b981' : '#475569',
                        borderRadius: 10,
                        position: 'relative',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        opacity: isLocked && !isChecked ? 0.4 : 1,
                    }}
                >
                    <div style={{
                        width: 16,
                        height: 16,
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: 2,
                        left: isChecked ? 22 : 2,
                        transition: 'left 0.2s',
                    }} />
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
        }}>
            <div style={{
                background: '#1e293b',
                width: 480,
                borderRadius: 12,
                border: '1px solid #475569',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{ padding: 20, borderBottom: '1px solid #475569', background: '#0f172a' }}>
                    <h2 style={{ margin: 0, color: 'white', fontSize: 18 }}>
                        ⚠️ Permission Request
                    </h2>
                    <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: 14 }}>
                        <strong style={{ color: 'white' }}>{manifest.name}</strong> wants to access system capabilities.
                        Review and authorize carefully.
                    </p>
                </div>

                {/* Content */}
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {tieredCaps.CRITICAL.length > 0 && (
                        <>
                            {tieredCaps.CRITICAL.map(renderRow)}
                        </>
                    )}
                    {tieredCaps.DANGEROUS.length > 0 && (
                        <>
                            {tieredCaps.DANGEROUS.map(renderRow)}
                        </>
                    )}
                    {tieredCaps.STANDARD.length > 0 && (
                        <>
                            {tieredCaps.STANDARD.map(renderRow)}
                        </>
                    )}
                    {tieredCaps.SAFE.length > 0 && (
                        <>
                            {tieredCaps.SAFE.map(renderRow)}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div style={{ padding: 20, borderTop: '1px solid #475569', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#0f172a' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 16px',
                            background: 'transparent',
                            border: '1px solid #475569',
                            borderRadius: 6,
                            color: '#94a3b8',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: 6,
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        Allow Selected
                    </button>
                </div>
            </div>
        </div>
    );
}
