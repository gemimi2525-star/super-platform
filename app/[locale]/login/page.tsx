'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/os-shell/LoginScreen';
import SimpleLanguageSwitcher from '@/components/SimpleLanguageSwitcher';

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
                router.push('/os');
                router.refresh();
            } else {
                console.error('Failed to create session');
            }
        } catch (err) {
            console.error('Login error', err);
        }
    };

    return (
        <>
            {/* Language Switcher - Fixed top-right */}
            <div className="fixed top-4 right-4 z-50">
                <Suspense fallback={
                    <div className="w-16 h-8 bg-gray-100 rounded-full animate-pulse" />
                }>
                    <SimpleLanguageSwitcher size="md" />
                </Suspense>
            </div>
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </>
    );
}
