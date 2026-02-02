import { ReactNode } from 'react';
import { tokens } from '../styles/tokens';

export interface CalloutProps {
    children: ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'error';
    icon?: string;
    className?: string;
}

/**
 * Callout - Alert/Info box for important messages
 * 
 * Calm design with colored left border accent
 */
export function Callout({
    children,
    variant = 'info',
    icon,
    className = '',
}: CalloutProps) {
    const variantStyles = {
        info: {
            bg: tokens.colors.accent[50],
            border: tokens.colors.accent[500],
            icon: 'ℹ️',
        },
        success: {
            bg: '#f0fdf4',
            border: tokens.colors.success,
            icon: '✓',
        },
        warning: {
            bg: '#fffbeb',
            border: tokens.colors.warning,
            icon: '⚠️',
        },
        error: {
            bg: '#fef2f2',
            border: tokens.colors.error,
            icon: '❌',
        },
    };

    const style = variantStyles[variant];

    return (
        <div
            className={`p-4 rounded-lg ${className}`}
            style={{
                backgroundColor: style.bg,
                borderLeft: `4px solid ${style.border}`,
                borderRadius: tokens.radius.md,
            }}
        >
            <div className="flex items-start gap-3">
                {(icon || style.icon) && (
                    <span className="text-lg">{icon || style.icon}</span>
                )}
                <div className="flex-1">{children}</div>
            </div>
        </div>
    );
}
