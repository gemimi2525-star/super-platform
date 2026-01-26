/**
 * TableStates Components
 * 
 * Reusable loading, empty, and error state components for platform tables.
 * Used in: Users, Roles, Organizations pages.
 */

import type {
    TableLoadingSkeletonProps,
    TableEmptyStateProps,
    TableErrorAlertProps
} from './types';

/**
 * Loading skeleton for tables
 */
export function TableLoadingSkeleton({ rows = 5 }: TableLoadingSkeletonProps) {
    return (
        <div className="space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-10 bg-gray-100 rounded flex-1"></div>
                    <div className="h-10 bg-gray-100 rounded w-24"></div>
                    <div className="h-10 bg-gray-100 rounded w-24"></div>
                    <div className="h-10 bg-gray-100 rounded w-32"></div>
                    <div className="h-10 bg-gray-100 rounded w-16"></div>
                </div>
            ))}
        </div>
    );
}

/**
 * Empty state for tables
 */
export function TableEmptyState({
    icon = '📄',
    title,
    description,
    action
}: TableEmptyStateProps) {
    return (
        <div className="p-12 text-center">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}

/**
 * Error alert for tables
 */
export function TableErrorAlert({
    message,
    onRetry,
    retryLabel = 'Retry'
}: TableErrorAlertProps) {
    return (
        <div className="bg-error-soft border border-error-border text-error px-4 py-3 rounded-lg flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
                <p className="font-medium text-sm">{message}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-sm underline hover:no-underline"
                >
                    {retryLabel}
                </button>
            )}
        </div>
    );
}
