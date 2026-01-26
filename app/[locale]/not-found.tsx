'use client';

/**
 * 404 Not Found Page
 * Shown when user navigates to invalid route
 * Fully internationalized (EN/TH/ZH)
 */

import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { Button, Card, CardBody } from '@super-platform/ui';

export default function NotFound() {
    const router = useRouter();
    const t = useTranslations();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardBody>
                    <div className="text-center space-y-6">
                        {/* 404 Illustration */}
                        <div className="text-6xl">🔍</div>

                        {/* Error Code */}
                        <div>
                            <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
                            <h2 className="text-2xl font-semibold text-gray-700">
                                {t('errors.notFound.title')}
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600">
                            {t('errors.notFound.description')}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                {t('common.back')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => router.push('/dashboard')}
                            >
                                {t('errors.notFound.goHome')}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
