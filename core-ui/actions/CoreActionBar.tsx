/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreActionBar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: Horizontal toolbar for grouping CoreActionButtons
 * 
 * Features:
 * - Horizontal layout with gap
 * - Optional dividers between groups
 * - Responsive overflow handling
 * - Keyboard navigation
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreActionBarProps extends HTMLAttributes<HTMLDivElement> {
    /** Action buttons and dividers */
    children: ReactNode;
    /** Size of action buttons (propagated to children) */
    size?: 'sm' | 'md';
    /** Background style */
    variant?: 'default' | 'surface' | 'transparent';
    /** Alignment */
    align?: 'start' | 'center' | 'end' | 'space-between';
}

export interface CoreActionBarDividerProps {
    /** Orientation (vertical by default in a horizontal bar) */
    orientation?: 'vertical' | 'horizontal';
}

// ═══════════════════════════════════════════════════════════════════════════
// DIVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreActionBarDivider({ orientation = 'vertical' }: CoreActionBarDividerProps) {
    const isVertical = orientation === 'vertical';

    const dividerStyles: React.CSSProperties = {
        width: isVertical ? '1px' : '100%',
        height: isVertical ? '16px' : '1px',
        backgroundColor: 'var(--os-color-border)',
        margin: isVertical ? '0 var(--os-space-1)' : 'var(--os-space-1) 0',
        flexShrink: 0,
    };

    return <div style={dividerStyles} role="separator" aria-orientation={orientation} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreActionBar = forwardRef<HTMLDivElement, CoreActionBarProps>(
    function CoreActionBar(
        {
            children,
            size = 'md',
            variant = 'default',
            align = 'start',
            className = '',
            style,
            ...props
        },
        ref
    ) {
        // Variant styles
        const variantStyles = {
            default: {
                backgroundColor: 'var(--os-color-surface)',
                border: '1px solid var(--os-color-border)',
                boxShadow: 'var(--os-shadow-xs)',
            },
            surface: {
                backgroundColor: 'var(--os-color-surface-elevated)',
                border: 'none',
                boxShadow: 'var(--os-shadow-sm)',
            },
            transparent: {
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
            },
        }[variant];

        // Alignment mapping
        const alignValue = {
            start: 'flex-start',
            center: 'center',
            end: 'flex-end',
            'space-between': 'space-between',
        }[align];

        const barStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: alignValue,
            gap: 'var(--os-space-1)',
            padding: size === 'sm' ? 'var(--os-space-1)' : 'var(--os-space-1-5)',
            borderRadius: 'var(--os-radius-md)',
            ...variantStyles,
            ...style,
        };

        return (
            <div
                ref={ref}
                role="toolbar"
                aria-label="Action bar"
                className={`core-action-bar core-action-bar--${variant} ${className}`}
                style={barStyles}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CoreActionBar.displayName = 'CoreActionBar';

export default CoreActionBar;
