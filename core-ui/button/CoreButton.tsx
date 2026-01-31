/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreButton
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2.1 HOTFIX: Core UI Component with asChild support
 * 
 * Standard button component using Core System tokens only.
 * No hardcoded colors/spacing — everything from CSS custom properties.
 * 
 * VARIANTS: primary | secondary | ghost | danger
 * SIZES: sm | md | lg
 * STATES: default | hover | active | disabled | loading
 * 
 * PHASE 7.2.1 HOTFIX FEATURES:
 * - `asChild` prop: Merges button props onto child element
 * - Prevents <button><button> nesting
 * - Icon-only mode (square / circle)
 * - Subtle hover lift effect
 * 
 * @version 2.1.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '../primitives/Slot';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type CoreButtonSize = 'sm' | 'md' | 'lg';
export type CoreButtonShape = 'default' | 'square' | 'circle';

export interface CoreButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual variant */
    variant?: CoreButtonVariant;
    /** Size preset */
    size?: CoreButtonSize;
    /** Show loading spinner */
    loading?: boolean;
    /** Full width mode */
    fullWidth?: boolean;
    /** Icon on the left */
    iconLeft?: ReactNode;
    /** Icon on the right */
    iconRight?: ReactNode;
    /** Shape for icon-only buttons */
    shape?: CoreButtonShape;
    /** Icon-only mode (no children required) */
    iconOnly?: boolean;
    /** Button children */
    children?: ReactNode;
    /** Quiet/low-emphasis mode (reduced visual weight) */
    quiet?: boolean;
    /**
     * Merge props onto child element instead of rendering a <button>.
     * Use this when the button needs to be a different element (e.g., <a>)
     * or when used inside another component that renders its own button.
     */
    asChild?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (using Core System tokens via CSS custom properties)
// ═══════════════════════════════════════════════════════════════════════════

const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--os-space-2)',
    fontFamily: 'var(--os-font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--os-radius-md)',
    cursor: 'pointer',
    transition: 'all var(--os-motion-fast) ease-out, transform 0.1s ease-out',
    outline: 'none',
    border: '1px solid transparent',
    position: 'relative',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
};

const variantStyles: Record<CoreButtonVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: 'var(--os-color-primary)',
        color: 'white',
        boxShadow: 'var(--os-shadow-sm)',
    },
    secondary: {
        backgroundColor: 'var(--os-color-surface)',
        color: 'var(--os-color-text)',
        borderColor: 'var(--os-color-border)',
        boxShadow: 'var(--os-shadow-xs)',
    },
    ghost: {
        backgroundColor: 'transparent',
        color: 'var(--os-color-text-secondary)',
        borderColor: 'transparent',
    },
    danger: {
        backgroundColor: 'var(--os-color-danger)',
        color: 'white',
        boxShadow: 'var(--os-shadow-sm)',
    },
};

const quietVariantStyles: Record<CoreButtonVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: 'var(--os-primary-bg, rgba(59, 130, 246, 0.1))',
        color: 'var(--os-color-primary)',
        boxShadow: 'none',
    },
    secondary: {
        backgroundColor: 'transparent',
        color: 'var(--os-color-text-secondary)',
        borderColor: 'transparent',
        boxShadow: 'none',
    },
    ghost: {
        backgroundColor: 'transparent',
        color: 'var(--os-color-text-muted)',
        borderColor: 'transparent',
    },
    danger: {
        backgroundColor: 'var(--os-danger-bg, rgba(239, 68, 68, 0.1))',
        color: 'var(--os-color-danger)',
        boxShadow: 'none',
    },
};

const sizeStyles: Record<CoreButtonSize, React.CSSProperties> = {
    sm: {
        height: 'var(--os-space-8)',
        paddingLeft: 'var(--os-space-3)',
        paddingRight: 'var(--os-space-3)',
        fontSize: 'var(--os-text-sm)',
    },
    md: {
        height: 'var(--os-space-10)',
        paddingLeft: 'var(--os-space-4)',
        paddingRight: 'var(--os-space-4)',
        fontSize: 'var(--os-text-base)',
    },
    lg: {
        height: 'var(--os-space-12)',
        paddingLeft: 'var(--os-space-6)',
        paddingRight: 'var(--os-space-6)',
        fontSize: 'var(--os-text-lg)',
    },
};

