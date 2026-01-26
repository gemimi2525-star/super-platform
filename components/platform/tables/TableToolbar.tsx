/**
 * TableToolbar Component
 * 
 * Reusable toolbar with search, selection count, rows-per-page, and density toggle.
 * Used in: Users, Roles, Organizations pages.
 * 
 * Features:
 * - Search input with icon
 * - Selection count badge (optional)
 * - Rows per page dropdown (optional)
 * - Density toggle (optional)
 * - All text passed as props (i18n-ready)
 */

import type { TableToolbarProps } from './types';

export function TableToolbar({
    // Search
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',

    // Selection
    selectedCount = 0,
    selectedCountLabel,

    // Rows per page
    rowsPerPage,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 25, 50, 100],
    rowsPerPageLabel,

    // Density
    density,
    onDensityChange,
    densityLabels = { default: 'Default', dense: 'Dense' },

    // Features
    showDensityToggle = true,
    showRowsPerPage = true,
}: TableToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left side: Search + Selection */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                {/* Search - Full width on mobile */}
                <div className="relative w-full md:w-[280px]">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:ring-opacity-20 focus:border-accent transition-all"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        🔍
                    </span>
                </div>

                {/* Mobile Row 2 Container for Selection + Pagination */}
                <div className="flex items-center gap-3 justify-between md:justify-start">
                    {/* Selection count */}
                    {selectedCount > 0 && selectedCountLabel && (
                        <div className="px-3 py-2 bg-accent-soft text-accent rounded-lg text-sm font-medium whitespace-nowrap">
                            {selectedCountLabel}
                        </div>
                    )}

                    {/* Rows per page */}
                    {showRowsPerPage && (
                        <select
                            value={rowsPerPage}
                            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:ring-opacity-20 focus:border-accent bg-white text-gray-800"
                        >
                            {rowsPerPageOptions.map((count) => (
                                <option key={count} value={count}>
                                    {rowsPerPageLabel ? rowsPerPageLabel(count) : `${count} rows`}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Right side: Density toggle (Moved here for mobile if needed, or keep separate) */}
                    {/* For this request, Density is Row 2. Let's keep it in flow or separate? */}
                    {/* Request: Row 2: Page size + Density (2 columns) */}
                    {showDensityToggle && (
                        <div className="hidden md:flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
                            <button
                                onClick={() => onDensityChange('default')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${density === 'default'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                {densityLabels.default}
                            </button>
                            <button
                                onClick={() => onDensityChange('dense')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${density === 'dense'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                {densityLabels.dense}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Density Toggle (Visible only on mobile, Row 2 Right equivalent) */}
            {showDensityToggle && (
                <div className="md:hidden flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50 w-full justify-center">
                    <button
                        onClick={() => onDensityChange('default')}
                        className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${density === 'default'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {densityLabels.default}
                    </button>
                    <button
                        onClick={() => onDensityChange('dense')}
                        className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${density === 'dense'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {densityLabels.dense}
                    </button>
                </div>
            )}
        </div>
    );
}
