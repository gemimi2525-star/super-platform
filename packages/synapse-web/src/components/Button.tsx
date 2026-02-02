import { ButtonHTMLAttributes, ReactNode } from 'react';
import { tokens } from '../styles/tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

/**
 * Button - Interactive button component
 * 
 * Calm design with subtle hover states
 */
export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    disabled = false,
    ...props
}: ButtonProps) {
    const variantStyles = {
        primary: {
            bg: tokens.colors.accent[600],
            bgHover: tokens.colors.accent[700],
            text: '#ffffff',
            border: undefined as string | undefined,
        },
        secondary: {
            bg: tokens.colors.neutral[200],
            bgHover: tokens.colors.neutral[300],
            text: tokens.colors.neutral[900],
            border: undefined as string | undefined,
        },
        outline: {
            bg: 'transparent',
            bgHover: tokens.colors.neutral[50],
            text: tokens.colors.accent[600],
            border: tokens.colors.accent[600],
        },
        ghost: {
            bg: 'transparent',
            bgHover: tokens.colors.neutral[100],
            text: tokens.colors.neutral[700],
            border: undefined as string | undefined,
        },
    };

    const sizeStyles = {
        sm: {
            padding: '0.5rem 1rem',
            fontSize: tokens.typography.fontSize.sm,
        },
        md: {
            padding: '0.75rem 1.5rem',
            fontSize: tokens.typography.fontSize.base,
        },
        lg: {
            padding: '1rem 2rem',
            fontSize: tokens.typography.fontSize.lg,
        },
    };

    const style = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
        <button
            className={`font-semibold rounded-lg transition-colors ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${className}`}
            style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: sizeStyle.padding,
                fontSize: sizeStyle.fontSize,
                borderRadius: tokens.radius.md,
                border: style.border ? `2px solid ${style.border}` : 'none',
                transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
            }}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
