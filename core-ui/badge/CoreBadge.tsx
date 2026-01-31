/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreBadge
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Badge and status indicator using semantic tokens.
 * Used for: status dots, roles, alert labels
 * 
 * VARIANTS: default | success | warning | danger | info
 * SIZES: sm | md | lg
 * TYPES: badge | dot | status
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type CoreBadgeSize = 'sm' | 'md' | 'lg';
export type CoreBadgeType = 'badge' | 'dot' | 'status';

export interface CoreBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Color variant (semantic) */
    variant?: CoreBadgeVariant;
    /** Size */
    size?: CoreBadgeSize;
    /** Type: badge (text), dot (circle), status (dot + text) */
    type?: CoreBadgeType;
    /** Badge text (for badge/status types) */
    children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR TOKENS (mapped to Core System)
// ═══════════════════════════════════════════════════════════════════════════

const variantColors: Record<CoreBadgeVariant, { bg: string; text: string; dot: string }> = {
    default: {
        bg: 'var(--os-color-surface-alt)',
        text: 'var(--os-color-text-secondary)',
        dot: 'var(--os-color-text-muted)',
    },
    success: {
        bg: 'rgba(34, 197, 94, 0.1)',
        text: 'var(--os-color-success)',
        dot: 'var(--os-color-success)',
    },
    warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        text: 'var(--os-color-warning)',
        dot: 'var(--os-color-warning)',
    },
    danger: {
        bg: 'rgba(239, 68, 68, 0.1)',
        text: 'var(--os-color-danger)',
        dot: 'var(--os-color-danger)',
    },
    info: {
        bg: 'rgba(59, 130, 246, 0.1)',
        text: 'var(--os-color-info)',
        dot: 'var(--os-color-info)',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const baseBadgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--os-font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--os-radius-full)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
};

const badgeSizes: Record<CoreBadgeSize, React.CSSProperties> = {
    sm: {
        height: '20px',
        padding: '0 var(--os-space-2)',
        fontSize: '11px',
    },
    md: {
        height: '24px',
        padding: '0 var(--os-space-3)',
        fontSize: 'var(--os-text-xs)',
    },
    lg: {
        height: '28px',
        padding: '0 var(--os-space-4)',
        fontSize: 'var(--os-text-sm)',
    },
};

const dotSizes: Record<CoreBadgeSize, string> = {
    sm: '6px',
    md: '8px',
    lg: '10px',
};

const statusSizes: Record<CoreBadgeSize, React.CSSProperties> = {
    sm: { fontSize: '11px', gap: 'var(--os-space-1)' },
    md: { fontSize: 'var(--os-text-xs)', gap: 'var(--os-space-2)' },
    lg: { fontSize: 'var(--os-text-sm)', gap: 'var(--os-space-2)' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreBadge = forwardRef<HTMLSpanElement, CoreBadgeProps>(
    (
        {
            variant = 'default',
            size = 'md',
            type = 'badge',
            children,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const colors = variantColors[variant];

        // DOT TYPE — Just a colored circle
        if (type === 'dot') {
            return (
                <span
                    ref={ref}
                    className={`core-badge core-badge--dot core-badge--${variant} ${className}`}
                    style={{
                        display: 'inline-block',
                        width: dotSizes[size],
                        height: dotSizes[size],
                        borderRadius: '50%',
                        backgroundColor: colors.dot,
                        flexShrink: 0,
                        ...style,
                    }}
                    role="status"
                    aria-label={variant}
                    {...props}
                />
            );
        }

        // STATUS TYPE — Dot + Text
        if (type === 'status') {
            return (
                <span
                    ref={ref}
                    className={`core-badge core-badge--status core-badge--${variant} ${className}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontFamily: 'var(--os-font-sans)',
                        fontWeight: 500,
                        color: colors.text,
                        ...statusSizes[size],
                        ...style,
                    }}
                    {...props}
                >
                    <span
                        style={{
                            width: dotSizes[size],
                            height: dotSizes[size],
                            borderRadius: '50%',
                            backgroundColor: colors.dot,
                            flexShrink: 0,
                        }}
                    />
                    {children && <span>{children}</span>}
                </span>
            );
        }

        // BADGE TYPE — Pill with text
        return (
            <span
                ref={ref}
                className={`core-badge core-badge--badge core-badge--${variant} ${className}`}
                style={{
                    ...baseBadgeStyles,
                    ...badgeSizes[size],
                    backgroundColor: colors.bg,
                    color: colors.text,
                    ...style,
                }}
                {...props}
            >
                {children}
            </span>
        );
    }
);

CoreBadge.displayName = 'CoreBadge';

export default CoreBadge;
