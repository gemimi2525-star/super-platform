'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — AuthGate Overlay
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.5: Unified Lock + Login Overlay (macOS-like)
 * 
 * MODES:
 * - "signin" → No session → Show Sign In form
 * - "unlock" → Has session + locked → Show Unlock form
 * - "none" → Has session + unlocked → Hidden
 * 
 * DESIGN RULES:
 * - Lock ≠ Logout (preserves OS feel)
 * - Single source of truth for auth gate
 * - Time display (OS feel)
 * - Keyboard accessible
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';
import { useAuthStore, selectDisplayName } from '@/lib/stores/authStore';
import { useCorePreferences } from '@/lib/stores/corePreferencesStore';
import { Lock, Unlock, LogIn, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { CoreButton, CoreIconCircle } from '@/core-ui';
import { auth, signInWithEmailAndPassword } from '@/lib/firebase/client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AuthGateMode = 'none' | 'signin' | 'unlock';

export interface AuthGateOverlayProps {
    /**
     * Current mode:
     * - "none": Hidden (normal operation)
     * - "signin": No session, show login form
     * - "unlock": Session exists but locked, show unlock
     */
    mode: AuthGateMode;

    /**
     * Display name for unlock mode
     */
    userName?: string;

    /**
     * Called when sign in is successful
     */
    onSignIn?: (user: any) => void;

    /**
     * Called when unlock is successful
     */
    onUnlock?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const overlayVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: 0.3 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    },
};

const contentVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    enter: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.3, delay: 0.1 }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -10,
        transition: { duration: 0.2 }
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════

