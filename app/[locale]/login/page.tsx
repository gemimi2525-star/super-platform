'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/os-shell/LoginScreen';

export default function LoginPage() {
    const router = useRouter();

    const handleLoginSuccess = async (idToken: string) => {
        // Set a session cookie to satisfy Middleware
        // In a real app, this would be an API call to /api/auth/login
        // For now, we simulate it via document.cookie for the client-side
        // BUT middleware reads server cookies. 
        // We need a Server Action or API to set the HTTP cookie.

        // Strategy: Use a simple Server Action or API route to set the cookie.
        // OR: Just set it here on client if middleware allows ( Middleware reads Request cookies, which include client-set cookies if not HttpOnly).
        // For security v1 (HttpOnly), we really should use an API.
        // Let's assume we can fallback to a client cookie for this "Demo" transition or add a simple API.

        // Simpler for this step: Call an API route to set the cookie.
        // I'll create a quick API for it? Or just use client cookie for now to pass S5 tests quickly.
        // The user requirement S4 says: "cookie/session must be Secure, HttpOnly". 
        // So I cannot set it on client. I MUST use an API.

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
                router.push('/os');
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
