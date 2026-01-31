/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreTable
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Core UI Component
 * 
 * Base table component using Core System tokens.
 * Includes: header, rows, empty state, loading state
 * 
 * NOTE: No pagination/sorting/filtering — those are app-layer concerns
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreTableProps extends HTMLAttributes<HTMLTableElement> {
    /** Apply striped rows */
    striped?: boolean;
    /** Make table hoverable */
    hoverable?: boolean;
    /** Make table compact */
    compact?: boolean;
    /** Full width */
    fullWidth?: boolean;
    children: ReactNode;
}

export interface CoreTableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
    children: ReactNode;
}

export interface CoreTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
    children: ReactNode;
}

export interface CoreTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    /** Highlight row */
    selected?: boolean;
    children: ReactNode;
}

export interface CoreTableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
    /** Align content */
    align?: 'left' | 'center' | 'right';
    children?: ReactNode;
}

export interface CoreTableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
    /** Align content */
    align?: 'left' | 'center' | 'right';
    children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'var(--os-font-sans)',
    fontSize: 'var(--os-text-sm)',
    color: 'var(--os-color-text)',
};

const headerCellStyles: React.CSSProperties = {
    padding: 'var(--os-space-3) var(--os-space-4)',
    fontWeight: 600,
    fontSize: 'var(--os-text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--os-color-text-secondary)',
    backgroundColor: 'var(--os-color-surface-alt)',
    borderBottom: '1px solid var(--os-color-border)',
    textAlign: 'left',
};

const cellStyles: React.CSSProperties = {
    padding: 'var(--os-space-3) var(--os-space-4)',
    borderBottom: '1px solid var(--os-color-border-subtle)',
    textAlign: 'left',
};

const compactCellPadding = 'var(--os-space-2) var(--os-space-3)';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TABLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CoreTable = forwardRef<HTMLTableElement, CoreTableProps>(
    (
        {
            striped = false,
            hoverable = false,
            compact = false,
            fullWidth = true,
            children,
            style,
            className = '',
            ...props
        },
        ref
    ) => {
        const stripedClass = striped ? 'core-table--striped' : '';
        const hoverableClass = hoverable ? 'core-table--hoverable' : '';
        const compactClass = compact ? 'core-table--compact' : '';

        return (
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table
                    ref={ref}
                    className={`core-table ${stripedClass} ${hoverableClass} ${compactClass} ${className}`}
                    style={{
                        ...tableStyles,
                        width: fullWidth ? '100%' : 'auto',
                        ...style,
                    }}
                    {...props}
                >
                    {children}
                </table>
            </div>
        );
    }
);

CoreTable.displayName = 'CoreTable';

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

export const CoreTableHead = forwardRef<HTMLTableSectionElement, CoreTableHeadProps>(
    ({ children, className = '', ...props }, ref) => (
        <thead ref={ref} className={`core-table__head ${className}`} {...props}>
            {children}
        </thead>
    )
);

CoreTableHead.displayName = 'CoreTableHead';

export const CoreTableBody = forwardRef<HTMLTableSectionElement, CoreTableBodyProps>(
    ({ children, className = '', ...props }, ref) => (
        <tbody ref={ref} className={`core-table__body ${className}`} {...props}>
            {children}
        </tbody>
    )
);

CoreTableBody.displayName = 'CoreTableBody';

export const CoreTableRow = forwardRef<HTMLTableRowElement, CoreTableRowProps>(
    ({ selected = false, children, style, className = '', ...props }, ref) => (
        <tr
            ref={ref}
            className={`core-table__row ${selected ? 'core-table__row--selected' : ''} ${className}`}
            style={{
                backgroundColor: selected ? 'var(--os-color-primary-subtle)' : undefined,
                transition: 'background-color var(--os-motion-fast) ease-out',
                ...style,
            }}
            {...props}
        >
            {children}
        </tr>
    )
);

CoreTableRow.displayName = 'CoreTableRow';

export const CoreTableHeader = forwardRef<HTMLTableCellElement, CoreTableHeaderProps>(
    ({ align = 'left', children, style, className = '', ...props }, ref) => (
        <th
            ref={ref}
            className={`core-table__header ${className}`}
            style={{
                ...headerCellStyles,
                textAlign: align,
                ...style,
            }}
            {...props}
        >
            {children}
        </th>
    )
);

CoreTableHeader.displayName = 'CoreTableHeader';

export const CoreTableCell = forwardRef<HTMLTableCellElement, CoreTableCellProps>(
    ({ align = 'left', children, style, className = '', ...props }, ref) => (
        <td
            ref={ref}
            className={`core-table__cell ${className}`}
            style={{
                ...cellStyles,
                textAlign: align,
                ...style,
            }}
            {...props}
        >
            {children}
        </td>
    )
);

CoreTableCell.displayName = 'CoreTableCell';

// ═══════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreTableLoadingProps {
    /** Number of placeholder rows */
    rows?: number;
    /** Number of columns */
    columns?: number;
}

export function CoreTableLoading({ rows = 5, columns = 4 }: CoreTableLoadingProps) {
    return (
        <CoreTable>
            <CoreTableHead>
                <CoreTableRow>
                    {Array.from({ length: columns }).map((_, i) => (
                        <CoreTableHeader key={i}>
                            <div
                                style={{
                                    height: '12px',
                                    width: '60%',
                                    backgroundColor: 'var(--os-color-surface-alt)',
                                    borderRadius: 'var(--os-radius-sm)',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                }}
                            />
                        </CoreTableHeader>
                    ))}
                </CoreTableRow>
            </CoreTableHead>
            <CoreTableBody>
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <CoreTableRow key={rowIdx}>
                        {Array.from({ length: columns }).map((_, colIdx) => (
                            <CoreTableCell key={colIdx}>
                                <div
                                    style={{
                                        height: '16px',
                                        width: `${60 + Math.random() * 30}%`,
                                        backgroundColor: 'var(--os-color-surface-alt)',
                                        borderRadius: 'var(--os-radius-sm)',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        animationDelay: `${rowIdx * 0.1}s`,
                                    }}
                                />
                            </CoreTableCell>
                        ))}
                    </CoreTableRow>
                ))}
            </CoreTableBody>
        </CoreTable>
    );
}

export default CoreTable;
