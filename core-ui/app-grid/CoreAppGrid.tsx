/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreAppGrid
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: Responsive app grid layout for Core Hub
 * 
 * Grid rules:
 * - Desktop: 5-6 columns (auto-fit minmax)
 * - Tablet: 3-4 columns
 * - Mobile: 2 columns
 * 
 * Uses CSS Grid with auto-fit for responsive behavior.
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreAppGridProps extends HTMLAttributes<HTMLDivElement> {
    /** Grid items (CoreAppIcon components) */
    children: ReactNode;
    /** Minimum item width for auto-fit */
    minItemWidth?: number;
    /** Maximum columns */
    maxColumns?: number;
    /** Gap between items */
    gap?: 'sm' | 'md' | 'lg';
    /** Padding inside the grid */
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreAppGrid = forwardRef<HTMLDivElement, CoreAppGridProps>(
    function CoreAppGrid(
        {
            children,
            minItemWidth = 88,
            maxColumns = 6,
            gap = 'md',
            padding = 'md',
            className = '',
            style,
            ...props
        },
        ref
    ) {
        // Gap values
        const gapValues = {
            sm: 'var(--os-space-3)',
            md: 'var(--os-space-4)',
            lg: 'var(--os-space-6)',
        };

        // Padding values
        const paddingValues = {
            none: '0',
            sm: 'var(--os-space-3)',
            md: 'var(--os-space-4)',
            lg: 'var(--os-space-6)',
        };

        const gridStyles: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
            gap: gapValues[gap],
            padding: paddingValues[padding],
            justifyItems: 'center',
            alignItems: 'start',
            width: '100%',
            ...style,
        };

        // Add max-columns constraint via CSS custom property
        const cssVars = {
            '--core-app-grid-max-cols': maxColumns,
        } as React.CSSProperties;

        return (
            <div
                ref={ref}
                role="grid"
                aria-label="App grid"
                className={`core-app-grid ${className}`}
                style={{ ...gridStyles, ...cssVars }}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CoreAppGrid.displayName = 'CoreAppGrid';

export default CoreAppGrid;
