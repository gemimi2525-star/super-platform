/**
 * Table Component
 * 
 * Display tabular data with sorting and selection
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ColumnDef<T> {
    key: string;
    header: string;
    render?: (row: T, index: number) => React.ReactNode;
    sortable?: boolean;
}

export interface TableProps<T = any> {
    columns: ColumnDef<T>[];
    data: T[];
    loading?: boolean;
    onRowClick?: (row: T) => void;
    keyExtractor: (row: T) => string;
    emptyMessage?: string;
}

export function Table<T = any>({
    columns,
    data,
    loading = false,
    onRowClick,
    keyExtractor,
    emptyMessage = 'No data available',
}: TableProps<T>) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, index) => (
                        <tr
                            key={keyExtractor(row)}
                            className={`
                                transition-colors
                                ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                            `}
                            onClick={() => onRowClick?.(row)}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    {column.render
                                        ? column.render(row, index) // Pass index
                                        : String((row as any)[column.key] ?? '-')
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
