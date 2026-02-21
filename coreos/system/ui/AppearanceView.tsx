'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AppearanceView — System Hub Tab (Phase 21)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS-grade appearance settings: theme, accent, font scale, wallpaper.
 * All mutations flow through audit API → apply layer → store.
 *
 * @module coreos/system/ui/AppearanceView
 */

import React, { useCallback } from 'react';
import { useAppearanceStore } from '@/coreos/appearance/store';
import {
    type ThemeMode,
    type AccentToken,
    type FontScale,
    ACCENT_COLORS,
    WALLPAPER_PRESETS,
} from '@/coreos/appearance/types';

// ─── Section Component ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#cbd5e1', letterSpacing: 0.5 }}>
                {title}
            </h3>
            {children}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────

export function AppearanceView() {
    const themeMode = useAppearanceStore(s => s.themeMode);
    const accent = useAppearanceStore(s => s.accent);
    const fontScale = useAppearanceStore(s => s.fontScale);
    const wallpaper = useAppearanceStore(s => s.wallpaper);
    const setTheme = useAppearanceStore(s => s.setTheme);
    const setAccent = useAppearanceStore(s => s.setAccent);
    const setFontScale = useAppearanceStore(s => s.setFontScale);
    const setWallpaper = useAppearanceStore(s => s.setWallpaper);

    const handleTheme = useCallback(async (mode: ThemeMode) => {
        const traceId = `ap-th-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/appearance/set-theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeMode: mode, traceId }),
            });
            setTheme(mode);
        } catch (e) { console.error('[Appearance] Theme error:', e); }
    }, [setTheme]);

    const handleAccent = useCallback(async (token: AccentToken) => {
        const traceId = `ap-ac-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/appearance/set-accent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accent: token, traceId }),
            });
            setAccent(token);
        } catch (e) { console.error('[Appearance] Accent error:', e); }
    }, [setAccent]);

    const handleFontScale = useCallback(async (scale: FontScale) => {
        const traceId = `ap-fs-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/appearance/set-font-scale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fontScale: scale, traceId }),
            });
            setFontScale(scale);
        } catch (e) { console.error('[Appearance] FontScale error:', e); }
    }, [setFontScale]);

    const handleWallpaper = useCallback(async (preset: typeof WALLPAPER_PRESETS[number]) => {
        const traceId = `ap-wp-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/appearance/set-wallpaper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallpaper: preset.config, traceId }),
            });
            setWallpaper(preset.config);
        } catch (e) { console.error('[Appearance] Wallpaper error:', e); }
    }, [setWallpaper]);

    const THEMES: { mode: ThemeMode; label: string; icon: string }[] = [
        { mode: 'light', label: 'Light', icon: '☀️' },
        { mode: 'dark', label: 'Dark', icon: '🌙' },
        { mode: 'auto', label: 'Auto', icon: '🔄' },
    ];

    const FONT_SCALES: { scale: FontScale; label: string }[] = [
        { scale: 90, label: 'Small (90%)' },
        { scale: 100, label: 'Default (100%)' },
        { scale: 110, label: 'Large (110%)' },
    ];

    return (
        <div>
            {/* Theme Mode */}
            <Section title="Theme">
                <div style={{ display: 'flex', gap: 8 }}>
                    {THEMES.map(t => (
                        <button
                            key={t.mode}
                            onClick={() => handleTheme(t.mode)}
                            style={{
                                flex: 1,
                                padding: '12px 8px',
                                background: themeMode === t.mode ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                                border: themeMode === t.mode ? '2px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10,
                                color: themeMode === t.mode ? '#60a5fa' : '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 500,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <span style={{ fontSize: 22 }}>{t.icon}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </Section>

            {/* Accent Color */}
            <Section title="Accent Color">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(Object.entries(ACCENT_COLORS) as [AccentToken, typeof ACCENT_COLORS[AccentToken]][]).map(([token, color]) => (
                        <button
                            key={token}
                            onClick={() => handleAccent(token)}
                            title={color.label}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: color.hex,
                                border: accent === token ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                boxShadow: accent === token ? `0 0 12px ${color.hex}60` : 'none',
                                transition: 'all 0.15s ease',
                                position: 'relative',
                            }}
                        >
                            {accent === token && (
                                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 16, color: '#fff' }}>✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Font Scale */}
            <Section title="Text Size">
                <div style={{ display: 'flex', gap: 8 }}>
                    {FONT_SCALES.map(f => (
                        <button
                            key={f.scale}
                            onClick={() => handleFontScale(f.scale)}
                            style={{
                                flex: 1,
                                padding: '10px 8px',
                                background: fontScale === f.scale ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                                border: fontScale === f.scale ? '2px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8,
                                color: fontScale === f.scale ? '#60a5fa' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500,
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Wallpaper */}
            <Section title="Wallpaper">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {WALLPAPER_PRESETS.map(p => {
                        const isActive = wallpaper.value === p.config.value;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleWallpaper(p)}
                                style={{
                                    height: 64,
                                    background: p.config.value,
                                    border: isActive ? '2px solid rgba(96,165,250,0.7)' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <span style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.7)',
                                    fontWeight: 500,
                                }}>
                                    {p.label}
                                </span>
                                {isActive && (
                                    <span style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 6,
                                        fontSize: 12,
                                        color: '#60a5fa',
                                    }}>✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Section>
        </div>
    );
}

export default AppearanceView;
