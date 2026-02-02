// Trust Center now uses SYNAPSE Web Template
// This file delegates to AppShell
import { ReactNode } from 'react';

export default async function TrustCenterLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Layout is now handled by individual pages using AppShell
    // This intermediate layout just passes children through
    return <>{children}</>;
}
