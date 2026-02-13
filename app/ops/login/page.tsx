'use client';

/**
 * Ops Login Page — Dedicated entry point for /ops
 * 
 * Reuses the existing LoginScreen component but hardcodes
 * callbackUrl=/ops so login always returns to Ops Center.
 * 
 * This page is exempted from the /ops auth guard in middleware
 * to prevent redirect loops.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/os-shell/LoginScreen';

export default function OpsLoginPage() {
    const router = useRouter();

    const handleLoginSuccess = async (idToken: string) => {
        try {
            console.log('[OPS-LOGIN] Creating session...');
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });
            if (res.ok) {
                console.log('[OPS-LOGIN] REDIRECT -> /ops (session created)');
                router.replace('/ops');
                router.refresh();
            } else {
                console.error('[OPS-LOGIN] Failed to create session');
            }
        } catch (err) {
            console.error('[OPS-LOGIN] Login error', err);
        }
    };

    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
