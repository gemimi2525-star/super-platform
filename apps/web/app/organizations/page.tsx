'use client';

/**
 * Organizations Page
 * Temporary landing page after authentication
 */

import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardBody } from '@platform/ui-kit';
import { useAuthStore } from '@/lib/stores/authStore';

export default function OrganizationsPage() {
    const router = useRouter();
    const { firebaseUser } = useAuthStore();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            <Card className="max-w-2xl w-full">
                <CardHeader
                    title="Welcome to Super Platform"
                    subtitle={firebaseUser?.email || 'Guest'}
                />
                <CardBody>
                    <div className="space-y-6">
                        <p className="text-gray-600">
                            This is a temporary organizations page. Select where you want to go:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                variant="primary"
                                onClick={() => router.push('/dashboard')}
                                className="w-full"
                            >
                                📊 Dashboard
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/design-system')}
                                className="w-full"
                            >
                                🎨 Design System
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/seo/sites')}
                                className="w-full"
                            >
                                🌐 SEO Sites
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/owner')}
                                className="w-full"
                            >
                                ⚙️ Owner Panel
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-3">
                                User: {firebaseUser?.email || 'Not logged in'}
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/auth/login')}
                                className="w-full"
                            >
                                🔓 Logout / Switch Account
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
