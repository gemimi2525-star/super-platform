'use client';

/**
 * Organizations Page
 * Temporary landing page after authentication
 * Fully internationalized
 */

import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardBody } from '@platform/ui-kit';
import { useAuthStore } from '@/lib/stores/authStore';
import { LanguageSwitcher } from '@modules/seo';
import { useTranslations } from 'next-intl';

export default function OrganizationsPage() {
    const router = useRouter();
    const { firebaseUser } = useAuthStore();
    const t = useTranslations();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            {/* Language Switcher - Top Right */}
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <Card className="max-w-2xl w-full">
                <CardHeader
                    title={t('organizations.welcome')}
                    subtitle={firebaseUser?.email || t('organizations.guest')}
                />
                <CardBody>
                    <div className="space-y-6">
                        <p className="text-gray-600">
                            {t('organizations.description')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                variant="primary"
                                onClick={() => router.push('/dashboard')}
                                className="w-full"
                            >
                                📊 {t('organizations.dashboard')}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/design-system')}
                                className="w-full"
                            >
                                🎨 {t('organizations.designSystem')}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/seo/sites')}
                                className="w-full"
                            >
                                🌐 {t('organizations.seoSites')}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/owner')}
                                className="w-full"
                            >
                                ⚙️ {t('organizations.ownerPanel')}
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-3">
                                {t('organizations.user')}: {firebaseUser?.email || t('organizations.notLoggedIn')}
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/auth/login')}
                                className="w-full"
                            >
                                🔓 {t('organizations.logoutSwitch')}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
