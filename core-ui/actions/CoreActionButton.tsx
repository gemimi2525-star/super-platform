/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreActionButton
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: OS-grade action button for toolbars and context menus
 * 
 * A specialized button for OS actions like New, Delete, Move, Resize.
 * Designed to work in:
 * - CoreActionBar (horizontal toolbar)
 * - CoreContextMenu (dropdown menu)
 * - Standalone usage
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreActionButtonVariant = 'default' | 'primary' | 'danger';
export type CoreActionButtonSize = 'sm' | 'md';

export interface CoreActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Icon element */
    icon: ReactNode;
    /** Label text (optional) */
    label?: string;
    /** Visual variant */
    variant?: CoreActionButtonVariant;
    /** Size preset */
    size?: CoreActionButtonSize;
    /** Icon-only mode (no label, square button) */
    iconOnly?: boolean;
    /** Show label on hover (for icon-only mode) */
    showLabelOnHover?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreActionButton = forwardRef<HTMLButtonElement, CoreActionButtonProps>(
    function CoreActionButton(
        {
            icon,
            label,
            variant = 'default',
            size = 'md',
            iconOnly = false,
            disabled = false,
            className = '',
            style,
            ...props
        },
        ref
    ) {
        const [isHovered, setIsHovered] = React.useState(false);

        // Size configurations
        const sizeConfig = {
            sm: {
                height: '28px',
                padding: iconOnly ? '0' : '0 var(--os-space-2)',
                fontSize: 'var(--os-text-xs)',
                iconSize: '14px',
                width: iconOnly ? '28px' : 'auto',
                gap: 'var(--os-space-1)',
            },
            md: {
                height: '32px',
                padding: iconOnly ? '0' : '0 var(--os-space-3)',
                fontSize: 'var(--os-text-sm)',
                iconSize: '16px',
                width: iconOnly ? '32px' : 'auto',
                gap: 'var(--os-space-1-5)',
            },
        }[size];

        // Variant colors
        const variantColors = {
            default: {
                bg: 'transparent',
                bgHover: 'var(--os-color-surface-hover, rgba(0,0,0,0.05))',
                color: 'var(--os-color-text-secondary)',
                colorHover: 'var(--os-color-text)',
            },
            primary: {
                bg: 'transparent',
                bgHover: 'var(--os-primary-bg, rgba(59, 130, 246, 0.1))',
                color: 'var(--os-color-primary)',
                colorHover: 'var(--os-color-primary)',
            },
            danger: {
                bg: 'transparent',
                bgHover: 'var(--os-danger-bg, rgba(239, 68, 68, 0.1))',
                color: 'var(--os-color-danger)',
                colorHover: 'var(--os-color-danger)',
            },
        }[variant];

        const buttonStyles: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: sizeConfig.gap,
            height: sizeConfig.height,
            width: sizeConfig.width,
            padding: sizeConfig.padding,
            backgroundColor: isHovered && !disabled ? variantColors.bgHover : variantColors.bg,
            color: isHovered && !disabled ? variantColors.colorHover : variantColors.color,
            border: 'none',
            borderRadius: 'var(--os-radius-md)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            fontFamily: 'var(--os-font-sans)',
            fontSize: sizeConfig.fontSize,
            fontWeight: 500,
            transition: 'all var(--os-motion-fast) ease-out',
            outline: 'none',
            ...style,
        };

        const iconWrapperStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeConfig.iconSize,
            height: sizeConfig.iconSize,
        };

        return (
            <button
                ref={ref}
                type="button"
                className={`core-action-button core-action-button--${variant} core-action-button--${size} ${className}`}
                style={buttonStyles}
                disabled={disabled}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label={iconOnly ? label : undefined}
                {...props}
            >
                <span style={iconWrapperStyles}>{icon}</span>
                {!iconOnly && label && <span>{label}</span>}
            </button>
        );
    }
);

CoreActionButton.displayName = 'CoreActionButton';

export default CoreActionButton;
