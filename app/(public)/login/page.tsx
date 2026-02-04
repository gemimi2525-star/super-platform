'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginScreen } from '@/components/os-shell/LoginScreen';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Phase 9.8: Read callbackUrl from search params (default to /os)
    const callbackUrl = searchParams.get('callbackUrl') || '/os';

    const handleLoginSuccess = async (idToken: string) => {
        try {
            console.log('[LOGIN] Creating session...');
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });
            if (res.ok) {
                // Phase 9.8: Use callbackUrl from search params
                console.log(`[LOGIN] REDIRECT -> ${callbackUrl} (session created)`);
                router.replace(callbackUrl);
                router.refresh();
            } else {
                console.error('[LOGIN] Failed to create session');
            }
        } catch (err) {
            console.error('[LOGIN] Login error', err);
        }
    };

    // Dropdown is now rendered in (public)/layout.tsx
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
