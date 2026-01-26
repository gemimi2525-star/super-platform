'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '@/lib/i18n';

export function LogoutButton() {
    const router = useRouter();
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await signOut(auth);
            // Clear any stored auth data
            localStorage.removeItem('auth-storage');
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
            <LogOut className="w-4 h-4" />
            {isLoading ? `${t('common.logout')}...` : t('common.logout')}
        </button>
    );
}
