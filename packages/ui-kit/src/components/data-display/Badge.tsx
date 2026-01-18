/**
 * Badge Component
 * 
 * Status indicators and labels
 */

import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export function Badge({
    className = '',
    variant = 'default',
    children,
    ...props
}: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        destructive: 'bg-red-100 text-red-800',
        outline: 'border border-gray-200 text-gray-800',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}
