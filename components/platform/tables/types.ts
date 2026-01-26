/**
 * Shared TypeScript types for platform table components
 */

export type TableDensity = 'default' | 'dense';

export interface TablePaginationState {
    rowsPerPage: number;
    currentPage: number;
}

export interface TableSelectionState {
    selectedIds: Set<string>;
}

export interface TableToolbarProps {
    // Search
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    // Selection
    selectedCount?: number;
    selectedCountLabel?: string;

    // Rows per page
    rowsPerPage: number;
    onRowsPerPageChange: (value: number) => void;
    rowsPerPageOptions?: number[];
    rowsPerPageLabel?: (count: number) => string;

    // Density toggle
    density: TableDensity;
    onDensityChange: (value: TableDensity) => void;
    densityLabels?: {
        default: string;
        dense: string;
    };

    // Optional features
    showDensityToggle?: boolean;
    showRowsPerPage?: boolean;
}

export interface DataTableFooterProps {
    from: number;
    to: number;
    total: number;
    paginationText: string;
}

export interface TableEmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export interface TableErrorAlertProps {
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
}

export interface TableLoadingSkeletonProps {
    rows?: number;
}
