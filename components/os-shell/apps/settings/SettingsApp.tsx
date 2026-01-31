/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SETTINGS APP — System Preferences
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * System settings app with basic preferences.
 * MVP includes: Appearance, Language, Security (Step-up status)
 * 
 * @module components/os-shell/apps/settings/SettingsApp
 * @version 1.0.0 — Phase XI
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { AppProps } from '../registry';
import { tokens } from '../../tokens';
import { addDecisionLog } from '../../system-log';
import { useStepUpAuth } from '@/governance/synapse/stepup';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SettingsSection = 'general' | 'security' | 'about';

interface SettingsPanelProps {
    title: string;
    icon: string;
    children: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════════════════

function SettingsPanel({ title, icon, children }: SettingsPanelProps) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #eee',
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
// SETTING ROW
// ═══════════════════════════════════════════════════════════════════════════

interface SettingRowProps {
    label: string;
    description?: string;
    children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid #f5f5f5',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    {label}
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SettingsApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    const [language, setLanguage] = useState('en');
    const { session, isVerified, remainingTime, clear } = useStepUpAuth();

    // Log settings view
    React.useEffect(() => {
        addDecisionLog({
            timestamp: Date.now(),
            action: 'settings.view',
            capabilityId: 'core.settings',
            decision: 'ALLOW',
            reasonChain: ['User viewed settings'],
        });
    }, []);

    const handleLanguageChange = useCallback((newLang: string) => {
        setLanguage(newLang);

        addDecisionLog({
            timestamp: Date.now(),
            action: 'settings.update.language',
            capabilityId: 'core.settings',
            decision: 'ALLOW',
            reasonChain: [`Language changed to ${newLang}`],
        });
    }, []);

    const handleClearStepUp = useCallback(() => {
        clear();

        addDecisionLog({
            timestamp: Date.now(),
            action: 'settings.security.clear_stepup',
            capabilityId: 'core.settings',
            decision: 'ALLOW',
            reasonChain: ['Step-up session cleared manually'],
        });
    }, [clear]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            fontFamily: tokens.fontFamily,
        }}>
            {/* Sidebar */}
            <div style={{
                width: 200,
                background: '#f8f8f8',
                borderRight: '1px solid #eee',
                padding: '20px 0',
            }}>
                <div style={{ padding: '0 16px', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                        ⚙️ Settings
                    </h2>
                </div>

                {[
                    { id: 'general' as const, label: 'General', icon: '⚙️' },
                    { id: 'security' as const, label: 'Security', icon: '🔒' },
                    { id: 'about' as const, label: 'About', icon: 'ℹ️' },
                ].map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: activeSection === section.id ? '#fff' : 'transparent',
                            border: 'none',
                            borderLeft: activeSection === section.id ? '3px solid #007AFF' : '3px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: activeSection === section.id ? '#000' : '#666',
                            fontWeight: activeSection === section.id ? 500 : 400,
                        }}
                    >
                        {section.icon} {section.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                padding: 32,
                overflow: 'auto',
            }}>
                {activeSection === 'general' && (
                    <>
                        <SettingsPanel title="Appearance" icon="🎨">
                            <SettingRow
                                label="Theme"
                                description="Choose light or dark theme"
                            >
                                <div style={{ fontSize: 13, color: '#888' }}>
                                    Auto (System)
                                </div>
                            </SettingRow>
                        </SettingsPanel>

                        <SettingsPanel title="Language" icon="🌐">
                            <SettingRow
                                label="Display Language"
                                description="Choose your preferred language"
                            >
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: 6,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="en">English</option>
                                    <option value="th">ไทย</option>
                                </select>
                            </SettingRow>
                        </SettingsPanel>
                    </>
                )}

                {activeSection === 'security' && (
                    <>
                        <SettingsPanel title="Step-up Authentication" icon="🔐">
                            <SettingRow
                                label="Status"
                                description="Enhanced security for sensitive actions"
                            >
                                {isVerified ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 12,
                                        color: '#22c55e',
                                    }}>
                                        <span>✓ Verified</span>
                                        <span style={{ color: '#888' }}>
                                            ({formatTime(remainingTime)})
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{
                                        fontSize: 12,
                                        color: '#888',
                                    }}>
                                        Not verified
                                    </div>
                                )}
                            </SettingRow>

                            {isVerified && (
                                <SettingRow
                                    label="Clear Session"
                                    description="Manually clear current step-up session"
                                >
                                    <button
                                        onClick={handleClearStepUp}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#fff',
                                            border: '1px solid #ddd',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            color: '#dc2626',
                                        }}
                                    >
                                        Clear Session
                                    </button>
                                </SettingRow>
                            )}
                        </SettingsPanel>
                    </>
                )}

                {activeSection === 'about' && (
                    <>
                        <SettingsPanel title="System Information" icon="💻">
                            <SettingRow label="Platform">
                                <div style={{ fontSize: 13, color: '#666' }}>
                                    Core OS Demo
                                </div>
                            </SettingRow>
                            <SettingRow label="Version">
                                <div style={{ fontSize: 13, color: '#666' }}>
                                    Phase XI — Settings App
                                </div>
                            </SettingRow>
                            <SettingRow label="Kernel">
                                <div style={{ fontSize: 13, color: '#666' }}>
                                    SYNAPSE v1.0 (FROZEN)
                                </div>
                            </SettingRow>
                        </SettingsPanel>

                        <SettingsPanel title="Governance" icon="⚖️">
                            <SettingRow label="Consistency Gate">
                                <div style={{ fontSize: 13, color: '#22c55e' }}>
                                    ✓ Active
                                </div>
                            </SettingRow>
                            <SettingRow label="Audit Logging">
                                <div style={{ fontSize: 13, color: '#22c55e' }}>
                                    ✓ Enabled
                                </div>
                            </SettingRow>
                        </SettingsPanel>
                    </>
                )}
            </div>
        </div>
    );
}
