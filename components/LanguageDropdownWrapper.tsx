'use client';

/**
 * Language Dropdown Wrapper
 * 
 * Wrapper component for LanguageDropdown.
 * Uses preservePath mode for ALL pages (including login).
 * 
 * Behavior:
 * - /en/login -> switch TH => /th/login (stay on login)
 * - /en/trust/verify -> switch TH => /th/trust/verify
 * - Uses replaceState to avoid Back button loop
 */

import LanguageDropdown from './LanguageDropdown';

interface LanguageDropdownWrapperProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LanguageDropdownWrapper({
    size = 'md',
    className = '',
}: LanguageDropdownWrapperProps) {
    // Always use preservePath mode - swap locale, keep current path
    // This applies to ALL pages including login
    return (
        <LanguageDropdown
            size={size}
            className={className}
            mode="preservePath"
        />
    );
}

export default LanguageDropdownWrapper;
