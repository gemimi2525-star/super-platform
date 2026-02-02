import { ReactNode } from 'react';
import { tokens } from '../styles/tokens';

export interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'bordered';
    hover?: boolean;
}

/**
 * Card - Content container with soft shadow
 * 
 * Minimal/calm design with subtle elevation
 */
export function Card({
    children,
    className = '',
    variant = 'default',
    hover = false,
}: CardProps) {
    return (
        <div
            className={`rounded-lg p-6 transition-shadow ${hover ? 'hover:shadow-lg' : ''} ${className}`}
            style={{
                backgroundColor: tokens.colors.surface,
                borderRadius: tokens.radius.lg,
                boxShadow: variant === 'default' ? tokens.shadows.sm : 'none',
                border: variant === 'bordered' ? `1px solid ${tokens.colors.border}` : 'none',
                transition: `box-shadow ${tokens.motion.duration.normal} ${tokens.motion.easing.out}`,
            }}
        >
            {children}
        </div>
    );
}
