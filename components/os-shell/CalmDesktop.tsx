/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Calm Desktop Background
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * True Calm Desktop — NO text, NO CTA, just ambient wallpaper.
 * 
 * @module components/os-shell/CalmDesktop
 * @version 1.0.0
 */

'use client';

import React from 'react';

export function CalmDesktop() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                zIndex: 0,
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
