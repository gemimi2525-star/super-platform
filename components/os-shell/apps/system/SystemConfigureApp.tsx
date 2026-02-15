/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM CONFIGURE APP — Main Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * OS-level control plane for system-wide configuration.
 * All actions require step-up authentication + governance approval.
 * 
 * @module components/os-shell/apps/system/SystemConfigureApp
 * @version 1.0.0 — Phase XIII
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { AppProps } from '../registry';
import { tokens } from '../../tokens';
import { addDecisionLog } from '../../system-log';
import { useStepUpAuth } from '@/governance/synapse/stepup';
import { MigrationBanner } from '@/coreos/system/ui/MigrationBanner';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SystemMode = 'normal' | 'maintenance' | 'read-only';
type FeatureToggle = 'enabled' | 'disabled';

interface SystemConfig {
    systemMode: SystemMode;
    securityFlags: {
        enforceStepUp: boolean;
        enforceAuditLog: boolean;
        strictValidation: boolean;
    };
    featureToggles: {
        virtualSpaces: FeatureToggle;
        advancedSearch: FeatureToggle;
        realTimeSync: FeatureToggle;
    };
    governanceVisibility: {
        showDecisionLogs: boolean;
        showCorrelationIds: boolean;
        showReasonChains: boolean;
    };
    emergencyControls: {
        softDisable: boolean;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION PANEL
// ═══════════════════════════════════════════════════════════════════════════

interface SectionPanelProps {
    title: string;
    icon: string;
    children: React.ReactNode;
}

function SectionPanel({ title, icon, children }: SectionPanelProps) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '2px solid #eee',
            }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
            </div>
            <div style={{ paddingLeft: 28 }}>
                {children}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG ROW
// ═══════════════════════════════════════════════════════════════════════════

interface ConfigRowProps {
    label: string;
    description?: string;
    critical?: boolean;
    children: React.ReactNode;
}

function ConfigRow({ label, description, critical, children }: ConfigRowProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid #f5f5f5',
            background: critical ? 'rgba(255, 95, 87, 0.05)' : 'transparent',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    {label}
                    {critical && <span style={{ fontSize: 12, color: '#dc2626' }}>⚠️ Critical</span>}
                </div>
                {description && (
                    <div style={{ fontSize: 12, color: '#888' }}>
                        {description}
                    </div>
                )}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOGGLE SWITCH
// ═══════════════════════════════════════════════════════════════════════════

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: checked ? '#22c55e' : '#ddd',
                position: 'relative',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 2,
                left: checked ? 22 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SystemConfigureApp({ windowId, capabilityId, isFocused }: AppProps) {
    const { requireStepUp, isVerified } = useStepUpAuth();

    // System config state (in production, this would be from API/store)
    const [config, setConfig] = useState<SystemConfig>({
        systemMode: 'normal',
        securityFlags: {
            enforceStepUp: true,
            enforceAuditLog: true,
            strictValidation: true,
        },
        featureToggles: {
            virtualSpaces: 'disabled',
            advancedSearch: 'enabled',
            realTimeSync: 'enabled',
        },
        governanceVisibility: {
            showDecisionLogs: true,
            showCorrelationIds: true,
            showReasonChains: true,
        },
        emergencyControls: {
            softDisable: false,
        },
    });

    // Log view
    React.useEffect(() => {
        addDecisionLog({
            timestamp: Date.now(),
            action: 'system.configure.view',
            capabilityId: 'system.configure',
            decision: 'ALLOW',
            reasonChain: ['Owner accessed system configuration'],
        });
    }, []);

    // Handle system mode change
    const handleSystemModeChange = useCallback((newMode: SystemMode) => {
        const verified = requireStepUp({
            action: `change system mode to ${newMode}`,
            capabilityId: 'system.configure',
            onSuccess: () => {
                const oldMode = config.systemMode;
                setConfig({ ...config, systemMode: newMode });

                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'system.configure.mode',
                    capabilityId: 'system.configure',
                    decision: 'ALLOW',
                    reasonChain: [`System mode changed from ${oldMode} to ${newMode}`],
                });
            },
        });

        if (verified) {
            const oldMode = config.systemMode;
            setConfig({ ...config, systemMode: newMode });

            addDecisionLog({
                timestamp: Date.now(),
                action: 'system.configure.mode',
                capabilityId: 'system.configure',
                decision: 'ALLOW',
                reasonChain: [`System mode changed from ${oldMode} to ${newMode}`],
            });
        }
    }, [config, requireStepUp]);

