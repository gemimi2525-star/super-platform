'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA — Login Page
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.7: Lock-Style Login with AuthScreen Component
 * 
 * Routes:
 * - /en/auth/login (English)
 * - /th/auth/login (Thai with optional Buddhist Era)
 * 
 * Uses shared AuthScreen component for unified look with Lock overlay.
 * 
 * @version 3.0.0
 * @date 2026-01-29
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, signInWithEmailAndPassword } from '@/lib/firebase/client';
import { useTranslations, useLocale } from '@/lib/i18n';
import { AuthScreen } from '@/components/auth/AuthScreen';
import type { User } from 'firebase/auth';

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════

const AUTH_GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const LANGUAGES = [
    { code: 'en', label: 'EN', fullName: 'English' },
    { code: 'th', label: 'TH', fullName: 'ไทย' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('auth');

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Processing guard
    const isProcessingRef = useRef(false);

    // Current language
    const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

    // ─────────────────────────────────────────────────────────────────────────
    // LANGUAGE SWITCH
    // ─────────────────────────────────────────────────────────────────────────
    const handleLanguageChange = (langCode: string) => {
        if (langCode === locale) return;
        const newPath = pathname.replace(`/${locale}/`, `/${langCode}/`);
        router.push(newPath);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SESSION HELPER
    // ─────────────────────────────────────────────────────────────────────────
    const createSessionCookie = useCallback(async (idToken: string): Promise<boolean> => {
        try {
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            });
            if (!res.ok) return false;
            console.log('[Session] ✅ Cookie created');
            return true;
        } catch {
            return false;
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN SUCCESS
    // ─────────────────────────────────────────────────────────────────────────
    const handleLoginSuccess = useCallback(async (user: User) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        console.log('[Login] ▶️ Processing:', user.email);
        setIsLoading(true);
        setError('');

        try {
            const token = await user.getIdToken(true);
            const sessionCreated = await createSessionCookie(token);

            if (!sessionCreated) {
                setError(t('sessionFailed'));
                setIsLoading(false);
                isProcessingRef.current = false;
                return;
            }

            // Bootstrap user
            try {
                await fetch('/api/auth/bootstrap', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch {
                // Continue anyway
            }

            // Redirect to desktop (canonical route)
            console.log('[Login] ✅ Redirecting to desktop...');
            router.push(`/${locale}/desktop`);
        } catch (err: any) {
            console.error('[Login] ❌ Error:', err);
            setError(t('loginFailed'));
            setIsLoading(false);
            isProcessingRef.current = false;
        }
    }, [createSessionCookie, router, locale, t]);

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isProcessingRef.current) return;

        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError(t('invalidCredentials'));
            setIsLoading(false);
            return;
        }

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log('[Login] ✅ Firebase auth success');
            await handleLoginSuccess(result.user);
        } catch (err: any) {
            console.error('[Login] ❌ Error:', err.code);

            if (err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-credential') {
                setError(t('invalidCredentials'));
            } else if (err.code === 'auth/invalid-email') {
                setError(t('invalidEmail'));
            } else if (err.code === 'auth/too-many-requests') {
                setError(t('tooManyAttempts'));
            } else {
                setError(t('loginFailed'));
            }
            setIsLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // GOOGLE LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        if (!AUTH_GOOGLE_ENABLED) {
            setError(t('googleDisabled'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { GoogleAuthProvider, signInWithRedirect } = await import('@/lib/firebase/client');
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithRedirect(auth, provider);
        } catch (err: any) {
            setError(t('loginFailed'));
            setIsLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DEV QUICK-FILL
    // ─────────────────────────────────────────────────────────────────────────
    const handleDevQuickFill = () => {
        setEmail('admin@apicoredata.com');
        setPassword('Password@123');
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <AuthScreen
            mode="signin"
            texts={{
                subtitle: t('signInToWorkspace'),
                emailPlaceholder: t('email'),
                passwordPlaceholder: t('password'),
                submitButton: t('loginButton'),
                loadingText: t('signingIn'),
                googleDisabled: t('googleDisabled'),
                useEmailPassword: t('useEmailPassword'),
                orContinueWith: t('orContinueWith'),
            }}
            email={email}
            password={password}
            error={error}
            isLoading={isLoading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onDevQuickFill={handleDevQuickFill}
            showLanguageSwitcher={true}
            currentLanguage={currentLang.label}
            languages={[...LANGUAGES]}
            onLanguageChange={handleLanguageChange}
            showGoogleLogin={true}
            googleEnabled={AUTH_GOOGLE_ENABLED}
            showLogo={true}
        />
    );
}
