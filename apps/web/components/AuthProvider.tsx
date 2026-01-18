'use client';

/**
 * Auth Provider - MINIMAL VERSION FOR DEBUGGING
 * 
 * ปิด onAuthStateChanged และ redirect logic ทั้งหมด
 * เพื่อ verify ว่า loop มาจาก component นี้หรือไม่
 */

import { useEffect, useRef } from 'react';
import { auth, onAuthStateChanged } from '@platform/firebase';
import { useAuthStore } from '@/lib/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setFirebaseUser, setLoading } = useAuthStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        console.log('[AuthProvider] Setting up auth listener ONCE');

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log('[AuthProvider] Auth state changed:', firebaseUser?.email || 'null');
            setFirebaseUser(firebaseUser);
            setLoading(false);

            // NO REDIRECT LOGIC - just update state
        });

        return () => {
            console.log('[AuthProvider] Cleaning up auth listener');
            unsubscribe();
        };
    }, [setFirebaseUser, setLoading]);

    return <>{children}</>;
}
