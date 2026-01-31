/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreInput
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Standard input/text field using Core System tokens only.
 * 
 * FEATURES:
 * - label
 * - placeholder
 * - helper text
 * - error state
 * - disabled / read-only
 * - icon prefix/suffix
 * - full width on mobile
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Input label */
    label?: string;
    /** Helper text below input */
    helperText?: string;
    /** Error message (replaces helperText when present) */
    error?: string;
    /** Full width mode */
    fullWidth?: boolean;
    /** Icon on the left */
    prefixIcon?: ReactNode;
    /** Icon on the right */
    suffixIcon?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (using Core System tokens)
// ═══════════════════════════════════════════════════════════════════════════

const wrapperStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--os-space-1)',
    fontFamily: 'var(--os-font-sans)',
};

const labelStyles: React.CSSProperties = {
    fontSize: 'var(--os-text-sm)',
    fontWeight: 500,
    color: 'var(--os-color-text-secondary)',
    marginBottom: 'var(--os-space-1)',
};

const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
};

const baseInputStyles: React.CSSProperties = {
    width: '100%',
    height: 'var(--os-space-10)',
    padding: '0 var(--os-space-4)',
    fontSize: 'var(--os-text-base)',
    fontFamily: 'var(--os-font-sans)',
    color: 'var(--os-color-text)',
    backgroundColor: 'var(--os-color-surface)',
    border: '1px solid var(--os-color-border)',
    borderRadius: 'var(--os-radius-md)',
    outline: 'none',
    transition: 'all var(--os-motion-fast) ease-out',
};

const iconContainerStyles: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--os-color-text-muted)',
    pointerEvents: 'none',
    width: '20px',
    height: '20px',
};

const helperStyles: React.CSSProperties = {
    fontSize: 'var(--os-text-sm)',
    marginTop: 'var(--os-space-1)',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreInput = forwardRef<HTMLInputElement, CoreInputProps>(
    (
        {
            label,
            helperText,
            error,
            fullWidth = false,
            prefixIcon,
            suffixIcon,
            disabled = false,
            readOnly = false,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const hasError = !!error;

        // Dynamic input styles
        const inputStyles: React.CSSProperties = {
            ...baseInputStyles,
            paddingLeft: prefixIcon ? 'var(--os-space-10)' : 'var(--os-space-4)',
            paddingRight: suffixIcon ? 'var(--os-space-10)' : 'var(--os-space-4)',
            borderColor: hasError
                ? 'var(--os-color-danger)'
                : 'var(--os-color-border)',
            backgroundColor: disabled
                ? 'var(--os-color-surface-alt)'
                : 'var(--os-color-surface)',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
        };

        return (
            <div
                className={`core-input ${hasError ? 'core-input--error' : ''} ${className}`}
                style={{
                    ...wrapperStyles,
                    width: fullWidth ? '100%' : 'auto',
                }}
            >
                {/* Label */}
                {label && (
                    <label style={labelStyles}>
                        {label}
                    </label>
                )}

                {/* Input Container */}
                <div style={containerStyles}>
                    {/* Prefix Icon */}
                    {prefixIcon && (
                        <span style={{ ...iconContainerStyles, left: 'var(--os-space-3)' }}>
                            {prefixIcon}
                        </span>
                    )}

                    {/* Input Field */}
                    <input
                        ref={ref}
                        style={{ ...inputStyles, ...style }}
                        disabled={disabled}
                        readOnly={readOnly}
                        aria-invalid={hasError}
                        {...props}
                    />

                    {/* Suffix Icon */}
                    {suffixIcon && (
                        <span style={{ ...iconContainerStyles, right: 'var(--os-space-3)', pointerEvents: 'auto' }}>
                            {suffixIcon}
                        </span>
                    )}
                </div>

                {/* Helper/Error Text */}
                {(error || helperText) && (
                    <span
                        style={{
                            ...helperStyles,
                            color: hasError
                                ? 'var(--os-color-danger)'
                                : 'var(--os-color-text-muted)',
                        }}
                    >
                        {error || helperText}
                    </span>
                )}
            </div>
        );
    }
);

CoreInput.displayName = 'CoreInput';

export default CoreInput;
