'use client';

/**
 * Auth Provider
 * 
 * Bridge Firebase Auth (localStorage) กับ Server-side Auth (cookie)
 * - Login → สร้าง session cookie
 * - Logout → ลบ session cookie
 */

import { useEffect, useRef } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * สร้าง session cookie จาก ID token
 */
async function createSession(idToken: string): Promise<boolean> {
    try {
        const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
            console.error('[AuthProvider] Failed to create session:', await res.text());
            return false;
        }

        console.log('[AuthProvider] Session cookie created');
        return true;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (process.env.NODE_ENV === 'development') {
            console.error('[AuthProvider] Session creation error:', error);
        } else {
            console.error(`[AuthProvider] Session creation error: ${msg}`);
        }
        return false;
    }
}

/**
 * ลบ session cookie
 */
async function deleteSession(): Promise<void> {
    try {
        await fetch('/api/auth/session', { method: 'DELETE' });
        console.log('[AuthProvider] Session cookie deleted');
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (process.env.NODE_ENV === 'development') {
            console.error('[AuthProvider] Session deletion error:', error);
        } else {
            console.error(`[AuthProvider] Session deletion error: ${msg}`);
        }
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setFirebaseUser, setLoading } = useAuthStore();
    useEffect(() => {
        console.log('[AuthProvider] Setting up auth listener');

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('[AuthProvider] Auth state changed:', firebaseUser?.email || 'null');

            if (firebaseUser) {
                // User logged in → สร้าง session cookie
                try {
                    const idToken = await firebaseUser.getIdToken();
                    // We can optionally debounce this or check if cookie exists to avoid redundant POSTs, 
                    // but for now let's just ensure it works.
                    // Ideally, we only create session if we suspect it's missing or expired.
                    // But strictly speaking, aligning client/server state is good.
                    await createSession(idToken);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    if (process.env.NODE_ENV === 'development') {
                        console.error('[AuthProvider] Failed to get ID token:', error);
                    } else {
                        console.error(`[AuthProvider] Failed to get ID token: ${msg}`);
                    }
                }
            } else {
                // User logged out → ลบ session cookie
                // WARNING: This forces logout if client SDK is not synced.
                // We should ensure this doesn't run during initial load if possible?
                // onAuthStateChanged runs with null only if truly no user found in storage.
                await deleteSession();
            }

            setFirebaseUser(firebaseUser);
            setLoading(false);
        });

        return () => {
            console.log('[AuthProvider] Cleaning up auth listener');
            unsubscribe();
        };
    }, [setFirebaseUser, setLoading]);

    return <>{children}</>;
}

