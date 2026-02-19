'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GeneralSettingsView — System Hub Tab (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Appearance + Language settings.
 * Shared between OS Shell window and /system route.
 *
 * @module coreos/system/ui/GeneralSettingsView
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';

interface GeneralSettingsViewProps {
    compact?: boolean;
}

export function GeneralSettingsView({ compact }: GeneralSettingsViewProps) {
    const [language, setLanguage] = useState(() => {
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
            return match?.[1] || 'en';
        }
        return 'en';
    });

    const handleLanguageChange = useCallback((newLang: string) => {
        if (newLang === language) return;
        document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();
    }, [language]);

    return (
        <div>
            {/* Phase 40A.1: Page header */}
            <div style={s.pageHeader}>
                <h2 style={s.pageTitle}>System Hub</h2>
                <p style={s.pageSubtitle}>Global configuration for system-wide behavior.</p>
                <div style={s.pageDivider} />
            </div>

            {/* Appearance */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🎨</span>
                    <h3 style={s.sectionTitle}>Appearance</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Theme</div>
                            <div style={s.desc}>Choose your preferred color scheme</div>
                        </div>
                        <div style={s.valuePill}>Auto (System)</div>
                    </div>
                </div>
            </div>

            {/* Language */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <h3 style={s.sectionTitle}>Language & Region</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Display Language</div>
                            <div style={s.desc}>Interface language for menus and dialogs</div>
                        </div>
                        <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            style={s.select}
                        >
                            <option value="en">English</option>
                            <option value="th">ไทย</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    pageHeader: { marginBottom: 24 },
    pageTitle: {
        margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    pageSubtitle: {
        margin: '4px 0 0', fontSize: 13, color: 'rgba(255, 255, 255, 0.5)',
    },
    pageDivider: {
        marginTop: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    section: { marginBottom: 28 },
    sectionHeader: {
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    },
    sectionTitle: {
        margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0',
    },
    card: {
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.08)',
        overflow: 'hidden',
    },
    row: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    label: { fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 },
    desc: { fontSize: 11, color: '#94a3b8' },
    valuePill: {
        fontSize: 12, color: '#94a3b8', fontWeight: 500,
        background: 'rgba(148, 163, 184, 0.08)',
        padding: '4px 12px', borderRadius: 6,
    },
    select: {
        padding: '6px 12px', border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 6, fontSize: 13, cursor: 'pointer',
        background: 'rgba(30, 41, 59, 0.8)', color: '#e2e8f0',
    },
};
