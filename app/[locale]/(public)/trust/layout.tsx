// Trust Center Layout with Language Dropdown
// Phase 6.3: Upgraded to dropdown menu

import { ReactNode, Suspense } from 'react';
import LanguageDropdown from '@/components/LanguageDropdown';

export default async function TrustCenterLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Language Dropdown - Fixed top-right */}
            <div className="fixed top-4 right-4 z-50">
                <Suspense fallback={
                    <div className="w-20 h-8 bg-gray-100 rounded-full animate-pulse" />
                }>
                    <LanguageDropdown size="md" />
                </Suspense>
            </div>

            {/* Page Content */}
            {children}
        </div>
    );
}
