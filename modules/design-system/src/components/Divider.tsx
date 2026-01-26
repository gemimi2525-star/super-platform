/**
 * Divider Component
 * Simple horizontal line separator using design tokens
 * ZERO inline styles - className variants only
 */

import React from 'react';

export interface DividerProps {
    spacing?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Divider: React.FC<DividerProps> = ({
    spacing = 'md',
    className = '',
}) => {
    // Map spacing prop to margin classes
    const spacingClassMap = {
        sm: 'my-2',     // 8px (spacing.sm)
        md: 'my-3',     // 12px (spacing.md)
        lg: 'my-4',     // 16px (spacing.lg)
    };

    const classes = [
        'border-t',
        'border-neutral-200',
        spacingClassMap[spacing],
        className,
    ].filter(Boolean).join(' ');

    return <div className={classes} />;
};
