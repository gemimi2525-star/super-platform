'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithEmailAndPassword } from '@/lib/firebase/client';
import { BrandLogo } from '@/components/BrandLogo';
import { useAppearance } from '@/contexts/AppearanceContext';
import { Eye, EyeOff, Globe } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

export default function LoginPage() {
    const router = useRouter();
    const locale = useLocale();
    const { currentWallpaperClass } = useAppearance();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // AuthProvider will detect auth state change and create session cookie automatically
            await signInWithEmailAndPassword(auth, email, password);

            // Wait a moment for session cookie to be created by AuthProvider
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Force router refresh to update server state (middleware awareness of cookie)
            console.log('[Login] Refreshing router state...');
            router.refresh();

            // Small delay to ensure refresh propagates
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirect to platform
            console.log('[Login] Redirecting to platform...');
            router.push(`/${locale}/platform`);
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email format');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className={`
            relative min-h-screen w-full overflow-hidden
            flex items-center justify-center
            ${currentWallpaperClass}
            transition-all duration-700
        `}>
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/5" />

            {/* Language - Ultra minimal */}
            <div className="absolute top-3 right-3 z-20">
                <button className="text-white/30 hover:text-white/60 transition-colors flex items-center gap-0.5 text-[10px]">
                    <Globe className="w-2.5 h-2.5" />
                    <span>EN</span>
                </button>
            </div>

            {/* Glass Login Panel - Ultra Quiet macOS */}
            <div className="
                relative z-10
                w-full max-w-[320px]
                p-6
                rounded-2xl
                bg-white/5 backdrop-blur-2xl
                border border-white/[0.03]
                shadow-[0_0_40px_rgba(0,0,0,0.1)]
                flex flex-col items-center
            ">
                {/* Brand Area - Minimal Logo Only */}
                <div className="mb-6 opacity-90 hover:opacity-100 transition-opacity">
                    <BrandLogo size="lg" location="login" />
                </div>

                {/* Error Message - Quiet inline text */}
                {error && (
                    <div className="mb-4 w-full text-center">
                        <span className="text-[11px] text-red-300/80">
                            {error}
                        </span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    {/* Minimal Inputs (macOS Login Style) */}
                    <div className="space-y-3">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="
                                w-full h-9 px-3
                                bg-white/3
                                border border-white/5
                                rounded-lg
                                text-[13px] text-white/90 placeholder:text-white/30
                                focus:outline-none focus:bg-white/6 focus:border-white/10
                                transition-all
                            "
                        />

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="
                                    w-full h-9 px-3 pr-9
                                    bg-white/3
                                    border border-white/5
                                    rounded-lg
                                    text-[13px] text-white/90 placeholder:text-white/30
                                    focus:outline-none focus:bg-white/6 focus:border-white/10
                                    transition-all
                                "
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Primary Button - Ultra Quiet Glass */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="
                            w-full h-9 mt-2
                            rounded-lg
                            bg-white/5 hover:bg-white/10
                            active:bg-white/12
                            text-white/80 text-[13px] font-medium
                            transition-all
                            disabled:opacity-30 disabled:cursor-not-allowed
                            flex items-center justify-center
                        "
                    >
                        {isLoading ? (
                            <div className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                {/* Secondary Actions - Quieter */}
                <div className="mt-6 w-full pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                    <span className="text-[11px] text-white/40">
                        Or continue with
                    </span>

                    <button
                        className="
                            flex items-center justify-center gap-2 
                            w-full h-8
                            rounded-lg
                            bg-white/5 hover:bg-white/10
                            text-white/70 text-[12px]
                            transition-all
                        "
                    >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </div>
            </div>
        </div>
    );
}
