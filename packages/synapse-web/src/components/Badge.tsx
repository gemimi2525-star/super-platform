import { ReactNode } from 'react';
import { tokens } from '../styles/tokens';

export interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'accent';
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge - Small label for status/category
 */
export function Badge({
    children,
    variant = 'default',
    size = 'md',
}: BadgeProps) {
    const variantStyles = {
        default: {
            bg: tokens.colors.neutral[100],
            text: tokens.colors.neutral[700],
        },
        success: {
            bg: '#d1fae5',
            text: '#065f46',
        },
        error: {
            bg: '#fee2e2',
            text: '#991b1b',
        },
        warning: {
            bg: '#fef3c7',
            text: '#92400e',
        },
        accent: {
            bg: tokens.colors.accent[100],
            text: tokens.colors.accent[700],
        },
    };

    const sizeStyles = {
        sm: {
            padding: '0.125rem 0.5rem',
            fontSize: tokens.typography.fontSize.xs,
        },
        md: {
            padding: '0.25rem 0.75rem',
            fontSize: tokens.typography.fontSize.sm,
        },
        lg: {
            padding: '0.375rem 1rem',
            fontSize: tokens.typography.fontSize.base,
        },
    };

    const style = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
        <span
            className="inline-flex items-center font-medium"
            style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: sizeStyle.padding,
                fontSize: sizeStyle.fontSize,
                borderRadius: tokens.radius.full,
            }}
        >
            {children}
        </span>
    );
}
