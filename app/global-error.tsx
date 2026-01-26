'use client';

/**
 * Global Error Page
 * Catches errors at the root level (outside locale)
 * This is the last resort error handler
 * 
 * IMPORTANT: Must include <html> and <body> tags
 */

import { useEffect } from 'react';
import { handleError } from '@super-platform/core';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Handle and report error with FATAL severity
        handleError(error, {
            severity: 'fatal',
            context: {
                route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
                userRole: 'unknown', // Auth info usually unavailable in global crash
                environment: process.env.NODE_ENV
            }
        });
    }, [error]);

    const isDev = process.env.NODE_ENV === 'development';

    return (
        <html lang="en">
            <body>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                        <div className="space-y-6">
                            {/* Error Icon */}
                            <div className="text-4xl">⚠️</div>

                            {/* Error Title */}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Something went wrong
                                </h1>
                            </div>

                            {/* Description - User Friendly */}
                            <p className="text-gray-600">
                                We're sorry, something went wrong. Please return to the dashboard.
                            </p>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Refresh Page
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                                >
                                    Back to Dashboard
                                </button>
                            </div>

                            {/* Dev Details - Only show if strictly in DEV */}
                            {isDev && (
                                <div className="mt-6 text-left border-t pt-4">
                                    <p className="text-xs font-mono text-gray-500 mb-2">Dev Details:</p>
                                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 text-red-600">
                                        {error.message}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
