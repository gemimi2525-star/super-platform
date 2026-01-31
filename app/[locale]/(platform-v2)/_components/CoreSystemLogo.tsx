/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core System Logo
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.9: Fixed to use brandStore for reactive logo updates
 * 
 * Used in:
 * - TopBar (via Core System Menu trigger)
 * - Sidebar (brand identity)
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

'use client';

import React from 'react';
import { useBrandStore } from '@/lib/stores/brandStore';
import { BRAND } from '@/config/brand';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreSystemLogoProps {
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIZE CONFIGS (pixels)
// ═══════════════════════════════════════════════════════════════════════════

const SIZES = {
    sm: {
        logoPx: 20,
        text: 'text-xs',
        label: 'text-sm',
    },
    md: {
        logoPx: 24,
        text: 'text-sm',
        label: 'text-sm',
    },
    lg: {
        logoPx: 32,
        text: 'text-base',
        label: 'text-base',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreSystemLogo({
    size = 'md',
    showLabel = true,
    className = '',
}: CoreSystemLogoProps) {
    // Use brandStore directly for reactive updates
    const headerSettings = useBrandStore((state) => state.settings.header);

    // Logo URL: localStorage > default
    const logoUrl = headerSettings.logoDataUrl || BRAND.logo;
    const hasCustomLogo = !!headerSettings.logoDataUrl;

    // Use store settings for size, fallback to preset size
    const logoSize = headerSettings.logoSizePx || SIZES[size].logoPx;
    const sizeConfig = SIZES[size];

    // Whether to show brand name
    const showBrandName = showLabel && headerSettings.showBrandName;

    return (
        <div
            className={`flex items-center ${className}`}
            style={{ gap: `${headerSettings.brandGapPx}px` }}
        >
            {/* Logo Icon/Image */}
            <div
                className="rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                    width: logoSize,
                    height: logoSize,
                    background: !hasCustomLogo ? 'linear-gradient(to bottom right, #3b82f6, #2563eb)' : undefined,
                }}
            >
                {hasCustomLogo ? (
                    <Image
                        src={logoUrl}
                        alt={BRAND.name}
                        width={logoSize}
                        height={logoSize}
                        className="object-cover w-full h-full"
                        unoptimized={logoUrl.startsWith('data:')}
                        key={logoUrl} // Force re-render on URL change
                    />
                ) : (
                    <span className={`text-white font-bold ${sizeConfig.text}`}>A</span>
                )}
            </div>

            {/* Label */}
            {showBrandName && (
                <span className={`font-semibold text-neutral-800 ${sizeConfig.label}`}>
                    {BRAND.name}
                </span>
            )}
        </div>
    );
}

export default CoreSystemLogo;

