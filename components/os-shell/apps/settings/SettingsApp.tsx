/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SETTINGS APP — System Preferences
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * System settings app with basic preferences.
 * MVP includes: Appearance, Language, Security (Step-up status)
 * 
 * Phase 9: Added persona-aware sections & NEXUS tokens
 * 
 * @module components/os-shell/apps/settings/SettingsApp
 * @version 2.0.0 (Phase 9)
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import '@/styles/nexus-tokens.css';
import type { AppProps } from '../registry';
import { addDecisionLog } from '../../system-log';
import { useStepUpAuth } from '@/governance/synapse/stepup';
import { useSecurityContext } from '@/governance/synapse';
import { roleHasAccess, type UserRole } from '../manifest';
import { useTranslations } from '@/lib/i18n/context';

// Naming Constants (from coreos/naming.ts)
import {
    SYSTEM_KERNEL_NAME,
    SYSTEM_SHELL_NAME,
    SYSTEM_WINDOW_SYSTEM_NAME,
    SYSTEM_STACK_LABEL,
} from '@/coreos/naming';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SettingsSection = 'general' | 'security' | 'about' | 'admin' | 'system';

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
    const t = useTranslations('os');
    const { session, isVerified, remainingTime, clear } = useStepUpAuth();

    // Read current locale from cookie on mount
    const [language, setLanguage] = useState(() => {
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
            return match?.[1] || 'en';
        }
        return 'en';
    });

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
        if (newLang === language) return;

        // Persist cookie (same pattern as LanguageDropdown.tsx)
        document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;

        addDecisionLog({
            timestamp: Date.now(),
            action: 'settings.update.language',
            capabilityId: 'core.settings',
            decision: 'ALLOW',
            reasonChain: [`Language changed to ${newLang}`],
        });

        // Full reload to re-render server-side layout with new locale
        window.location.reload();
    }, [language]);

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

    // Phase 9: Persona-aware sections
    const { role } = useSecurityContext();
    const userRole = (role || 'user') as UserRole;

    // Define sections with persona gating
    const allSections = useMemo(() => [
        { id: 'general' as const, label: t('settings.general'), icon: '⚙️', minRole: 'user' as UserRole },
        { id: 'security' as const, label: t('settings.security'), icon: '🔒', minRole: 'user' as UserRole },
        { id: 'admin' as const, label: t('settings.admin'), icon: '🛡️', minRole: 'admin' as UserRole },
        { id: 'system' as const, label: t('settings.system'), icon: '🔧', minRole: 'owner' as UserRole },
        { id: 'about' as const, label: t('settings.about'), icon: 'ℹ️', minRole: 'user' as UserRole },
    ], [t]);

    const visibleSections = useMemo(() =>
        allSections.filter(s => roleHasAccess(userRole, s.minRole)),
        [allSections, userRole]
    );

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            fontFamily: 'var(--nx-font-system)',
            background: 'var(--nx-surface-window)',
        }}>
            {/* Sidebar */}
            <div style={{
                width: 200,
                background: 'var(--nx-surface-panel)',
                borderRight: '1px solid var(--nx-border-divider)',
                padding: 'var(--nx-space-5) 0',
            }}>
                <div style={{ padding: '0 var(--nx-space-4)', marginBottom: 'var(--nx-space-5)' }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: 'var(--nx-text-title)',
                        fontWeight: 'var(--nx-weight-semibold)',
                        color: 'var(--nx-text-primary)',
                    }}>
                        ⚙️ {t('settings.title')}
                    </h2>
                </div>

                {visibleSections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                            width: '100%',
                            padding: 'var(--nx-space-2) var(--nx-space-4)',
                            background: activeSection === section.id ? 'var(--nx-surface-window)' : 'transparent',
                            border: 'none',
                            borderLeft: activeSection === section.id ? '3px solid var(--nx-accent)' : '3px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 'var(--nx-text-body)',
                            color: activeSection === section.id ? 'var(--nx-text-primary)' : 'var(--nx-text-secondary)',
                            fontWeight: activeSection === section.id ? 'var(--nx-weight-medium)' : 'var(--nx-weight-regular)',
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
                        <SettingsPanel title={t('settings.appearance')} icon="🎨">
                            <SettingRow
                                label={t('settings.theme')}
                                description={t('settings.themeDesc')}
                            >
                                <div style={{ fontSize: 13, color: '#888' }}>
                                    {t('settings.themeAuto')}
                                </div>
                            </SettingRow>
                        </SettingsPanel>

                        <SettingsPanel title={t('settings.language')} icon="🌐">
                            <SettingRow
                                label={t('settings.displayLanguage')}
                                description={t('settings.displayLanguageDesc')}
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
                        <SettingsPanel title={t('settings.stepUpAuth')} icon="🔐">
                            <SettingRow
                                label={t('settings.status')}
                                description={t('settings.statusDesc')}
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
                    <AboutSection />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT SECTION (macOS-like, Micro-Polished)
// ═══════════════════════════════════════════════════════════════════════════

function AboutSection() {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [buildInfo, setBuildInfo] = useState<{
        commit?: string;
        branch?: string;
        buildTime?: string;
        environment?: string;
        version?: string;
    } | null>(null);

    // Fetch build info on mount
    useEffect(() => {
        fetch('/api/build-info')
            .then(r => r.json())
            .then(setBuildInfo)
            .catch(() => setBuildInfo({ commit: 'unavailable', version: 'unknown' }));
    }, []);

    const systemFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
    const monoFont = 'SF Mono, Monaco, Consolas, monospace';

    return (
        <div style={{ fontFamily: systemFont }}>
            {/* Hero Section */}
            <div style={{
                textAlign: 'center',
                marginBottom: 32,
                padding: '24px 0',
            }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖥️</div>
                <h2 style={{
                    margin: '0 0 6px',
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#1a1a1a',
                    letterSpacing: '-0.2px',
                }}>
                    APICOREDATA Client OS
                </h2>
                <div style={{
                    fontSize: 13,
                    color: '#888',
                    fontWeight: 400,
                }}>
                    {buildInfo?.version ? `v${buildInfo.version}` : 'Phase 7.1'} — Window System
                </div>
                {buildInfo?.commit && buildInfo.commit !== 'local' && buildInfo.commit !== 'unavailable' && (
                    <div style={{
                        fontSize: 11,
                        color: '#aaa',
                        fontFamily: monoFont,
                        marginTop: 4,
                    }}>
                        {buildInfo.commit.slice(0, 7)}
                    </div>
                )}
            </div>

            {/* Architecture Stack (Compact Table) */}
            <div style={{
                background: '#fafafa',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                marginBottom: 24,
            }}>
                <div style={{
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                }}>
                    Architecture Stack
                </div>
                {[
                    { layer: 'Shell', name: SYSTEM_SHELL_NAME },
                    { layer: 'Window System', name: SYSTEM_WINDOW_SYSTEM_NAME },
                    { layer: 'Kernel', name: SYSTEM_KERNEL_NAME },
                ].map((row, i, arr) => (
                    <div
                        key={row.name}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 16px',
                            borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        }}
                    >
                        <span style={{
                            fontSize: 13,
                            color: '#555',
                            fontWeight: 400,
                        }}>
                            {row.layer}
                        </span>
                        <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: monoFont,
                            color: '#1a1a1a',
                            background: 'rgba(0,0,0,0.04)',
                            padding: '3px 10px',
                            borderRadius: 5,
                        }}>
                            {row.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Governance Status */}
            <div style={{
                background: '#fafafa',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                marginBottom: 24,
            }}>
                <div style={{
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                }}>
                    Governance
                </div>
                {[
                    { label: 'Consistency Gate', status: 'Active' },
                    { label: 'Audit Logging', status: 'Enabled' },
                ].map((item, i, arr) => (
                    <div
                        key={item.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 16px',
                            borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        }}
                    >
                        <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
                        <span style={{
                            fontSize: 12,
                            color: '#22c55e',
                            fontWeight: 500,
                        }}>
                            ✓ {item.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Advanced (Collapsible) */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#888',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: systemFont,
                }}
            >
                <span>Advanced</span>
                <span style={{
                    transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                }}>
                    ▼
                </span>
            </button>

            {showAdvanced && (
                <div style={{
                    marginTop: 12,
                    padding: 14,
                    background: '#f5f5f5',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: monoFont,
                    color: '#666',
                    lineHeight: 1.6,
                }}>
                    <div>Kernel: {SYSTEM_KERNEL_NAME} v1.0 (FROZEN)</div>
                    <div>Window System: {SYSTEM_WINDOW_SYSTEM_NAME}</div>
                    <div>Shell: {SYSTEM_SHELL_NAME}</div>
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        Commit: {buildInfo?.commit?.slice(0, 7) || 'loading...'}
                    </div>
                    <div>Branch: {buildInfo?.branch || '—'}</div>
                    <div>Build: {buildInfo?.buildTime ? new Date(buildInfo.buildTime).toLocaleString() : '—'}</div>
                    <div>Environment: {buildInfo?.environment || '—'}</div>
                </div>
            )}
        </div>
    );
}
