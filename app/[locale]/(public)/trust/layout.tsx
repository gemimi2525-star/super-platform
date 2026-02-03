// Trust Center Layout
// Dropdown is now rendered in [locale]/layout.tsx (parent layout)

import { ReactNode } from 'react';

export default async function TrustCenterLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Content */}
            {children}
        </div>
    );
}
