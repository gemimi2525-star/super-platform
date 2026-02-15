'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Search Input — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reusable search input field.
 *
 * @module coreos/system/shared/ui/SearchInput
 * @version 1.0.0
 */

import React from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    variant?: 'light' | 'dark';
}

export function SearchInput({ value, onChange, placeholder = 'Search...', variant = 'light' }: SearchInputProps) {
    const isDark = variant === 'dark';

    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                padding: '8px 12px',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #ddd',
                borderRadius: 6,
                fontSize: 13,
                width: 220,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                color: isDark ? '#e0e0e0' : '#333',
                outline: 'none',
            }}
        />
    );
}
