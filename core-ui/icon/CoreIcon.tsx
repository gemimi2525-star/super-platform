/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreIcon
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Icon wrapper with standardized sizes and colors.
 * Works with any React icon library (lucide-react, etc.)
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CoreIconColor = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'inherit';

export interface CoreIconProps extends HTMLAttributes<HTMLSpanElement> {
    /** The icon element */
    icon: ReactNode;
    /** Size preset */
    size?: CoreIconSize;
    /** Color variant */
    color?: CoreIconColor;
    /** Custom size in pixels (overrides size preset) */
    customSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIZE & COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const sizeMap: Record<CoreIconSize, string> = {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
};

const colorMap: Record<CoreIconColor, string> = {
    default: 'var(--os-color-text)',
    muted: 'var(--os-color-text-muted)',
    primary: 'var(--os-color-primary)',
    success: 'var(--os-color-success)',
    warning: 'var(--os-color-warning)',
    danger: 'var(--os-color-danger)',
    info: 'var(--os-color-info)',
    inherit: 'inherit',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreIcon = forwardRef<HTMLSpanElement, CoreIconProps>(
    (
        {
            icon,
            size = 'md',
            color = 'default',
            customSize,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const iconSize = customSize ? `${customSize}px` : sizeMap[size];
        const iconColor = colorMap[color];

        return (
            <span
                ref={ref}
                className={`core-icon core-icon--${size} core-icon--${color} ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: iconSize,
                    height: iconSize,
                    color: iconColor,
                    flexShrink: 0,
                    ...style,
                }}
                aria-hidden="true"
                {...props}
            >
                {/* Clone icon with proper size */}
                {React.isValidElement(icon)
                    ? React.cloneElement(icon as React.ReactElement<{ width?: string | number; height?: string | number }>, {
                        width: iconSize,
                        height: iconSize,
                    })
                    : icon
                }
            </span>
        );
    }
);

CoreIcon.displayName = 'CoreIcon';

// ═══════════════════════════════════════════════════════════════════════════
// ICON CIRCLE (Background wrapper)
// ═══════════════════════════════════════════════════════════════════════════

export type CoreIconCircleVariant = 'subtle' | 'solid' | 'outline';

export interface CoreIconCircleProps extends HTMLAttributes<HTMLDivElement> {
    /** The icon element */
    icon: ReactNode;
    /** Size preset */
    size?: CoreIconSize;
    /** Color variant */
    color?: Exclude<CoreIconColor, 'default' | 'inherit' | 'muted'>;
    /** Circle variant */
    variant?: CoreIconCircleVariant;
}

const circleSize: Record<CoreIconSize, { container: string; icon: string }> = {
    xs: { container: '24px', icon: '12px' },
    sm: { container: '32px', icon: '16px' },
    md: { container: '40px', icon: '20px' },
    lg: { container: '48px', icon: '24px' },
    xl: { container: '64px', icon: '32px' },
};

const circleColors: Record<Exclude<CoreIconColor, 'default' | 'inherit' | 'muted'>, {
    subtleBg: string;
    subtleColor: string;
    solidBg: string;
}> = {
    primary: {
        subtleBg: 'rgba(59, 130, 246, 0.1)',
        subtleColor: 'var(--os-color-primary)',
        solidBg: 'var(--os-color-primary)',
    },
    success: {
        subtleBg: 'rgba(34, 197, 94, 0.1)',
        subtleColor: 'var(--os-color-success)',
        solidBg: 'var(--os-color-success)',
    },
    warning: {
        subtleBg: 'rgba(245, 158, 11, 0.1)',
        subtleColor: 'var(--os-color-warning)',
        solidBg: 'var(--os-color-warning)',
    },
    danger: {
        subtleBg: 'rgba(239, 68, 68, 0.1)',
        subtleColor: 'var(--os-color-danger)',
        solidBg: 'var(--os-color-danger)',
    },
    info: {
        subtleBg: 'rgba(59, 130, 246, 0.1)',
        subtleColor: 'var(--os-color-info)',
        solidBg: 'var(--os-color-info)',
    },
};

export const CoreIconCircle = forwardRef<HTMLDivElement, CoreIconCircleProps>(
    (
        {
            icon,
            size = 'md',
            color = 'primary',
            variant = 'subtle',
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const sizes = circleSize[size];
        const colors = circleColors[color];

        const getStyles = (): React.CSSProperties => {
            switch (variant) {
                case 'solid':
                    return {
                        backgroundColor: colors.solidBg,
                        color: 'white',
                        border: 'none',
                    };
                case 'outline':
                    return {
                        backgroundColor: 'transparent',
                        color: colors.subtleColor,
                        border: `2px solid ${colors.subtleColor}`,
                    };
                case 'subtle':
                default:
                    return {
                        backgroundColor: colors.subtleBg,
                        color: colors.subtleColor,
                        border: 'none',
                    };
            }
        };

        return (
            <div
                ref={ref}
                className={`core-icon-circle core-icon-circle--${variant} ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: sizes.container,
                    height: sizes.container,
                    borderRadius: '50%',
                    flexShrink: 0,
                    ...getStyles(),
                    ...style,
                }}
                {...props}
            >
                <CoreIcon icon={icon} customSize={parseInt(sizes.icon)} color="inherit" />
            </div>
        );
    }
);

CoreIconCircle.displayName = 'CoreIconCircle';

export default CoreIcon;
