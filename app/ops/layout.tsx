/**
 * Ops Center Layout — Owner-Only Guard (Layer 2)
 * 
 * PHASE 22C: Server-side UID verification.
 * Middleware (Layer 1) already confirmed session cookie exists.
 * This layout verifies the UID matches NEXT_PUBLIC_SUPER_ADMIN_ID.
 * 
 * Owner is determined by Firebase Auth UID only — no email/password in code.
 * Change owner by updating NEXT_PUBLIC_SUPER_ADMIN_ID env variable.
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/server';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;

export const metadata = {
    title: 'CORE OS — Ops Center',
    description: 'Operational metrics and monitoring dashboard',
};

export default async function OpsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layer 2: Verify UID matches owner
    const context = await getAuthContext();

    if (!context) {
        // Session invalid/expired → redirect to login
        redirect('/login?callbackUrl=/ops');
    }

    if (context.uid !== SUPER_ADMIN_ID) {
        // Authenticated but not owner → redirect to OS home
        console.warn(`[OPS] Access denied: uid=${context.uid} is not owner (expected=${SUPER_ADMIN_ID})`);
        redirect('/os');
    }

    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
