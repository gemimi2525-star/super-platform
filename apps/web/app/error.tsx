'use client';

/**
 * Global Error Boundary
 * Catches unhandled errors in the app
 * Fully internationalized (EN/TH/ZH)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Card, CardBody } from '@platform/ui-kit';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();
    const t = useTranslations();

    useEffect(() => {
        // Log error to console (or send to monitoring service)
        console.error('Global error caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardBody>
                    <div className="text-center space-y-6">
                        {/* Error Illustration */}
                        <div className="text-6xl">⚠️</div>

                        {/* Error Title */}
                        <div>
                            <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
                            <h2 className="text-2xl font-semibold text-gray-700">
                                {t('errors.serverError.title')}
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600">
                            {t('errors.serverError.description')}
                        </p>

                        {/* Error Details (dev only) */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className="text-left">
                                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                    {error.message}
                                    {error.digest && `\nDigest: ${error.digest}`}
                                </pre>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                            >
                                {t('errors.serverError.goHome')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={reset}
                            >
                                {t('errors.serverError.tryAgain')}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
