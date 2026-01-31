/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreCard
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Standard card component using Core System tokens.
 * Used for: Desktop Snapshot, App Cards, Widgets
 * 
 * VARIANTS: default | elevated | outlined | glass
 * HOVER: subtle lift (optional)
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreCardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
export type CoreCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CoreCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Visual variant */
    variant?: CoreCardVariant;
    /** Padding size */
    padding?: CoreCardPadding;
    /** Enable hover effect */
    hoverable?: boolean;
    /** Make card clickable */
    clickable?: boolean;
    /** Full width mode */
    fullWidth?: boolean;
    /** Card children */
    children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (using Core System tokens)
// ═══════════════════════════════════════════════════════════════════════════

const baseStyles: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--os-font-sans)',
    borderRadius: 'var(--os-radius-xl)',
    transition: 'all var(--os-motion-fast) ease-out',
    position: 'relative',
    overflow: 'hidden',
};

const variantStyles: Record<CoreCardVariant, React.CSSProperties> = {
    default: {
        backgroundColor: 'var(--os-color-surface)',
        border: '1px solid var(--os-color-border)',
        boxShadow: 'var(--os-shadow-xs)',
    },
    elevated: {
        backgroundColor: 'var(--os-color-surface)',
        border: '1px solid var(--os-color-border-subtle)',
        boxShadow: 'var(--os-shadow-md)',
    },
    outlined: {
        backgroundColor: 'transparent',
        border: '1px solid var(--os-color-border)',
        boxShadow: 'none',
    },
    glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: 'var(--os-shadow-sm)',
    },
};

const paddingStyles: Record<CoreCardPadding, React.CSSProperties> = {
    none: { padding: 0 },
    sm: { padding: 'var(--os-space-3)' },
    md: { padding: 'var(--os-space-5)' },
    lg: { padding: 'var(--os-space-6)' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreCard = forwardRef<HTMLDivElement, CoreCardProps>(
    (
        {
            variant = 'default',
            padding = 'md',
            hoverable = false,
            clickable = false,
            fullWidth = false,
            children,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const combinedStyles: React.CSSProperties = {
            ...baseStyles,
            ...variantStyles[variant],
            ...paddingStyles[padding],
            ...(fullWidth ? { width: '100%' } : {}),
            ...(clickable ? { cursor: 'pointer' } : {}),
            ...style,
        };

        // CSS class for hover effects (handled in globals.css)
        const hoverClass = hoverable ? 'core-card--hoverable' : '';
        const clickableClass = clickable ? 'core-card--clickable' : '';

        return (
            <div
                ref={ref}
                className={`core-card core-card--${variant} ${hoverClass} ${clickableClass} ${className}`}
                style={combinedStyles}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CoreCard.displayName = 'CoreCard';

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const CoreCardHeader = forwardRef<HTMLDivElement, CoreCardHeaderProps>(
    ({ children, style, className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`core-card__header ${className}`}
            style={{
                marginBottom: 'var(--os-space-4)',
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    )
);

CoreCardHeader.displayName = 'CoreCardHeader';

export interface CoreCardBodyProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const CoreCardBody = forwardRef<HTMLDivElement, CoreCardBodyProps>(
    ({ children, style, className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`core-card__body ${className}`}
            style={style}
            {...props}
        >
            {children}
        </div>
    )
);

CoreCardBody.displayName = 'CoreCardBody';

export interface CoreCardFooterProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const CoreCardFooter = forwardRef<HTMLDivElement, CoreCardFooterProps>(
    ({ children, style, className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`core-card__footer ${className}`}
            style={{
                marginTop: 'var(--os-space-4)',
                paddingTop: 'var(--os-space-4)',
                borderTop: '1px solid var(--os-color-border-subtle)',
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    )
);

CoreCardFooter.displayName = 'CoreCardFooter';

export default CoreCard;
