/**
 * Select Component
 * 
 * Dropdown selection with search support
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    multiple?: boolean;
    searchable?: boolean;
    placeholder?: string;
    label?: string;
    error?: string;
    className?: string;
    disabled?: boolean;
}

export function Select({
    options,
    value,
    onChange,
    multiple = false,
    searchable = false,
    placeholder = 'Select...',
    label,
    error,
    className = '',
    disabled = false,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    const filteredOptions = searchable
        ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (multiple) {
            const newValue = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];
            onChange(newValue);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(multiple ? [] : '');
    };

    const displayText = selectedValues.length > 0
        ? selectedValues.map(v => options.find(o => o.value === v)?.label).join(', ')
        : placeholder;

    return (
        <div className={`w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <div
                    className={`
                        flex items-center justify-between
                        w-full px-3 py-2
                        border rounded-lg
                        transition-all
                        ${disabled
                            ? 'bg-gray-50 cursor-not-allowed opacity-60'
                            : 'cursor-pointer'
                        }
                        ${error
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }
                        ${isOpen ? 'ring-2 ring-blue-200' : ''}
                    `}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                >
                    <span className={selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                        {displayText}
                    </span>
                    <div className="flex items-center gap-2">
                        {selectedValues.length > 0 && (
                            <X
                                className="w-4 h-4 text-gray-400 hover:text-gray-600"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''
                                }`}
                        />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {searchable && (
                            <div className="p-2 border-b border-gray-200">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        <div className="py-1">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-3 py-2 cursor-pointer transition-colors
                                            ${selectedValues.includes(option.value)
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'hover:bg-gray-100 text-gray-900'
                                            }
                                        `}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        {option.label}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
