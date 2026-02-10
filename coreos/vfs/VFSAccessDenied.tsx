/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS ACCESS DENIED — Calm-First UX (Phase 16B)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Standard UX component shown when an app's VFS operation is denied.
 * 
 * Design principles:
 * - Deterministic, non-alarming message
 * - Does NOT leak path, scheme, or system info
 * - Consistent across all apps
 * - Uses NEXUS design tokens
 * 
 * @module coreos/vfs/VFSAccessDenied
 * @version 1.0.0 (Phase 16B)
 */

'use client';

import React from 'react';

export interface VFSAccessDeniedProps {
    /** Optional message override (still must NOT leak system paths) */
    message?: string;
    /** Optional retry callback */
    onRetry?: () => void;
}

/**
 * Standard Calm-first deny UX for VFS permission errors.
 */
export function VFSAccessDenied({ message, onRetry }: VFSAccessDeniedProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--nx-space-8, 32px)',
            gap: 'var(--nx-space-3, 12px)',
            textAlign: 'center',
            color: 'var(--nx-text-secondary, #888)',
            fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
        }}>
            <span style={{
                fontSize: 40,
                lineHeight: 1,
                opacity: 0.6,
            }}>
                🛡️
            </span>
            <span style={{
                fontSize: 'var(--nx-text-body, 14px)',
                fontWeight: 'var(--nx-weight-medium, 500)' as any,
                color: 'var(--nx-text-primary, #333)',
            }}>
                Access Restricted
            </span>
            <span style={{
                fontSize: 'var(--nx-text-caption, 12px)',
                maxWidth: 320,
                lineHeight: 1.5,
            }}>
                {message || 'This app does not have permission to access the requested resource.'}
            </span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        marginTop: 'var(--nx-space-2, 8px)',
                        padding: '6px 16px',
                        border: '1px solid var(--nx-border-divider, rgba(0,0,0,0.1))',
                        borderRadius: 'var(--nx-radius-sm, 6px)',
                        background: 'var(--nx-surface-input, #f5f5f5)',
                        color: 'var(--nx-text-primary, #333)',
                        fontSize: 'var(--nx-text-caption, 12px)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                    }}
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
