/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreDivider & CoreSectionHeader
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Visual separators and section headers using Core System tokens.
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CORE DIVIDER
// ═══════════════════════════════════════════════════════════════════════════

export type CoreDividerOrientation = 'horizontal' | 'vertical';
export type CoreDividerSpacing = 'none' | 'sm' | 'md' | 'lg';

export interface CoreDividerProps extends HTMLAttributes<HTMLDivElement> {
    /** Orientation */
    orientation?: CoreDividerOrientation;
    /** Spacing around divider */
    spacing?: CoreDividerSpacing;
    /** Optional label in center */
    label?: string;
}

const spacingValues: Record<CoreDividerSpacing, string> = {
    none: '0',
    sm: 'var(--os-space-2)',
    md: 'var(--os-space-4)',
    lg: 'var(--os-space-6)',
};

export const CoreDivider = forwardRef<HTMLDivElement, CoreDividerProps>(
    (
        {
            orientation = 'horizontal',
            spacing = 'md',
            label,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const isHorizontal = orientation === 'horizontal';

        // With label
        if (label && isHorizontal) {
            return (
                <div
                    ref={ref}
                    className={`core-divider core-divider--labeled ${className}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--os-space-3)',
                        margin: `${spacingValues[spacing]} 0`,
                        ...style,
                    }}
                    role="separator"
                    {...props}
                >
                    <div
                        style={{
                            flex: 1,
                            height: '1px',
                            backgroundColor: 'var(--os-color-border)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: 'var(--os-text-xs)',
                            fontWeight: 500,
                            color: 'var(--os-color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontFamily: 'var(--os-font-sans)',
                        }}
                    >
                        {label}
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: '1px',
                            backgroundColor: 'var(--os-color-border)',
                        }}
                    />
                </div>
            );
        }

        // Simple divider
        return (
            <div
                ref={ref}
                className={`core-divider core-divider--${orientation} ${className}`}
                style={{
                    backgroundColor: 'var(--os-color-border)',
                    ...(isHorizontal
                        ? {
                            width: '100%',
                            height: '1px',
                            margin: `${spacingValues[spacing]} 0`,
                        }
                        : {
                            width: '1px',
                            height: '100%',
                            margin: `0 ${spacingValues[spacing]}`,
                        }),
                    ...style,
                }}
                role="separator"
                aria-orientation={orientation}
                {...props}
            />
        );
    }
);

CoreDivider.displayName = 'CoreDivider';

// ═══════════════════════════════════════════════════════════════════════════
// CORE SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════

export type CoreSectionHeaderSize = 'sm' | 'md' | 'lg';

export interface CoreSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
    /** Section title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Optional action (button, link) */
    action?: ReactNode;
    /** Size variant */
    size?: CoreSectionHeaderSize;
    /** Show divider below */
    divider?: boolean;
}

const headerSizes: Record<CoreSectionHeaderSize, {
    titleSize: string;
    subtitleSize: string;
    gap: string;
    marginBottom: string;
}> = {
    sm: {
        titleSize: 'var(--os-text-xs)',
        subtitleSize: '11px',
        gap: 'var(--os-space-1)',
        marginBottom: 'var(--os-space-3)',
    },
    md: {
        titleSize: 'var(--os-text-sm)',
        subtitleSize: 'var(--os-text-xs)',
        gap: 'var(--os-space-2)',
        marginBottom: 'var(--os-space-4)',
    },
    lg: {
        titleSize: 'var(--os-text-base)',
        subtitleSize: 'var(--os-text-sm)',
        gap: 'var(--os-space-2)',
        marginBottom: 'var(--os-space-5)',
    },
};

export const CoreSectionHeader = forwardRef<HTMLDivElement, CoreSectionHeaderProps>(
    (
        {
            title,
            subtitle,
            action,
            size = 'md',
            divider = false,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const sizeConfig = headerSizes[size];

        return (
            <div
                ref={ref}
                className={`core-section-header core-section-header--${size} ${className}`}
                style={{
                    marginBottom: sizeConfig.marginBottom,
                    ...style,
                }}
                {...props}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 'var(--os-space-4)',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: sizeConfig.gap }}>
                        {/* Title */}
                        <h3
                            style={{
                                margin: 0,
                                fontSize: sizeConfig.titleSize,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--os-color-text-secondary)',
                                fontFamily: 'var(--os-font-sans)',
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
                                    fontFamily: 'var(--os-font-sans)',
                                }}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Action */}
                    {action && <div>{action}</div>}
                </div>

                {/* Optional Divider */}
                {divider && (
                    <div
                        style={{
                            marginTop: 'var(--os-space-3)',
                            height: '1px',
                            backgroundColor: 'var(--os-color-border)',
                        }}
                    />
                )}
            </div>
        );
    }
);

CoreSectionHeader.displayName = 'CoreSectionHeader';

export default CoreDivider;
