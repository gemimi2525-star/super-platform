/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — App Unavailable Fallback
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 9.1: Shown when manifest has app but registry component is missing.
 * Read-only, informational display — does not crash.
 * 
 * @module components/os-shell/apps/AppUnavailable
 * @version 1.0.0 (Phase 9.1)
 */

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';
import type { AppProps } from './registry';
import { APP_MANIFESTS } from './manifest';

export function AppUnavailable({ windowId, capabilityId, isFocused }: AppProps) {
    const manifest = APP_MANIFESTS[capabilityId];
    const appName = manifest?.name || capabilityId;
    const appIcon = manifest?.icon || '❓';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--nx-surface-window)',
            color: 'var(--nx-text-primary)',
            fontFamily: 'var(--nx-font-system)',
            padding: 'var(--nx-space-8)',
            textAlign: 'center',
        }}>
            {/* Icon */}
            <div style={{
                fontSize: 64,
                marginBottom: 'var(--nx-space-4)',
                opacity: 0.5,
            }}>
                {appIcon}
            </div>

            {/* Title */}
            <h2 style={{
                fontSize: 'var(--nx-text-title)',
                fontWeight: 'var(--nx-weight-semibold)',
                margin: '0 0 var(--nx-space-2) 0',
                color: 'var(--nx-text-primary)',
            }}>
                App Unavailable
            </h2>

            {/* App Name */}
            <div style={{
                fontSize: 'var(--nx-text-body)',
                color: 'var(--nx-text-secondary)',
                marginBottom: 'var(--nx-space-6)',
            }}>
                <strong>{appName}</strong>
            </div>

            {/* Explanation */}
            <div style={{
                fontSize: 'var(--nx-text-caption)',
                color: 'var(--nx-text-tertiary)',
                maxWidth: 300,
                lineHeight: 'var(--nx-leading-relaxed)',
            }}>
                This app is registered in the manifest but its component
                is not currently available. This may be a temporary issue
                or the app is being updated.
            </div>

            {/* Technical Info (collapsed) */}
            <details style={{
                marginTop: 'var(--nx-space-6)',
                fontSize: 'var(--nx-text-micro)',
                color: 'var(--nx-text-disabled)',
            }}>
                <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
                <div style={{
                    marginTop: 'var(--nx-space-2)',
                    fontFamily: 'var(--nx-font-mono)',
                    background: 'var(--nx-surface-panel)',
                    padding: 'var(--nx-space-2) var(--nx-space-3)',
                    borderRadius: 'var(--nx-radius-sm)',
                }}>
                    <div>App ID: {capabilityId}</div>
                    <div>Window ID: {windowId}</div>
                    {manifest?.version && <div>Version: {manifest.version}</div>}
                </div>
            </details>
        </div>
    );
}
