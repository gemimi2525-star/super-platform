'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — AuthScreen Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.8: Login Screen Polish
 * 
 * Updates:
 * - 24h clock format (no AM/PM)
 * - Removed circle icon
 * - Product title "APICOREDATA" instead of "Welcome back"
 * - Logo support from brand settings
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Lock, Unlock, AlertTriangle, Globe, ChevronDown } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { useBrandStore } from '@/lib/stores/brandStore';
import { formatTime24h, formatDate as formatDateUtil, type SupportedLocale } from '@/lib/utils/dateFormatter';
import Image from 'next/image';
import { BRAND } from '@/config/brand';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AuthScreenMode = 'signin' | 'unlock';

export interface AuthScreenProps {
    /**
     * Mode: signin (login page) or unlock (lock overlay)
     */
    mode: AuthScreenMode;

    /**
     * Display name for unlock mode
     */
    userName?: string;

    /**
     * i18n texts
     */
    texts: {
        title?: string; // Optional - will use APICOREDATA if not provided for signin
        subtitle: string;
        emailPlaceholder?: string;
        passwordPlaceholder: string;
        submitButton: string;
        loadingText: string;
        googleDisabled?: string;
        useEmailPassword?: string;
        orContinueWith?: string;
    };

    /**
     * Form state
     */
    email?: string;
    password?: string;
    error?: string;
    isLoading?: boolean;

    /**
     * Callbacks
     */
    onEmailChange?: (value: string) => void;
    onPasswordChange?: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onGoogleLogin?: () => void;
    onDevQuickFill?: () => void;

    /**
     * Language switcher (for login page)
     */
    showLanguageSwitcher?: boolean;
    currentLanguage?: string;
    languages?: Array<{ code: string; label: string; fullName: string }>;
    onLanguageChange?: (code: string) => void;

    /**
     * Show Google login option
     */
    showGoogleLogin?: boolean;
    googleEnabled?: boolean;

    /**
     * Show brand logo (from settings)
     */
    showLogo?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const contentVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    enter: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' as const }
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AuthScreen({
    mode,
    userName = 'User',
    texts,
    email = '',
    password = '',
    error = '',
    isLoading = false,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onGoogleLogin,
    onDevQuickFill,
    showLanguageSwitcher = false,
    currentLanguage = 'EN',
    languages = [],
    onLanguageChange,
    showGoogleLogin = true,
    googleEnabled = false,
    showLogo = true,
}: AuthScreenProps) {
    const locale = useLocale();
    const isSignInMode = mode === 'signin';

    // Brand logo from store directly (separate Header vs Login settings)
    const loginSettings = useBrandStore((state) => state.settings.login);

    // Logo URL: localStorage > default
    const loginLogoUrl = loginSettings.logoDataUrl || BRAND.logo;

    // Only show logo if it's a custom uploaded logo (not the default from /brand/)
    const hasCustomLogo = !!loginSettings.logoDataUrl;

    // Logo size for login screen (from separate login settings)
    const loginLogoSize = loginSettings.logoSizePx;

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);

