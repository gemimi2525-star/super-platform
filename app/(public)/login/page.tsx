'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/os-shell/LoginScreen';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = async (idToken: string) => {
        try {
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });
            if (res.ok) {
                // Redirect to /os
                router.replace('/os');
                router.refresh();
            } else {
                console.error('Failed to create session');
            }
        } catch (err) {
            console.error('Login error', err);
        }
    };

    // Dropdown is now rendered in (public)/layout.tsx
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
