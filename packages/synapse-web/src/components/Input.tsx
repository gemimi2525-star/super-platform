import { InputHTMLAttributes, forwardRef } from 'react';
import { tokens } from '../styles/tokens';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

/**
 * Input - Form input component
 * 
 * Clean design with focus states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label
                        className="block font-medium mb-2"
                        style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[700],
                        }}
                    >
                        {label}
                    </label>
                )}

                <input
                    ref={ref}
                    className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-shadow ${className}`}
                    style={{
                        backgroundColor: tokens.colors.surface,
                        border: `2px solid ${error ? tokens.colors.error : tokens.colors.border}`,
                        borderRadius: tokens.radius.md,
                        fontSize: tokens.typography.fontSize.base,
                        color: tokens.colors.neutral[900],
                        transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
                    }}
                    {...props}
                />

                {helperText && !error && (
                    <p
                        className="mt-1"
                        style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                        }}
                    >
                        {helperText}
                    </p>
                )}

                {error && (
                    <p
                        className="mt-1"
                        style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.error,
                        }}
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
