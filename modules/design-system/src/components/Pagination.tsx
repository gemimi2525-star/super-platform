/**
 * Pagination Component
 * Page navigation with page size and jump controls
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize?: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    showPageSize?: boolean;
    showSummary?: boolean;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    pageSize = 10,
    totalItems = 0,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    showPageSize = false,
    showSummary = true,
    className = '',
}) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const renderPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const containerClasses = `flex items-center justify-between gap-6 flex-wrap ${className}`;
    const summaryClasses = 'text-sm text-neutral-600';
    const controlsClasses = 'flex items-center gap-4';
    const selectClasses = 'px-3 py-1 text-sm rounded-md border border-neutral-300 bg-white text-neutral-700 cursor-pointer outline-none';
    const baseButtonClasses = 'px-3 py-1 text-sm font-medium rounded-md border border-neutral-300 bg-white text-neutral-700 cursor-pointer transition-all outline-none hover:bg-neutral-50';
    const disabledButtonClasses = 'px-3 py-1 text-sm font-medium rounded-md border border-neutral-300 bg-white text-neutral-700 opacity-50 cursor-not-allowed outline-none';
    const activeButtonClasses = 'px-3 py-1 text-sm font-medium rounded-md border border-primary-600 bg-primary-600 text-white cursor-pointer transition-all outline-none';
    const ellipsisClasses = 'px-1 text-neutral-400';

    return (
        <div className={containerClasses}>
            {showSummary && (
                <div className={summaryClasses}>
                    Showing {startItem} to {endItem} of {totalItems} items
                </div>
            )}

            <div className={controlsClasses}>
                {showPageSize && onPageSizeChange && (
                    <select
                        className={selectClasses}
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size} / page
                            </option>
                        ))}
                    </select>
                )}

                <button
                    className={currentPage === 1 ? disabledButtonClasses : baseButtonClasses}
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>

                {renderPageNumbers().map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className={ellipsisClasses}>
                                ...
                            </span>
                        );
                    }

                    const isActive = page === currentPage;
                    return (
                        <button
                            key={page}
                            className={isActive ? activeButtonClasses : baseButtonClasses}
                            onClick={() => onPageChange(page as number)}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    className={currentPage === totalPages ? disabledButtonClasses : baseButtonClasses}
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
