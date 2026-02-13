/**
 * Ops Center Layout — Owner-Only Guard (Layer 2) + I18n
 * 
 * PHASE 22C: Server-side UID verification.
 * Middleware (Layer 1) already confirmed session cookie exists.
 * This layout verifies the UID matches NEXT_PUBLIC_SUPER_ADMIN_ID.
 * 
 * EXEMPT: /ops/login is detected via x-ops-path header injected by middleware.
 * 
 * Owner is determined by Firebase Auth UID only — no email/password in code.
 * Change owner by updating NEXT_PUBLIC_SUPER_ADMIN_ID env variable.
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { getAuthContext } from '@/lib/auth/server';
import { I18nProvider } from '@/lib/i18n';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;

export const metadata = {
    title: 'CORE OS — Ops Center',
    description: 'Operational metrics and monitoring dashboard',
};

function transformMessages(unifiedMessages: Record<string, any>, locale: string): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [flatKey, translations] of Object.entries(unifiedMessages)) {
        const value = (translations as Record<string, string>)[locale] ||
            (translations as Record<string, string>)['en'] ||
            flatKey;

        const keys = flatKey.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    return result;
}

export default async function OpsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check x-ops-path header injected by middleware for /ops/login
    const headerStore = await headers();
    const opsPath = headerStore.get('x-ops-path') || '';
    const isLoginPage = opsPath.includes('/ops/login');

    if (!isLoginPage) {
        // Layer 2: Verify UID matches owner (only for non-login pages)
        const context = await getAuthContext();

        if (!context) {
            // Session invalid/expired → redirect to ops login
            redirect('/ops/login');
        }

        if (context.uid !== SUPER_ADMIN_ID) {
            // Authenticated but not owner → redirect to ops login
            console.warn(`[OPS] Access denied: uid=${context.uid} is not owner (expected=${SUPER_ADMIN_ID})`);
            redirect('/ops/login');
        }
    }

    // Load i18n messages for LoginScreen (uses useTranslations)
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    const filePath = path.join(process.cwd(), 'locales', 'messages.json');
    let messages = {};

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const unifiedMessages = JSON.parse(fileContents);
        messages = transformMessages(unifiedMessages, locale);
    } catch (error) {
        console.error('Failed to load messages (Ops Layout):', error);
    }

    return (
        <html lang={locale}>
            <body>
                <I18nProvider locale={locale as any} messages={messages}>
                    {children}
                </I18nProvider>
            </body>
        </html>
    );
}
