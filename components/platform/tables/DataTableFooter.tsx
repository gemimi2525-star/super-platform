/**
 * DataTableFooter Component
 * 
 * Reusable pagination footer for platform tables.
 * Used in: Users, Roles, Organizations pages.
 */

import type { DataTableFooterProps } from './types';

export function DataTableFooter({
    from,
    to,
    total,
    paginationText,
}: DataTableFooterProps) {
    if (total === 0) return null;

    return (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {paginationText}
                </p>
            </div>
        </div>
    );
}
