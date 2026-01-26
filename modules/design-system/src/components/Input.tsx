/**
 * Input Component
 * Form input with label, error states, and icons
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    fullWidth = false,
    prefixIcon,
    suffixIcon,
    disabled = false,
    className = '',
    ...props
}) => {
    const wrapperClasses = `flex flex-col gap-1 ${fullWidth ? 'w-full' : 'w-auto'} ${className}`;
    const labelClasses = 'text-sm font-medium text-neutral-700 mb-1';
    const containerClasses = 'flex items-center gap-2 relative';

    // Input classes with states
    const baseInputClasses = 'w-full py-2 text-base leading-normal text-neutral-900 border rounded-md outline-none transition-all duration-150 ease-out';
    const paddingClasses = `${prefixIcon ? 'pl-10' : 'pl-4'} ${suffixIcon ? 'pr-10' : 'pr-4'}`;
    const stateClasses = disabled
        ? 'bg-neutral-50 cursor-not-allowed border-neutral-300'
        : error
            ? 'bg-white cursor-text border-danger-500'
            : 'bg-white cursor-text border-neutral-300 focus:border-primary-500 focus:shadow-sm';

    const inputClasses = `${baseInputClasses} ${paddingClasses} ${stateClasses}`;

    // Icon positioning
    const prefixIconClasses = 'absolute left-4 flex items-center justify-center text-neutral-500 pointer-events-none';
    const suffixIconClasses = 'absolute right-4 flex items-center justify-center text-neutral-500';

    // Message classes
    const messageClasses = `text-sm mt-1 ${error ? 'text-danger-600' : 'text-neutral-600'}`;

    return (
        <div className={wrapperClasses}>
            {label && <label className={labelClasses}>{label}</label>}
            <div className={containerClasses}>
                {prefixIcon && <div className={prefixIconClasses}>{prefixIcon}</div>}
                <input
                    className={inputClasses}
                    disabled={disabled}
                    {...props}
                />
                {suffixIcon && <div className={suffixIconClasses}>{suffixIcon}</div>}
            </div>
            {(error || helperText) && (
                <div className={messageClasses}>{error || helperText}</div>
            )}
        </div>
    );
};
