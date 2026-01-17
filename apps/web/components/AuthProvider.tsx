'use client';

/**
 * Auth Provider
 * 
 * Provides authentication context and handles auth state
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, onAuthStateChanged } from '@platform/firebase';
import { useAuthStore } from '@/lib/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { setFirebaseUser, setLoading } = useAuthStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setFirebaseUser(firebaseUser);
            setLoading(false);

            // Public routes that don't require authentication
            const publicRoutes = [
                '/design-system',  // Dev-only UI Kit showcase
            ];

            // Check if current path is public
            const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

            // Redirect logic
            const isAuthPage = pathname.startsWith('/auth');

            if (!firebaseUser && !isAuthPage && !isPublicRoute) {
                router.push('/auth/login');
            } else if (firebaseUser && isAuthPage) {
                router.push('/organizations');
            }
        });

        return () => unsubscribe();
    }, [pathname, router, setFirebaseUser, setLoading]);

    return <>{children}</>;
}