const iconOnlySizeStyles: Record<CoreButtonSize, React.CSSProperties> = {
    sm: {
        height: 'var(--os-space-8)',
        width: 'var(--os-space-8)',
        padding: 0,
    },
    md: {
        height: 'var(--os-space-10)',
        width: 'var(--os-space-10)',
        padding: 0,
    },
    lg: {
        height: 'var(--os-space-12)',
        width: 'var(--os-space-12)',
        padding: 0,
    },
};

const iconSizes: Record<CoreButtonSize, string> = {
    sm: '14px',
    md: '16px',
    lg: '18px',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreButton = forwardRef<HTMLButtonElement, CoreButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            shape = 'default',
            loading = false,
            fullWidth = false,
            disabled = false,
            iconOnly = false,
            quiet = false,
            asChild = false,
            iconLeft,
            iconRight,
            children,
            style,
            className = '',
            onMouseEnter,
            onMouseLeave,
            type = 'button',
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;
        const isIconOnly = iconOnly || (!children && (iconLeft || iconRight));

        // Determine if this is a circle button
        const isCircle = shape === 'circle';
        const isSquare = shape === 'square' || isIconOnly;

        // Get border radius based on shape
        const getBorderRadius = () => {
            if (isCircle) return '50%';
            if (isSquare) return 'var(--os-radius-md)';
            return 'var(--os-radius-md)';
        };

        const combinedStyles: React.CSSProperties = {
            ...baseStyles,
            ...(quiet ? quietVariantStyles[variant] : variantStyles[variant]),
            ...(isIconOnly ? iconOnlySizeStyles[size] : sizeStyles[size]),
            borderRadius: getBorderRadius(),
            ...(fullWidth ? { width: '100%' } : {}),
            ...(isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            ...style,
        };

        // Handle hover effect (subtle lift)
        const [isHovered, setIsHovered] = React.useState(false);

        const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isDisabled) setIsHovered(true);
            onMouseEnter?.(e);
        };

        const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
            setIsHovered(false);
            onMouseLeave?.(e);
        };

        // Apply hover styles
        const hoverStyles: React.CSSProperties = isHovered && !isDisabled
            ? {
                transform: 'translateY(-1px)',
                boxShadow: quiet ? 'var(--os-shadow-xs)' : 'var(--os-shadow-md)',
            }
            : {};

        const icon = iconLeft || iconRight;

        // Build the button content
        const buttonContent = (
            <>
                {/* Loading Spinner */}
                {loading && (
                    <span
                        style={{
                            width: iconSizes[size],
                            height: iconSizes[size],
                            border: '2px solid currentColor',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                        }}
                    />
                )}

                {/* Icon Only Mode */}
                {!loading && isIconOnly && icon && (
                    <span style={{ display: 'flex', width: iconSizes[size], height: iconSizes[size] }}>
                        {icon}
                    </span>
                )}

                {/* Left Icon (normal mode) */}
                {!loading && !isIconOnly && iconLeft && (
                    <span style={{ display: 'flex', width: iconSizes[size], height: iconSizes[size] }}>
                        {iconLeft}
                    </span>
                )}

                {/* Text */}
                {!isIconOnly && children && <span>{children}</span>}

                {/* Right Icon (normal mode) */}
                {!isIconOnly && iconRight && (
                    <span style={{ display: 'flex', width: iconSizes[size], height: iconSizes[size] }}>
                        {iconRight}
                    </span>
                )}
            </>
        );

        const buttonClassName = `core-button core-button--${variant} core-button--${size} ${quiet ? 'core-button--quiet' : ''} ${isIconOnly ? 'core-button--icon-only' : ''} ${className}`;

        // If asChild is true, merge props onto the child element
        if (asChild) {
            return (
                <Slot
                    ref={ref as React.Ref<HTMLElement>}
                    className={buttonClassName}
                    style={{ ...combinedStyles, ...hoverStyles }}
                    onMouseEnter={handleMouseEnter as React.MouseEventHandler<HTMLElement>}
                    onMouseLeave={handleMouseLeave as React.MouseEventHandler<HTMLElement>}
                    {...props}
                >
                    {children}
                </Slot>
            );
        }

        return (
            <button
                ref={ref}
                type={type}
                className={buttonClassName}
                style={{ ...combinedStyles, ...hoverStyles }}
                disabled={isDisabled}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                {buttonContent}
            </button>
        );
    }
);

CoreButton.displayName = 'CoreButton';

export default CoreButton;
