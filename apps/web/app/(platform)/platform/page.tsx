'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Platform Root
 * Redirects to /platform/tenants
 */
export default function PlatformPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/platform/tenants');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Redirecting to Platform Console...</p>
        </div>
    );
}
