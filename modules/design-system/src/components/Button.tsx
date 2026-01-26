/**
 * Button Component
 * Enterprise-grade button with variants, sizes, and states
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled = false,
    children,
    className = '',
    ...props
}) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium cursor-pointer transition-all duration-150 ease-out relative outline-none';

    // Variant classes
    const variantClasses = {
        primary: 'bg-primary-600 text-white border-none shadow-sm hover:brightness-95 hover:shadow-md',
        secondary: 'bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-sm hover:brightness-95 hover:shadow-md',
        outline: 'bg-transparent text-neutral-700 border border-neutral-300 hover:shadow-sm',
        ghost: 'bg-transparent text-neutral-700 border-none hover:shadow-sm',
        danger: 'bg-danger-600 text-white border-none shadow-sm hover:brightness-95 hover:shadow-md',
    };

    // Size classes
    const sizeClasses = {
        sm: 'px-4 py-1 text-sm h-8',
        md: 'px-5 py-2 text-base h-10',
        lg: 'px-6 py-3 text-lg h-12',
    };

    // Width classes
    const widthClass = fullWidth ? 'w-full' : 'w-auto';

    // Disabled/loading classes
    const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

    // Focus classes
    const focusClasses = 'focus:outline-2 focus:outline-primary-300 focus:outline-offset-2';

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${focusClasses} ${className}`;

    return (
        <button
            className={combinedClasses}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
};
