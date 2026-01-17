/**
 * FormGroup Component
 * 
 * Wrapper for form fields with consistent layout
 */

import React from 'react';

export interface FormGroupProps {
    label: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormGroup({
    label,
    required = false,
    error,
    helperText,
    children,
    className = '',
}: FormGroupProps) {
    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div>{children}</div>

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
