/**
 * EmptyState Component
 * Display for empty data, no results, or error states
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export type EmptyStateVariant = 'empty' | 'no-results' | 'error';

export interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title?: string;
    message?: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const defaultContent: Record<EmptyStateVariant, { title: string; message: string; icon: string }> = {
    empty: {
        title: 'No data available',
        message: 'There is no data to display at the moment.',
        icon: '📭',
    },
    'no-results': {
        title: 'No results found',
        message: 'Try adjusting your search or filters.',
        icon: '🔍',
    },
    error: {
        title: 'Something went wrong',
        message: 'We encountered an error loading this data.',
        icon: '⚠️',
    },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    variant = 'empty',
    title,
    message,
    icon,
    action,
    className = '',
}) => {
    const content = defaultContent[variant];

    return (
        <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}>
            {(icon || content.icon) && (
                <div className="text-6xl mb-6 opacity-50">
                    {icon || content.icon}
                </div>
            )}
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title || content.title}</h3>
            <p className="text-base text-neutral-600 mb-8 max-w-md">{message || content.message}</p>
            {action && (
                <button
                    className="px-6 py-2 text-base font-medium text-white bg-primary-600 border-none rounded-md cursor-pointer transition-colors hover:bg-primary-700"
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
