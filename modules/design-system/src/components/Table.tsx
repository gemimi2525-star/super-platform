/**
 * Table Component
 * Base table with sorting and hover states
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export interface TableColumn<T = Record<string, unknown>> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
    className?: string; // Replace width with className
}

export interface TableProps<T = Record<string, unknown>> {
    columns: TableColumn<T>[];
    data: T[];
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    emptyMessage?: string;
    className?: string;
}

export const Table = <T extends Record<string, unknown>>({
    columns,
    data,
    onSort,
    sortKey,
    sortDirection,
    emptyMessage = 'No data available',
    className = '',
}: TableProps<T>) => {
    const handleSort = (key: string, sortable?: boolean) => {
        if (!sortable || !onSort) return;
        const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort(key, newDirection);
    };

    const containerClasses = `w-full rounded-lg border border-neutral-200 overflow-hidden shadow-sm ${className}`;
    const tableClasses = 'w-full border-collapse';
    const theadClasses = 'bg-neutral-50 border-b border-neutral-200';
    const thBaseClasses = 'py-3 px-5 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap';
    const thSortableClasses = 'cursor-pointer select-none transition-colors hover:text-neutral-900';
    const tbodyClasses = 'bg-white';
    const trClasses = 'border-b border-neutral-100 transition-colors hover:bg-neutral-50';
    const tdClasses = 'py-3 px-5 text-base text-neutral-900';
    const emptyClasses = 'py-12 px-5 text-center text-neutral-500 text-base';

    return (
        <div className={containerClasses}>
            <table className={tableClasses}>
                <thead className={theadClasses}>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`${thBaseClasses} ${column.sortable ? thSortableClasses : ''} ${column.className || ''}`}
                                onClick={() => handleSort(column.key, column.sortable)}
                            >
                                <div className="flex items-center gap-1">
                                    {column.header}
                                    {column.sortable && sortKey === column.key && (
                                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className={tbodyClasses}>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={emptyClasses}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={rowIndex} className={trClasses}>
                                {columns.map((column) => (
                                    <td key={column.key} className={`${tdClasses} ${column.className || ''}`}>
                                        {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