    // Handle security flag change
    const handleSecurityFlagChange = useCallback((flag: keyof SystemConfig['securityFlags'], value: boolean) => {
        const verified = requireStepUp({
            action: `toggle security flag: ${flag}`,
            capabilityId: 'system.configure',
            onSuccess: () => {
                setConfig({
                    ...config,
                    securityFlags: { ...config.securityFlags, [flag]: value },
                });

                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'system.configure.security',
                    capabilityId: 'system.configure',
                    decision: 'ALLOW',
                    reasonChain: [`Security flag ${flag} set to ${value}`],
                });
            },
        });

        if (verified) {
            setConfig({
                ...config,
                securityFlags: { ...config.securityFlags, [flag]: value },
            });

            addDecisionLog({
                timestamp: Date.now(),
                action: 'system.configure.security',
                capabilityId: 'system.configure',
                decision: 'ALLOW',
                reasonChain: [`Security flag ${flag} set to ${value}`],
            });
        }
    }, [config, requireStepUp]);

    // Handle feature toggle
    const handleFeatureToggle = useCallback((feature: keyof SystemConfig['featureToggles'], value: FeatureToggle) => {
        const verified = requireStepUp({
            action: `toggle feature: ${feature}`,
            capabilityId: 'system.configure',
            onSuccess: () => {
                setConfig({
                    ...config,
                    featureToggles: { ...config.featureToggles, [feature]: value },
                });

                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'system.configure.features',
                    capabilityId: 'system.configure',
                    decision: 'ALLOW',
                    reasonChain: [`Feature ${feature} set to ${value}`],
                });
            },
        });

        if (verified) {
            setConfig({
                ...config,
                featureToggles: { ...config.featureToggles, [feature]: value },
            });

            addDecisionLog({
                timestamp: Date.now(),
                action: 'system.configure.features',
                capabilityId: 'system.configure',
                decision: 'ALLOW',
                reasonChain: [`Feature ${feature} set to ${value}`],
            });
        }
    }, [config, requireStepUp]);

    // Handle emergency control
    const handleEmergencyControl = useCallback((value: boolean) => {
        const verified = requireStepUp({
            action: value ? 'enable soft disable' : 'disable soft disable',
            capabilityId: 'system.configure',
            onSuccess: () => {
                setConfig({
                    ...config,
                    emergencyControls: { softDisable: value },
                });

                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'system.configure.emergency',
                    capabilityId: 'system.configure',
                    decision: 'ALLOW',
                    reasonChain: [`Emergency soft disable set to ${value}`],
                });
            },
        });

        if (verified) {
            setConfig({
                ...config,
                emergencyControls: { softDisable: value },
            });

            addDecisionLog({
                timestamp: Date.now(),
                action: 'system.configure.emergency',
                capabilityId: 'system.configure',
                decision: 'ALLOW',
                reasonChain: [`Emergency soft disable set to ${value}`],
            });
        }
    }, [config, requireStepUp]);

    return (
        <div style={{
            height: '100%',
            fontFamily: tokens.fontFamily,
            padding: 32,
            overflow: 'auto',
        }}>
            {/* Phase 27A: Migration Banner */}
            <MigrationBanner hubTab="configuration" hubLabel="System Configuration" />

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                    ⚙️ System Configuration
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#888' }}>
                    OS-level control plane • Step-up required for all changes
                </p>
            </div>

            {/* Warning Banner */}
            <div style={{
                padding: 16,
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: 8,
                marginBottom: 24,
                fontSize: 13,
                color: '#856404',
            }}>
                ⚠️ <strong>Critical System Settings</strong> — All changes are audited and require step-up authentication
            </div>

            {/* System Mode */}
            <SectionPanel title="System Mode" icon="🔧">
                <ConfigRow
                    label="Operating Mode"
                    description="Controls system-wide behavior and access permissions"
                    critical
                >
                    <select
                        value={config.systemMode}
                        onChange={(e) => handleSystemModeChange(e.target.value as SystemMode)}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="normal">Normal</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="read-only">Read-Only</option>
                    </select>
                </ConfigRow>
            </SectionPanel>

            {/* Security Flags */}
            <SectionPanel title="Global Security" icon="🔐">
                <ConfigRow
                    label="Enforce Step-up Authentication"
                    description="Require step-up for all sensitive operations"
                    critical
                >
                    <ToggleSwitch
                        checked={config.securityFlags.enforceStepUp}
                        onChange={(v) => handleSecurityFlagChange('enforceStepUp', v)}
                    />
                </ConfigRow>
                <ConfigRow
                    label="Enforce Audit Logging"
                    description="Log all governance decisions"
                    critical
                >
                    <ToggleSwitch
                        checked={config.securityFlags.enforceAuditLog}
                        onChange={(v) => handleSecurityFlagChange('enforceAuditLog', v)}
                    />
                </ConfigRow>
                <ConfigRow
                    label="Strict Validation"
                    description="Enable strict manifest and schema validation"
                >
                    <ToggleSwitch
                        checked={config.securityFlags.strictValidation}
                        onChange={(v) => handleSecurityFlagChange('strictValidation', v)}
                    />
                </ConfigRow>
            </SectionPanel>

            {/* Feature Toggles */}
            <SectionPanel title="Feature Toggles" icon="🎛️">
                <ConfigRow
                    label="Virtual Spaces"
                    description="Enable experimental virtual workspace feature"
                >
                    <select
                        value={config.featureToggles.virtualSpaces}
                        onChange={(e) => handleFeatureToggle('virtualSpaces', e.target.value as FeatureToggle)}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </ConfigRow>
                <ConfigRow
                    label="Advanced Search"
                    description="Enable advanced search capabilities"
                >
                    <select
                        value={config.featureToggles.advancedSearch}
                        onChange={(e) => handleFeatureToggle('advancedSearch', e.target.value as FeatureToggle)}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </ConfigRow>
                <ConfigRow
                    label="Real-time Sync"
                    description="Enable real-time data synchronization"
                >
                    <select
                        value={config.featureToggles.realTimeSync}
                        onChange={(e) => handleFeatureToggle('realTimeSync', e.target.value as FeatureToggle)}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </ConfigRow>
            </SectionPanel>

            {/* Governance Visibility */}
            <SectionPanel title="Governance Visibility" icon="👁️">
                <ConfigRow
                    label="Show Decision Logs"
                    description="Display governance decision logs in audit app"
                >
                    <ToggleSwitch
                        checked={config.governanceVisibility.showDecisionLogs}
                        onChange={(v) => setConfig({
                            ...config,
                            governanceVisibility: { ...config.governanceVisibility, showDecisionLogs: v }
                        })}
                    />
                </ConfigRow>
                <ConfigRow
                    label="Show Correlation IDs"
                    description="Display correlation IDs for tracing"
                >
                    <ToggleSwitch
                        checked={config.governanceVisibility.showCorrelationIds}
                        onChange={(v) => setConfig({
                            ...config,
                            governanceVisibility: { ...config.governanceVisibility, showCorrelationIds: v }
                        })}
                    />
                </ConfigRow>
                <ConfigRow
                    label="Show Reason Chains"
                    description="Display full decision reason chains"
                >
                    <ToggleSwitch
                        checked={config.governanceVisibility.showReasonChains}
                        onChange={(v) => setConfig({
                            ...config,
                            governanceVisibility: { ...config.governanceVisibility, showReasonChains: v }
                        })}
                    />
                </ConfigRow>
            </SectionPanel>

            {/* Emergency Controls */}
            <SectionPanel title="Emergency Controls" icon="🚨">
                <ConfigRow
                    label="Soft Disable"
                    description="Gracefully disable new operations while allowing existing ones to complete"
                    critical
                >
                    <ToggleSwitch
                        checked={config.emergencyControls.softDisable}
                        onChange={handleEmergencyControl}
                    />
                </ConfigRow>
            </SectionPanel>

            {/* Status Footer */}
            <div style={{
                marginTop: 32,
                padding: 16,
                background: '#f8f8f8',
                borderRadius: 8,
                fontSize: 12,
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <div>
                    <strong>Step-up Status:</strong> {isVerified ? '✓ Verified' : '✗ Not verified'}
                </div>
                <div>
                    <strong>System Mode:</strong> {config.systemMode}
                </div>
            </div>
        </div>
    );
}
