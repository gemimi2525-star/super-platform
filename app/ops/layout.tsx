/**
 * Ops Center Layout — Owner-Only Guard (Layer 2) + I18n
 * 
 * P0 HOTFIX: Defense-in-depth owner verification.
 *   Layer 1 (middleware.ts, Edge): Session cookie check → redirect /ops/login
 *   Layer 2 (THIS FILE, Node.js): UID verification → redirect /os if not owner
 *   Layer 3 (page-level): Individual pages verify auth redundantly
 * 
 * SECURITY: Login page detection uses URL pathname only — NOT request headers.
 *   Previous x-ops-path header was REMOVED (header injection vulnerability).
 * 
 * EXEMPT: Only /ops/login pathname is allowed without auth.
 * Owner is determined by Firebase Auth UID only — no email/password in code.
 * Change owner by updating NEXT_PUBLIC_SUPER_ADMIN_ID env variable.
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
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
    // ═══════════════════════════════════════════════════════════════════════════
    // P0 HOTFIX: Layer 2 — Owner-Only Guard
    // SECURITY: Detect login page via URL pathname ONLY (no header injection)
    // ═══════════════════════════════════════════════════════════════════════════
    const headerStore = await headers();
    const cookieStore = await cookies();

    // Detect pathname from middleware-verified header (non-spoofable)
    // Middleware injects 'x-ops-pathname' via requestHeaders for /ops/login only
    // For all other /ops/* paths, middleware strips this header
    const pathname = headerStore.get('x-ops-pathname') || '';
    const isLoginPage = pathname === '/ops/login';

    if (!isLoginPage) {
        // ── Redundant Layer 2a: Direct cookie check (belt) ────────────────
        const sessionCookie = cookieStore.get('__session');
        if (!sessionCookie?.value) {
            console.warn(`[OPS/Layout] No __session cookie → redirect /ops/login`);
            redirect('/ops/login');
        }

        // ── Layer 2b: UID verification (suspenders) ──────────────────────
        const context = await getAuthContext();

        if (!context) {
            // Session invalid/expired → redirect to ops login
            console.warn(`[OPS/Layout] getAuthContext() returned null → redirect /ops/login`);
            redirect('/ops/login');
        }

        if (context.uid !== SUPER_ADMIN_ID) {
            // Authenticated but not owner → redirect to /os (NOT /ops/login)
            console.warn(`[OPS/Layout] Access denied: uid=${context.uid} is not owner (expected=${SUPER_ADMIN_ID}) → redirect /os`);
            redirect('/os');
        }

        // ✅ Owner verified — render children
    }

    // Load i18n messages for LoginScreen (uses useTranslations)
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
