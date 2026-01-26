'use client';

/**
 * BrandLogo Component
 * 
 * Displays the brand logo in a circular container.
 * Uses BrandContext for dynamic logo (from Firebase) with fallback.
 * Supports different scales for different locations (header, login).
 * 
 * Usage: <BrandLogo size="sm" location="header" />
 */

import { BRAND } from '@/config/brand';
import { useBrand } from '@/contexts/BrandContext';
import Image from 'next/image';

type LogoLocation = 'header' | 'sidebar' | 'login' | 'preview';

interface BrandLogoProps {
    /** Size preset for the logo */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Location context for scale selection */
    location?: LogoLocation;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show a border */
    bordered?: boolean;
}

const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
} as const;

export function BrandLogo({
    size = 'md',
    location = 'preview',
    className = '',
    bordered = false
}: BrandLogoProps) {
    const { logoUrl, header, sidebar, login } = useBrand();
    const baseDimension = sizeMap[size];

    // Get scale based on location
    let scale = 100;
    if (location === 'header') {
        scale = header.logoScale;
    } else if (location === 'sidebar') {
        scale = sidebar.logoScale;
    } else if (location === 'login') {
        scale = login.logoScale;
    }

    const dimension = Math.round(baseDimension * (scale / 100));

    return (
        <div
            className={`
                rounded-full overflow-hidden flex-shrink-0
                ${bordered ? 'border border-gray-200 shadow-sm' : ''}
                ${className}
            `}
            style={{ width: dimension, height: dimension }}
        >
            <Image
                src={logoUrl || BRAND.logo}
                alt={BRAND.name}
                width={dimension}
                height={dimension}
                className="object-cover w-full h-full"
                priority
                unoptimized={logoUrl?.startsWith('http')}
            />
        </div>
    );
}

/** Export brand config for easy access */
export { BRAND };
