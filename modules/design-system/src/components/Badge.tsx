/**
 * Badge Component
 * Status indicator with variants
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'neutral',
    size = 'md',
    dot = false,
    children,
    className = '',
}) => {
    // Base classes
    const baseClasses = 'inline-flex items-center gap-1 font-medium border rounded-full whitespace-nowrap';

    // Variant classes
    const variantClasses = {
        success: 'bg-success-50 text-success-700 border-success-200',
        warning: 'bg-warning-50 text-warning-700 border-warning-200',
        danger: 'bg-danger-50 text-danger-700 border-danger-200',
        info: 'bg-info-50 text-info-700 border-info-200',
        neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };

    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-0.5 text-sm',
    };

    // Dot variant class by variant
    const dotClasses = {
        success: 'bg-success-700',
        warning: 'bg-warning-700',
        danger: 'bg-danger-700',
        info: 'bg-info-700',
        neutral: 'bg-neutral-700',
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
        <span className={combinedClasses}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} />}
            {children}
        </span>
    );
};
