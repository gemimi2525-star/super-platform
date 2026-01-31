/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreAppIcon
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: OS-grade app icon component for Core Hub / Launcher
 * 
 * Features:
 * - Multiple sizes (sm, md, lg, xl)
 * - States: default, hover, active, selected, disabled
 * - Optional label with truncation
 * - Optional badge (dot or number)
 * - Proper hit-area for touch/click
 * - Full keyboard accessibility
 * - 100% Core System tokens
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreAppIconSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CoreAppIconProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    /** Icon element (Lucide icon or custom) */
    icon: ReactNode;
    /** Label text (optional, shown below icon) */
    label?: string;
    /** Size preset */
    size?: CoreAppIconSize;
    /** Selected state (active app) */
    selected?: boolean;
    /** Badge indicator */
    badge?: number | 'dot';
    /** Max badge number (shows "99+" if exceeded) */
    maxBadge?: number;
    /** Render as child element (for custom wrappers) */
    asChild?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIZE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

interface SizeConfig {
    container: string;
    iconBox: string;
    iconSize: string;
    fontSize: string;
    gap: string;
    borderRadius: string;
    padding: string;
    labelMaxWidth: string;
}

const sizeConfigs: Record<CoreAppIconSize, SizeConfig> = {
    sm: {
        container: '56px',
        iconBox: '40px',
        iconSize: '20px',
        fontSize: 'var(--os-text-xs)',
        gap: 'var(--os-space-1)',
        borderRadius: 'var(--os-radius-md)',
        padding: 'var(--os-space-2)',
        labelMaxWidth: '56px',
    },
    md: {
        container: '72px',
        iconBox: '48px',
        iconSize: '24px',
        fontSize: 'var(--os-text-xs)',
        gap: 'var(--os-space-1-5)',
        borderRadius: 'var(--os-radius-lg)',
        padding: 'var(--os-space-2)',
        labelMaxWidth: '72px',
    },
    lg: {
        container: '88px',
        iconBox: '56px',
        iconSize: '28px',
        fontSize: 'var(--os-text-sm)',
        gap: 'var(--os-space-2)',
        borderRadius: 'var(--os-radius-lg)',
        padding: 'var(--os-space-3)',
        labelMaxWidth: '88px',
    },
    xl: {
        container: '104px',
        iconBox: '64px',
        iconSize: '32px',
        fontSize: 'var(--os-text-sm)',
        gap: 'var(--os-space-2)',
        borderRadius: 'var(--os-radius-xl)',
        padding: 'var(--os-space-3)',
        labelMaxWidth: '104px',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreAppIcon = forwardRef<HTMLButtonElement, CoreAppIconProps>(
    function CoreAppIcon(
        {
            icon,
            label,
            size = 'md',
            selected = false,
            disabled = false,
            badge,
            maxBadge = 99,
            className = '',
            style,
            onClick,
            ...props
        },
        ref
    ) {
        const config = sizeConfigs[size];
        const [isHovered, setIsHovered] = React.useState(false);
        const [isPressed, setIsPressed] = React.useState(false);

        // Format badge text
        const getBadgeText = () => {
            if (badge === 'dot') return null;
            if (typeof badge === 'number') {
                return badge > maxBadge ? `${maxBadge}+` : String(badge);
            }
            return null;
        };

        const badgeText = getBadgeText();
        const hasBadge = badge !== undefined && badge !== null && badge !== 0;

        // Container styles
        const containerStyles: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: config.container,
            minHeight: config.container,
            padding: config.padding,
            gap: config.gap,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: config.borderRadius,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all var(--os-motion-fast) ease-out',
            outline: 'none',
            position: 'relative',
            // Hover/Active states
            ...(isHovered && !disabled ? {
                backgroundColor: 'var(--os-color-surface-hover, rgba(0,0,0,0.04))',
                transform: 'translateY(-2px)',
            } : {}),
            ...(isPressed && !disabled ? {
                transform: 'scale(0.95)',
                backgroundColor: 'var(--os-color-surface-active, rgba(0,0,0,0.08))',
            } : {}),
            ...(selected ? {
                backgroundColor: 'var(--os-primary-bg, rgba(59, 130, 246, 0.1))',
            } : {}),
            ...style,
        };

        // Icon box styles
        const iconBoxStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: config.iconBox,
            height: config.iconBox,
            backgroundColor: selected
                ? 'var(--os-color-primary)'
                : 'var(--os-color-surface)',
            borderRadius: config.borderRadius,
            boxShadow: 'var(--os-shadow-sm)',
            transition: 'all var(--os-motion-fast) ease-out',
            position: 'relative',
            color: selected ? 'white' : 'var(--os-color-text)',
        };

        // Icon wrapper styles
        const iconWrapperStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: config.iconSize,
            height: config.iconSize,
        };

        // Label styles
        const labelStyles: React.CSSProperties = {
            fontSize: config.fontSize,
            fontFamily: 'var(--os-font-sans)',
            fontWeight: 500,
            color: selected ? 'var(--os-color-primary)' : 'var(--os-color-text)',
            textAlign: 'center',
            maxWidth: config.labelMaxWidth,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
        };

        // Badge styles
        const badgeStyles: React.CSSProperties = {
            position: 'absolute',
            top: badge === 'dot' ? '2px' : '0',
            right: badge === 'dot' ? '2px' : '-4px',
            minWidth: badge === 'dot' ? '8px' : '18px',
            height: badge === 'dot' ? '8px' : '18px',
            padding: badge === 'dot' ? 0 : '0 5px',
            backgroundColor: 'var(--os-color-danger)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 600,
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--os-shadow-sm)',
        };

        // Focus ring styles (applied via CSS class)
        const focusStyles = `
            .core-app-icon:focus-visible {
                outline: 2px solid var(--os-color-primary);
                outline-offset: 2px;
            }
        `;

        return (
            <>
                <style>{focusStyles}</style>
                <button
                    ref={ref}
                    type="button"
                    className={`core-app-icon core-app-icon--${size} ${selected ? 'core-app-icon--selected' : ''} ${className}`}
                    style={containerStyles}
                    disabled={disabled}
                    onClick={onClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        setIsPressed(false);
                    }}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    aria-label={label || 'App icon'}
                    aria-pressed={selected}
                    {...props}
                >
                    {/* Icon Box */}
                    <div style={iconBoxStyles}>
                        <div style={iconWrapperStyles}>
                            {icon}
                        </div>

                        {/* Badge */}
                        {hasBadge && (
                            <span style={badgeStyles}>
                                {badgeText}
                            </span>
                        )}
                    </div>

                    {/* Label */}
                    {label && (
                        <span style={labelStyles} title={label}>
                            {label}
                        </span>
                    )}
                </button>
            </>
        );
    }
);

CoreAppIcon.displayName = 'CoreAppIcon';

export default CoreAppIcon;
