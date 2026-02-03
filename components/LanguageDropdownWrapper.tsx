'use client';

/**
 * Language Dropdown Wrapper
 * 
 * Wrapper component that auto-detects the navigation mode based on current path.
 * - Login pages: goHome mode (redirect to localized home)
 * - Other pages: preservePath mode (swap locale, keep path)
 */

import { usePathname } from 'next/navigation';
import LanguageDropdown from './LanguageDropdown';

interface LanguageDropdownWrapperProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LanguageDropdownWrapper({
    size = 'md',
    className = '',
}: LanguageDropdownWrapperProps) {
    const pathname = usePathname();

    // Auto-detect mode based on path
    const isLoginPage = pathname.endsWith('/login');

    return (
        <LanguageDropdown
            size={size}
            className={className}
            mode={isLoginPage ? 'goHome' : 'preservePath'}
            homeTarget="localized"
        />
    );
}

export default LanguageDropdownWrapper;