const AUTH_GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AuthGateOverlay({
    mode,
    userName = 'User',
    onSignIn,
    onUnlock,
}: AuthGateOverlayProps) {
    const t = useTranslations('v2.authGate');

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Processing guard
    const isProcessingRef = useRef(false);

    // Time display (OS feel)
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        if (mode === 'none') return;
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [mode]);

    const formattedTime = time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const formattedDate = time.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    // Reset form when mode changes
    useEffect(() => {
        if (mode === 'none') {
            setEmail('');
            setPassword('');
            setError('');
            setIsLoading(false);
            isProcessingRef.current = false;
        }
    }, [mode]);

    // ─────────────────────────────────────────────────────────────────────
    // SESSION HELPER
    // ─────────────────────────────────────────────────────────────────────
    const createSessionCookie = useCallback(async (idToken: string): Promise<boolean> => {
        try {
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            });
            if (!res.ok) return false;
            return true;
        } catch {
            return false;
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // SIGN IN HANDLER
    // ─────────────────────────────────────────────────────────────────────
    const handleSignIn = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError(t('errorEmailRequired'));
            setIsLoading(false);
            isProcessingRef.current = false;
            return;
        }

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);

            // Get token and create session
            const token = await result.user.getIdToken(true);
            const sessionCreated = await createSessionCookie(token);

            if (!sessionCreated) {
                setError(t('errorSessionFailed'));
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

            // Success callback
            onSignIn?.(result.user);

        } catch (err: any) {
            if (err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-credential') {
                setError(t('errorInvalidCredentials'));
            } else if (err.code === 'auth/invalid-email') {
                setError(t('errorInvalidEmail'));
            } else if (err.code === 'auth/too-many-requests') {
                setError(t('errorTooManyAttempts'));
            } else {
                setError(t('errorLoginFailed'));
            }
            setIsLoading(false);
            isProcessingRef.current = false;
        }
    }, [email, password, createSessionCookie, onSignIn, t]);

    // ─────────────────────────────────────────────────────────────────────
    // UNLOCK HANDLER
    // ─────────────────────────────────────────────────────────────────────
    const handleUnlock = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        setIsLoading(true);
        setError('');

        // v1: Simple unlock (password verification optional for MVP)
        // In production, verify password against current session
        await new Promise(resolve => setTimeout(resolve, 300));

        setIsLoading(false);
        isProcessingRef.current = false;
        onUnlock?.();
    }, [onUnlock]);

    // ─────────────────────────────────────────────────────────────────────
    // DEV QUICK-FILL
    // ─────────────────────────────────────────────────────────────────────
    const handleDevQuickFill = () => {
        setEmail('admin@apicoredata.com');
        setPassword('Password@123');
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    const isVisible = mode !== 'none';
    const isSignInMode = mode === 'signin';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    variants={overlayVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    className="fixed inset-0 z-[999] flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 64, 175) 100%)',
                    }}
                >
                    {/* Blur overlay */}
                    <div className="absolute inset-0 backdrop-blur-xl" />

                    {/* Content */}
                    <motion.div
                        variants={contentVariants}
                        className="relative z-10 text-center text-white w-full max-w-[320px] px-4"
                    >
                        {/* Time Display */}
                        <div className="text-7xl font-light mb-2">
                            {formattedTime}
                        </div>
                        <div className="text-xl text-white/70 mb-8">
                            {formattedDate}
                        </div>

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <CoreIconCircle
                                icon={isSignInMode ? <LogIn /> : <Lock />}
                                size="xl"
                                variant="subtle"
                                color="info"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                }}
                            />
                        </div>

                        {/* Title */}
                        <p className="text-white/80 font-medium mb-2">
                            {isSignInMode ? t('signInTitle') : t('unlockTitle', { name: userName })}
                        </p>
                        <p className="text-white/50 text-sm mb-6">
                            {isSignInMode ? t('signInSubtitle') : t('unlockSubtitle')}
                        </p>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 text-center">
                                <span className="text-[12px] text-red-300/80">{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={isSignInMode ? handleSignIn : handleUnlock} className="space-y-3">
                            {/* Dev Quick-Fill (development only) */}
                            {process.env.NODE_ENV === 'development' && isSignInMode && (
                                <button
                                    type="button"
                                    onClick={handleDevQuickFill}
                                    className="
                                        w-full h-7 mb-2
                                        rounded-md
                                        bg-emerald-500/20 hover:bg-emerald-500/30
                                        border border-emerald-400/30
                                        text-emerald-300/90 text-[10px] font-medium
                                        transition-all
                                        flex items-center justify-center gap-1.5
                                    "
                                >
                                    <span>🧪</span>
                                    <span>Dev: Quick Fill</span>
                                </button>
                            )}

                            {/* Email (signin only) */}
                            {isSignInMode && (
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('emailPlaceholder')}
                                    autoComplete="email"
                                    className="
                                        w-full h-10 px-4
                                        bg-white/10 
                                        border border-white/10
                                        rounded-lg
                                        text-[14px] text-white placeholder:text-white/40
                                        focus:outline-none focus:bg-white/15 focus:border-white/20
                                        transition-all
                                    "
                                />
                            )}

                            {/* Password */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isSignInMode ? t('passwordPlaceholder') : t('unlockPasswordPlaceholder')}
                                    autoComplete={isSignInMode ? 'current-password' : 'off'}
                                    className="
                                        w-full h-10 px-4 pr-10
                                        bg-white/10 
                                        border border-white/10
                                        rounded-lg
                                        text-[14px] text-white placeholder:text-white/40
                                        focus:outline-none focus:bg-white/15 focus:border-white/20
                                        transition-all
                                    "
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Submit Button */}
                            <CoreButton
                                type="submit"
                                variant="secondary"
                                size="lg"
                                iconLeft={isSignInMode ? <LogIn size={18} /> : <Unlock size={18} />}
                                loading={isLoading}
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    borderRadius: '9999px',
                                    marginTop: 'var(--os-space-4)',
                                }}
                            >
                                {isLoading
                                    ? (isSignInMode ? t('signingIn') : t('unlocking'))
                                    : (isSignInMode ? t('signIn') : t('unlock'))
                                }
                            </CoreButton>
                        </form>

                        {/* Google Login Notice (signin mode only) */}
                        {isSignInMode && !AUTH_GOOGLE_ENABLED && (
                            <div className="mt-6 flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5 text-amber-400/60">
                                    <AlertTriangle size={12} />
                                    <span className="text-[10px]">
                                        {t('googleDisabled')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPER WITH STORES — SERVER-FIRST SESSION CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HOTFIX: AuthGate with server-side session check
 * 
 * Logic:
 * 1. On mount, call /api/auth/context to check server session
 * 2. If session valid (data.uid exists) → hasValidSession = true
 * 3. Only then check isLocked for unlock mode
 * 
 * Mode derivation (pure function):
 * - !sessionChecked → 'none' (loading, no flash)
 * - sessionChecked && !hasValidSession → 'signin'
 * - sessionChecked && hasValidSession && isLocked → 'unlock'
 * - sessionChecked && hasValidSession && !isLocked → 'none'
 */
export function AuthGateOverlayWithStore() {
    const displayName = useAuthStore(selectDisplayName);
    const { isLocked, setLocked } = useCorePreferences();
    const { setUser } = useAuthStore.getState();

    // Session check state (SERVER-FIRST)
    const [sessionChecked, setSessionChecked] = useState(false);
    const [hasValidSession, setHasValidSession] = useState(false);

    // Check session on mount by calling API
    useEffect(() => {
        let mounted = true;

        async function checkSession() {
            console.log('[AuthGate] Checking server session...');
            try {
                const res = await fetch('/api/auth/context', {
                    credentials: 'include',
                });

                if (!mounted) return;

                if (res.ok) {
                    const json = await res.json();
                    // API returns: { success: true, data: { uid, email, role, orgId } }
                    // OR: { success: false, error: { ... } }
                    if (json.success && json.data?.uid) {
                        console.log('[AuthGate] ✅ Valid session found:', json.data.email);
                        setHasValidSession(true);
                        // Sync to client store
                        setUser({
                            uid: json.data.uid,
                            email: json.data.email,
                            role: json.data.role || 'user',
                            status: 'active',
                        } as any);
                    } else {
                        console.log('[AuthGate] ❌ No valid session');
                        setHasValidSession(false);
                    }
                } else {
                    console.log('[AuthGate] ❌ Session check failed (HTTP', res.status, ')');
                    setHasValidSession(false);
                }
            } catch (err) {
                console.error('[AuthGate] Session check error:', err);
                if (mounted) {
                    setHasValidSession(false);
                }
            } finally {
                if (mounted) {
                    setSessionChecked(true);
                    console.log('[AuthGate] Session check complete');
                }
            }
        }

        checkSession();

        return () => {
            mounted = false;
        };
    }, [setUser]);

    // ═══════════════════════════════════════════════════════════════════════
    // DERIVE MODE (Pure logic, single source of truth)
    // ═══════════════════════════════════════════════════════════════════════
    const mode = getAuthGateMode(sessionChecked, hasValidSession, isLocked);

    console.log('[AuthGate] Mode:', mode, '| sessionChecked:', sessionChecked, '| hasValidSession:', hasValidSession, '| isLocked:', isLocked);

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    const handleSignIn = useCallback(async (firebaseUser: any) => {
        console.log('[AuthGate] Sign in success, refreshing...');
        // Force page refresh to sync state properly
        window.location.reload();
    }, []);

    const handleUnlock = useCallback(() => {
        console.log('[AuthGate] Unlocking desktop');
        setLocked(false);
    }, [setLocked]);

    return (
        <AuthGateOverlay
            mode={mode}
            userName={displayName}
            onSignIn={handleSignIn}
            onUnlock={handleUnlock}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PURE FUNCTION: getAuthGateMode
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to determine AuthGate mode
 * 
 * @param sessionChecked - Has the session been checked from server?
 * @param hasValidSession - Does a valid session exist?
 * @param isLocked - Is the desktop locked?
 * @returns AuthGateMode
 */
function getAuthGateMode(
    sessionChecked: boolean,
    hasValidSession: boolean,
    isLocked: boolean
): AuthGateMode {
    // Still loading session check
    if (!sessionChecked) {
        return 'none';
    }

    // No session → signin
    if (!hasValidSession) {
        return 'signin';
    }

    // Has session but locked → unlock
    if (isLocked) {
        return 'unlock';
    }

    // Normal operation
    return 'none';
}

export default AuthGateOverlay;


