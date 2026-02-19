/**
 * System Hub Layout — Owner/Admin-Only Guard (Layer 2) + I18n
 * 
 * Phase 27A: Defense-in-depth access verification.
 *   Layer 1 (middleware.ts, Edge): Session cookie check → redirect /login
 *   Layer 2 (THIS FILE, Node.js): UID + Role verification → redirect /os if not admin+
 *   Layer 3 (page-level): Individual pages verify auth redundantly
 * 
 * EXEMPT: Only /system/login pathname is allowed without auth.
 * Access is determined by Firebase Auth UID + role check.
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
    title: 'CORE OS — System Hub',
    description: 'Consolidated Control Plane management',
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

export default async function SystemLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ═══════════════════════════════════════════════════════════════════════════
    // Layer 2 — Owner/Admin-Only Guard
    // ═══════════════════════════════════════════════════════════════════════════
    const cookieStore = await cookies();

    // ── Layer 2a: Direct cookie check (belt) ─────────────────────────────────
    const sessionCookie = cookieStore.get('__session');
    if (!sessionCookie?.value) {
        console.warn(`[SYSTEM/Layout] No __session cookie → redirect /login`);
        redirect('/login');
    }

    // ── Layer 2b: UID + Role verification (suspenders) ───────────────────────
    const context = await getAuthContext();

    if (!context) {
        console.warn(`[SYSTEM/Layout] getAuthContext() returned null → redirect /login`);
        redirect('/login');
    }

    // Phase 27A: Allow owner + admin (not just owner like /ops)
    const isOwner = context.uid === SUPER_ADMIN_ID;
    const isAdmin = context.role === 'admin';

    if (!isOwner && !isAdmin) {
        console.warn(`[SYSTEM/Layout] Access denied: uid=${context.uid}, role=${context.role} → not owner/admin → redirect /os`);
        redirect('/os');
    }

    // ✅ Owner or Admin verified — render children

    // Load i18n messages
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    const filePath = path.join(process.cwd(), 'locales', 'messages.json');
    let messages = {};

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const unifiedMessages = JSON.parse(fileContents);
        messages = transformMessages(unifiedMessages, locale);
    } catch (error) {
        console.error('Failed to load messages (System Layout):', error);
    }

    return (
        <html lang={locale}>
            <body>
                <I18nProvider locale={locale as any} messages={messages}>
                    {/* Phase 39E: Rescue Mode Banner — signals this is NOT the OS runtime */}
                    <div style={{
                        background: 'linear-gradient(90deg, #92400e 0%, #b45309 50%, #92400e 100%)',
                        color: '#fef3c7',
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: 'center' as const,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
                    }}>
                        ⚠️ RECOVERY ENVIRONMENT — This is a standalone rescue interface. For normal operation, use{' '}
                        <a href="/os" style={{ color: '#fbbf24', textDecoration: 'underline' }}>OS Shell →</a>
                    </div>
                    {children}
                </I18nProvider>
            </body>
        </html>
    );
}