    // Language dropdown
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Live clock
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setShowLangDropdown(false);
        if (showLangDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showLangDropdown]);

    // ─────────────────────────────────────────────────────────────────────────
    // DATE & TIME FORMATTING (Custom formatter - Single Source of Truth)
    // ─────────────────────────────────────────────────────────────────────────
    // EN: "Thu, 29 January 2026" + "20:19"
    // TH: "พฤหัส 29 มกราคม 2569" + "20:20"
    const formattedTime = formatTime24h(time);
    const formattedDate = formatDateUtil(time, locale as SupportedLocale);

    // ─────────────────────────────────────────────────────────────────────────
    // TITLE LOGIC
    // ─────────────────────────────────────────────────────────────────────────
    // For signin mode: Show "APICOREDATA" (product title)
    // For unlock mode: Show "Welcome back, {name}" from texts.title
    const displayTitle = isSignInMode ? 'APICOREDATA' : (texts.title || `Welcome back, ${userName}`);

    return (
        <div
            className="
                relative min-h-screen w-full overflow-hidden
                flex items-center justify-center
            "
            style={{
                background: 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 64, 175) 100%)',
            }}
        >
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-xl" />

            {/* Language Switcher (Login mode only) */}
            {showLanguageSwitcher && languages.length > 0 && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowLangDropdown(!showLangDropdown);
                            }}
                            className="
                                flex items-center gap-1.5 px-3 py-1.5
                                rounded-lg
                                bg-white/5 hover:bg-white/10
                                border border-white/10
                                text-white/70 hover:text-white/90
                                text-[12px] font-medium
                                transition-all
                            "
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{currentLanguage}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showLangDropdown && (
                            <div className="
                                absolute top-full right-0 mt-1
                                min-w-[120px]
                                rounded-lg
                                bg-slate-900/95 backdrop-blur-xl
                                border border-white/10
                                shadow-xl
                                overflow-hidden
                                z-50
                            ">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowLangDropdown(false);
                                            onLanguageChange?.(lang.code);
                                        }}
                                        className={`
                                            w-full px-4 py-2
                                            text-left text-[12px]
                                            transition-colors
                                            flex items-center justify-between
                                            ${lang.label === currentLanguage
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                    >
                                        <span>{lang.fullName}</span>
                                        <span className="text-white/40">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <motion.div
                variants={contentVariants}
                initial="initial"
                animate="enter"
                className="relative z-10 text-center text-white w-full max-w-[340px] px-4"
            >
                {/* Clock Display - 24h format */}
                <div className="text-7xl font-light mb-2 tracking-tight">
                    {formattedTime}
                </div>
                <div className="text-lg text-white/60 mb-8">
                    {formattedDate}
                </div>

                {/* Logo (if custom logo uploaded and signin mode) */}
                {showLogo && isSignInMode && hasCustomLogo && (
                    <div className="flex justify-center mb-4">
                        <div
                            className="relative rounded-full overflow-hidden"
                            style={{ width: loginLogoSize, height: loginLogoSize }}
                        >
                            <Image
                                src={loginLogoUrl}
                                alt="Brand Logo"
                                width={loginLogoSize}
                                height={loginLogoSize}
                                className="object-cover w-full h-full"
                                unoptimized // For localStorage data URLs / external URLs
                            />
                        </div>
                    </div>
                )}

                {/* Lock Icon (only for unlock mode) */}
                {!isSignInMode && (
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Lock className="w-7 h-7 text-white/80" />
                        </div>
                    </div>
                )}

                {/* Title - Product name for signin, Welcome back for unlock */}
                <h1 className={`
                    text-white/90 font-semibold mb-1
                    ${isSignInMode ? 'text-2xl tracking-wide' : 'text-lg'}
                `}>
                    {displayTitle}
                </h1>
                {/* Subtitle - Only shown for unlock mode */}
                {!isSignInMode && (
                    <p className="text-white/50 text-sm mb-6">
                        {texts.subtitle}
                    </p>
                )}
                {/* Spacing for signin mode (no subtitle) */}
                {isSignInMode && <div className="mb-6" />}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 text-center">
                        <span className="text-[12px] text-red-300/80">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-3">
                    {/* Dev Quick-Fill (development only) */}
                    {process.env.NODE_ENV === 'development' && isSignInMode && onDevQuickFill && (
                        <button
                            type="button"
                            onClick={onDevQuickFill}
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
                    {isSignInMode && onEmailChange && (
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                            placeholder={texts.emailPlaceholder || 'Email'}
                            autoComplete="email"
                            className="
                                w-full h-11 px-4
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
                            onChange={(e) => onPasswordChange?.(e.target.value)}
                            placeholder={texts.passwordPlaceholder}
                            autoComplete={isSignInMode ? 'current-password' : 'off'}
                            className="
                                w-full h-11 px-4 pr-11
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
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="
                            w-full h-11 mt-1
                            rounded-full
                            bg-white/10 hover:bg-white/20
                            border border-white/20
                            text-white text-[14px] font-medium
                            transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2
                        "
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{texts.loadingText}</span>
                            </>
                        ) : (
                            <>
                                {isSignInMode ? <LogIn size={18} /> : <Unlock size={18} />}
                                <span>{texts.submitButton}</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Google Login Section (signin only) */}
                {showGoogleLogin && isSignInMode && (
                    googleEnabled && onGoogleLogin ? (
                        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                            <span className="text-[11px] text-white/40">
                                {texts.orContinueWith}
                            </span>
                            <button
                                type="button"
                                onClick={onGoogleLogin}
                                className="
                                    flex items-center justify-center gap-2 
                                    w-full h-9
                                    rounded-lg
                                    bg-white/5 hover:bg-white/10
                                    text-white/70 text-[12px]
                                    transition-all
                                "
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1.5 text-amber-400/60">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-[10px]">
                                    {texts.googleDisabled}
                                </span>
                            </div>
                            <span className="text-[9px] text-white/30">
                                {texts.useEmailPassword}
                            </span>
                        </div>
                    )
                )}
            </motion.div>
        </div>
    );
}

export default AuthScreen;
