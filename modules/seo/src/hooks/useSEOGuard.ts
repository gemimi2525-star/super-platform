/**
 * SEO Route Guard (Updated - no direct imports from apps/web)
 * 
 * Ensures user has selected an organization before accessing SEO features
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useSEOGuard(authStore: any) {
    const router = useRouter();
    const { currentOrganization, firebaseUser } = authStore;

    useEffect(() => {
        // Check authentication
        if (!firebaseUser) {
            router.push('/auth/login');
            return;
        }

        // Check organization selection
        if (!currentOrganization) {
            router.push('/organizations');
            return;
        }
    }, [firebaseUser, currentOrganization, router]);

    return {
        organizationId: currentOrganization?.id || '',
        organization: currentOrganization,
        isReady: !!currentOrganization,
    };
}
