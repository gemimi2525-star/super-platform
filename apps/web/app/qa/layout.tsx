/**
 * QA Routes Layout - PRODUCTION BLOCKER
 * 
 * CRITICAL: This layout blocks ALL /qa/* routes in production
 * 
 * DO NOT MODIFY unless you understand the security implications
 * QA routes (ai, foundation, manual-rank) are DEV-ONLY
 */

import { notFound } from 'next/navigation';

export default function QALayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // PRODUCTION GUARD: Block QA routes in production
    // Uses NEXT_PUBLIC_APP_ENV first, fallback to NODE_ENV
    const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV;

    if (env === 'production') {
        // Return 404 in production - QA routes should not exist
        notFound();
    }

    // DEV/TEST only - allow access
    return <>{children}</>;
}
