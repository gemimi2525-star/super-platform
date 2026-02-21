'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AccessibilityView — System Hub Tab (Phase 22)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS-grade accessibility settings: high contrast, reduced motion, focus ring.
 * All mutations flow through audit API → apply layer → store.
 */

import React, { useCallback } from 'react';
import { useAccessibilityStore } from '@/coreos/accessibility/store';
import type { FocusRingMode } from '@/coreos/accessibility/types';

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

function Toggle({ label, description, enabled, onToggle }: {
    label: string; description: string; enabled: boolean; onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#e2e8f0',
                textAlign: 'left',
            }}
        >
            <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{description}</div>
            </div>
            <div style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: enabled ? 'rgba(96,165,250,0.7)' : 'rgba(255,255,255,0.12)',
                position: 'relative',
                transition: 'background 0.15s ease',
                flexShrink: 0,
                marginLeft: 12,
            }}>
                <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: enabled ? 21 : 3,
                    transition: 'left 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
            </div>
        </button>
    );
}

export function AccessibilityView() {
    const highContrast = useAccessibilityStore(s => s.highContrast);
    const reducedMotion = useAccessibilityStore(s => s.reducedMotion);
    const focusRingMode = useAccessibilityStore(s => s.focusRingMode);
    const setHighContrast = useAccessibilityStore(s => s.setHighContrast);
    const setReducedMotion = useAccessibilityStore(s => s.setReducedMotion);
    const setFocusRing = useAccessibilityStore(s => s.setFocusRing);

    const handleHighContrast = useCallback(async () => {
        const next = !highContrast;
        const traceId = `a11y-hc-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/accessibility/set-high-contrast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: next, traceId }),
            });
            setHighContrast(next);
        } catch (e) { console.error('[A11y] High Contrast error:', e); }
    }, [highContrast, setHighContrast]);

    const handleReducedMotion = useCallback(async () => {
        const next = !reducedMotion;
        const traceId = `a11y-rm-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/accessibility/set-reduced-motion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: next, traceId }),
            });
            setReducedMotion(next);
        } catch (e) { console.error('[A11y] Reduced Motion error:', e); }
    }, [reducedMotion, setReducedMotion]);

    const handleFocusRing = useCallback(async (mode: FocusRingMode) => {
        const traceId = `a11y-fr-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/accessibility/set-focus-ring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, traceId }),
            });
            setFocusRing(mode);
        } catch (e) { console.error('[A11y] Focus Ring error:', e); }
    }, [setFocusRing]);

    const FOCUS_MODES: { mode: FocusRingMode; label: string; desc: string }[] = [
        { mode: 'auto', label: 'Auto', desc: 'Browser default' },
        { mode: 'always', label: 'Always', desc: 'Show on all focus' },
        { mode: 'keyboard-only', label: 'Keyboard Only', desc: 'Show on Tab/keyboard' },
    ];

    return (
        <div>
            {/* Toggles */}
            <Section title="Display">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Toggle
                        label="High Contrast"
                        description="Increase text and border contrast for better visibility"
                        enabled={highContrast}
                        onToggle={handleHighContrast}
                    />
                    <Toggle
                        label="Reduce Motion"
                        description="Minimize animations and transitions"
                        enabled={reducedMotion}
                        onToggle={handleReducedMotion}
                    />
                </div>
            </Section>

            {/* Focus Ring */}
            <Section title="Focus Indicator">
                <div style={{ display: 'flex', gap: 8 }}>
                    {FOCUS_MODES.map(f => (
                        <button
                            key={f.mode}
                            onClick={() => handleFocusRing(f.mode)}
                            aria-pressed={focusRingMode === f.mode}
                            style={{
                                flex: 1,
                                padding: '10px 8px',
                                background: focusRingMode === f.mode ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                                border: focusRingMode === f.mode ? '2px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8,
                                color: focusRingMode === f.mode ? '#60a5fa' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500,
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <span>{f.label}</span>
                            <span style={{ fontSize: 10, opacity: 0.7 }}>{f.desc}</span>
                        </button>
                    ))}
                </div>
            </Section>
        </div>
    );
}

export default AccessibilityView;
