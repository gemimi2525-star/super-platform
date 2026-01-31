'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/os-shell/LoginScreen';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = async () => {
        try {
            const res = await fetch('/api/auth/session', { method: 'POST' });
            if (res.ok) {
                // Redirect to /os
                router.replace('/os');
                router.refresh(); // Refresh to ensure middleware picks up the new cookie status
            } else {
                console.error('Failed to create session');
            }
        } catch (err) {
            console.error('Login error', err);
        }
    };

    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
