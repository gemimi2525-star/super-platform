// Trust Center Layout with Language Switcher
// Phase 6.2: Added global language toggle for EN/TH

import { ReactNode, Suspense } from 'react';
import SimpleLanguageSwitcher from '@/components/SimpleLanguageSwitcher';

export default async function TrustCenterLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Language Bar */}
            <div className="fixed top-4 right-4 z-50">
                <Suspense fallback={
                    <div className="w-16 h-8 bg-gray-100 rounded-full animate-pulse" />
                }>
                    <SimpleLanguageSwitcher size="md" />
                </Suspense>
            </div>

            {/* Page Content */}
            {children}
        </div>
    );
}
