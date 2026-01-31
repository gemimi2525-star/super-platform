/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreEmptyState
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Empty state component for OS Calm design.
 * Used when there's no content to display.
 * 
 * RULES:
 * - Calm tone (not aggressive)
 * - Optional icon
 * - Title + subtitle
 * - Single optional action
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreEmptyStateSize = 'sm' | 'md' | 'lg';

export interface CoreEmptyStateProps extends HTMLAttributes<HTMLDivElement> {
    /** Icon to display */
    icon?: ReactNode;
    /** Title text */
    title: string;
    /** Subtitle/description text */
    subtitle?: string;
    /** Optional action button */
    action?: ReactNode;
    /** Size variant */
    size?: CoreEmptyStateSize;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'var(--os-font-sans)',
};

const sizeStyles: Record<CoreEmptyStateSize, {
    padding: string;
    iconSize: string;
    titleSize: string;
    subtitleSize: string;
    gap: string;
}> = {
    sm: {
        padding: 'var(--os-space-8)',
        iconSize: '32px',
        titleSize: 'var(--os-text-base)',
        subtitleSize: 'var(--os-text-sm)',
        gap: 'var(--os-space-2)',
    },
    md: {
        padding: 'var(--os-space-12)',
        iconSize: '48px',
        titleSize: 'var(--os-text-lg)',
        subtitleSize: 'var(--os-text-base)',
        gap: 'var(--os-space-3)',
    },
    lg: {
        padding: 'var(--os-space-16)',
        iconSize: '64px',
        titleSize: 'var(--os-text-xl)',
        subtitleSize: 'var(--os-text-lg)',
        gap: 'var(--os-space-4)',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreEmptyState = forwardRef<HTMLDivElement, CoreEmptyStateProps>(
    (
        {
            icon,
            title,
            subtitle,
            action,
            size = 'md',
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const sizeConfig = sizeStyles[size];

        return (
            <div
                ref={ref}
                className={`core-empty-state core-empty-state--${size} ${className}`}
                style={{
                    ...baseStyles,
                    padding: sizeConfig.padding,
                    gap: sizeConfig.gap,
                    ...style,
                }}
                {...props}
            >
                {/* Icon */}
                {icon && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: sizeConfig.iconSize,
                            height: sizeConfig.iconSize,
                            marginBottom: 'var(--os-space-2)',
                            color: 'var(--os-color-text-muted)',
                        }}
                    >
                        {icon}
                    </div>
                )}

                {/* Title */}
                <h3
                    style={{
                        margin: 0,
                        fontSize: sizeConfig.titleSize,
                        fontWeight: 500,
                        color: 'var(--os-color-text-secondary)',
                        lineHeight: 1.3,
                    }}
                >
                    {title}
                </h3>

                {/* Subtitle */}
                {subtitle && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: sizeConfig.subtitleSize,
                            color: 'var(--os-color-text-muted)',
                            lineHeight: 1.5,
                            maxWidth: '400px',
                        }}
                    >
                        {subtitle}
                    </p>
                )}

                {/* Action */}
                {action && (
                    <div
                        style={{
                            marginTop: 'var(--os-space-4)',
                        }}
                    >
                        {action}
                    </div>
                )}
            </div>
        );
    }
);

CoreEmptyState.displayName = 'CoreEmptyState';

export default CoreEmptyState;
