'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SystemHubShell — Tab Navigation Shell (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * State-driven tab navigation for System Hub.
 * Used inside OS Shell window. Pattern: MonitorHubShell.tsx
 *
 * @module coreos/system/ui/SystemHubShell
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { GeneralSettingsView } from './GeneralSettingsView';
import { ConfigurationView } from './ConfigurationView';
import { SecurityView } from './SecurityView';
import { UsersView } from './UsersView';
import { OrganizationView } from './OrganizationView';
import { AppsView } from './AppsView';
import { AboutView } from './AboutView';
import { AppearanceView } from './AppearanceView';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SystemHubTab =
    | 'general'
    | 'configuration'
    | 'security'
    | 'users'
    | 'organization'
    | 'apps'
    | 'appearance'
    | 'about';

const TAB_DEFINITIONS: { id: SystemHubTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'configuration', label: 'Configuration', icon: '🔧' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'organization', label: 'Organization', icon: '🏢' },
    { id: 'apps', label: 'Apps', icon: '🛍️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SystemHubShellProps {
    initialTab?: SystemHubTab;
}

export function SystemHubShell({ initialTab = 'general' }: SystemHubShellProps) {
    const [activeTab, setActiveTab] = useState<SystemHubTab>(initialTab);

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettingsView />;
            case 'configuration': return <ConfigurationView />;
            case 'security': return <SecurityView />;
            case 'users': return <UsersView />;
            case 'organization': return <OrganizationView />;
            case 'apps': return <AppsView />;
            case 'appearance': return <AppearanceView />;
            case 'about': return <AboutView />;
            default: return <GeneralSettingsView />;
        }
    };

    return (
        <div style={s.container}>
            {/* Phase 40A.2: Window-level header (above tabs, like Ops Center) */}
            <header style={s.header}>
                <div>
                    <h1 style={s.title}>🖥️ System Hub</h1>
                    <p style={s.subtitle}>Global configuration for system-wide behavior.</p>
                </div>
            </header>

            {/* Tab Bar */}
            <div style={s.tabBar}>
                {TAB_DEFINITIONS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                ...s.tab,
                                ...(isActive ? s.tabActive : {}),
                            }}
                        >
                            <span style={{ fontSize: 14 }}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={s.content}>
                {renderContent()}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        padding: '16px 20px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
        flexShrink: 0,
    },
    title: {
        margin: 0, fontSize: 18, fontWeight: 600,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        margin: '4px 0 0', fontSize: 12, color: '#94a3b8', letterSpacing: 0.5,
    },
    tabBar: {
        display: 'flex',
        gap: 2,
        padding: '8px 12px 0',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(10px)',
        overflowX: 'auto',
        flexShrink: 0,
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        border: 'none',
        background: 'transparent',
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap' as const,
    },
    tabActive: {
        background: 'rgba(96, 165, 250, 0.1)',
        color: '#60a5fa',
        borderBottom: '2px solid #60a5fa',
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: 20,
    },
};

export default SystemHubShell;
