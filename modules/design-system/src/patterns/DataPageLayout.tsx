/**
 * DataPageLayout Pattern
 * Search/Filters + Table + Empty/Error states
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export interface DataPageLayoutProps {
    searchBar?: React.ReactNode;
    filters?: React.ReactNode;
    table: React.ReactNode;
    pagination?: React.ReactNode;
    isEmpty?: boolean;
    isError?: boolean;
    isLoading?: boolean;
    emptyState?: React.ReactNode;
    errorState?: React.ReactNode;
    loadingState?: React.ReactNode;
    className?: string;
}

export const DataPageLayout: React.FC<DataPageLayoutProps> = ({
    searchBar,
    filters,
    table,
    pagination,
    isEmpty = false,
    isError = false,
    isLoading = false,
    emptyState,
    errorState,
    loadingState,
    className = '',
}) => {
    const defaultLoadingState = (
        <div className="flex items-center justify-center min-h-[400px] text-neutral-500">
            Loading...
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return loadingState || defaultLoadingState;
        }

        if (isError && errorState) {
            return errorState;
        }

        if (isEmpty && emptyState) {
            return emptyState;
        }

        return table;
    };

    return (
        <div className={`flex flex-col gap-6 ${className}`}>
            {(searchBar || filters) && (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {searchBar && <div className="flex-1 min-w-[240px]">{searchBar}</div>}
                    {filters && <div className="flex items-center gap-4">{filters}</div>}
                </div>
            )}

            <div className="bg-white rounded-lg min-h-[400px] flex flex-col">
                {renderContent()}
            </div>

            {pagination && !isEmpty && !isError && !isLoading && (
                <div>{pagination}</div>
            )}
        </div>
    );
};
