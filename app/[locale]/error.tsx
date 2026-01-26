'use client';

/**
 * Locale-Level Error Page
 * Catches errors within the locale routes
 * Enhanced with global error handler utilities
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { Button, Card, CardBody } from '@super-platform/ui';
import { handleError, formatError, shouldShowStack } from '@super-platform/core';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations();

    useEffect(() => {
        // Handle and report error using global handler
        handleError(error, {
            severity: 'error', // Recoverable error
            context: {
                route: pathname,
                component: 'PageError'
            }
        });
    }, [error, pathname]);

    const isDev = shouldShowStack();
    // const isDev = false; // Forced for testing
    // Use formatError to get error details without logging (pure function)
    const errorInfo = formatError(error);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardBody>
                    <div className="text-center space-y-6">
                        {/* Error Icon */}
                        <div className="text-6xl">{isDev ? '⚠️' : '😔'}</div>

                        {/* Error Title */}
                        <div>
                            <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
                            <h2 className="text-2xl font-semibold text-gray-700">
                                {isDev ? 'Application Error' : t('errors.serverError.title')}
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600">
                            {isDev
                                ? 'An error occurred in the application. See details below.'
                                : t('errors.serverError.description')}
                        </p>

                        {/* Error ID - Always show */}
                        <div className="bg-gray-100 rounded-lg p-3 text-sm">
                            <span className="text-gray-500">Error ID: </span>
                            <code className="font-mono text-gray-800">{errorInfo.errorId}</code>
                        </div>

                        {/* Error Details (Development Only) */}
                        {isDev && (
                            <details className="text-left bg-gray-50 rounded-lg p-4">
                                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                                    Technical Details (Development Only)
                                </summary>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div>
                                        <strong className="text-gray-700">Name:</strong>{' '}
                                        <code className="text-red-600">{error.name}</code>
                                    </div>
                                    <div>
                                        <strong className="text-gray-700">Message:</strong>{' '}
                                        <span className="text-gray-900">{error.message}</span>
                                    </div>
                                    {error.digest && (
                                        <div>
                                            <strong className="text-gray-700">Digest:</strong>{' '}
                                            <code className="text-gray-600">{error.digest}</code>
                                        </div>
                                    )}
                                    {error.stack && (
                                        <div>
                                            <strong className="text-gray-700">Stack Trace:</strong>
                                            <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-40">
                                                {error.stack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Production Message */}
                        {!isDev && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                                <p>
                                    If the problem persists, please contact support with the Error
                                    ID shown above.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/platform')}
                            >
                                {isDev ? 'Go to Dashboard' : t('errors.serverError.goHome')}
                            </Button>
                            <Button variant="primary" onClick={reset}>
                                {isDev ? 'Try Again' : t('errors.serverError.tryAgain')}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
