'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Permission Banner — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dismissible error/warning banner for permission denials.
 * Extracted from UsersApp.tsx.
 *
 * @module coreos/system/shared/ui/PermissionBanner
 * @version 1.0.0
 */

import React from 'react';

interface PermissionBannerProps {
    message: string;
    onDismiss: () => void;
    variant?: 'light' | 'dark';
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function PermissionBanner({ message, onDismiss, variant = 'light', action }: PermissionBannerProps) {
    const isDark = variant === 'dark';

    return (
        <div
            style={{
                padding: '10px 16px',
                background: isDark ? 'rgba(255, 95, 87, 0.15)' : 'rgba(255, 95, 87, 0.1)',
                border: `1px solid rgba(255, 95, 87, ${isDark ? '0.4' : '0.3'})`,
                borderRadius: 8,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                color: isDark ? '#ff8a80' : '#c44',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>{action ? '⚠️' : '🔒'} {message}</span>
                {action && (
                    <button
                        onClick={action.onClick}
                        style={{
                            background: 'transparent',
                            border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 4,
                            color: 'inherit',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 500
                        }}
                    >
                        {action.label}
                    </button>
                )}
            </div>
            <button
                onClick={onDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#888' : '#888',
                    cursor: 'pointer',
                    fontSize: 12,
                    marginLeft: 12
                }}
            >
                ✕
            </button>
        </div>
    );
}
