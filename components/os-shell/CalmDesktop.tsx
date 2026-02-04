/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Calm Desktop Background
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * True Calm Desktop — NO text, NO CTA, just ambient wallpaper.
 * 
 * Phase 8: Updated to use NEXUS Design Tokens
 * 
 * @module components/os-shell/CalmDesktop
 * @version 2.0.0 (Phase 8)
 */

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';

export function CalmDesktop() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--nx-surface-desktop)',
                zIndex: 'var(--nx-z-desktop)',
            }}
        >
            {/* Ambient gradient overlay - no text, no CTA */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.02) 0%, transparent 40%)',
                }}
            />
        </div>
    );
}
