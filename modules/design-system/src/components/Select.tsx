/**
 * Select Component
 * Custom dropdown with keyboard navigation
 * Zero inline styles - Phase 15/16 compliant
 */

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    error,
    disabled = false,
    fullWidth = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    const wrapperClasses = `flex flex-col gap-1 relative ${fullWidth ? 'w-full' : 'w-auto'} ${className}`;
    const labelClasses = 'text-sm font-medium text-neutral-700';

    const triggerBaseClasses = 'flex items-center justify-between py-2 px-4 text-base border rounded-md transition-all outline-none';
    const triggerColorClasses = selectedOption ? 'text-neutral-900' : 'text-neutral-500';
    const triggerBgClasses = disabled ? 'bg-neutral-50' : 'bg-white';
    const triggerBorderClasses = error ? 'border-danger-500' : 'border-neutral-300 focus:border-primary-500';
    const triggerCursorClasses = disabled ? 'cursor-not-allowed' : 'cursor-pointer';
    const triggerClasses = `${triggerBaseClasses} ${triggerColorClasses} ${triggerBgClasses} ${triggerBorderClasses} ${triggerCursorClasses}`;

    const dropdownClasses = 'absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-[1000] max-h-60 overflow-y-auto';
    const errorClasses = 'text-sm text-danger-600';

    return (
        <div ref={containerRef} className={wrapperClasses}>
            {label && <label className={labelClasses}>{label}</label>}
            <div
                className={triggerClasses}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span>{selectedOption?.label || placeholder}</span>
                <span className={`transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    ▼
                </span>
            </div>
            {isOpen && !disabled && (
                <div className={dropdownClasses} role="listbox">
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        const optionClasses = `py-2 px-4 text-base cursor-pointer transition-colors ${isSelected
                                ? 'text-primary-700 bg-primary-50 hover:bg-primary-100'
                                : 'text-neutral-700 bg-transparent hover:bg-neutral-50'
                            }`;

                        return (
                            <div
                                key={option.value}
                                className={optionClasses}
                                onClick={() => {
                                    onChange?.(option.value);
                                    setIsOpen(false);
                                }}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {option.label}
                            </div>
                        );
                    })}
                </div>
            )}
            {error && (
                <div className={errorClasses}>{error}</div>
            )}
        </div>
    );
};
