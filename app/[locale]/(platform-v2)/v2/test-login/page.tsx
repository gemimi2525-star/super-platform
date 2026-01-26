'use client';

/**
 * Test Login Page (DEV/Preview Only)
 * Provides easy-access test credentials for browser testing
 * SECURITY: Only shown when ENABLE_TEST_LOGIN=true AND not production
 * Zero inline styles - Phase 15/16 compliant
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
import { Button } from '@/modules/design-system/src/components/Button';
import { Input } from '@/modules/design-system/src/components/Input';
import { Toast } from '@/modules/design-system/src/components/Toast';
import { EmptyState } from '@/modules/design-system/src/components/EmptyState';
import { auth, signInWithEmailAndPassword } from '@/lib/firebase/client';
import { Eye, EyeOff, Copy, LogIn } from 'lucide-react';

interface TestAccount {
    role: string;
    email: string;
    password: string;
    description: string;
}

export default function TestLoginPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<TestAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPageAvailable, setIsPageAvailable] = useState(true);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [loginLoading, setLoginLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' | 'info' } | null>(null);

    // Fetch test credentials from API (server-only ENV vars)
    useEffect(() => {
        const fetchCredentials = async () => {
            try {
                const response = await fetch('/api/dev/test-credentials');

                if (response.status === 404) {
                    setIsPageAvailable(false);
                    setIsLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch credentials');
                }

                const data = await response.json();
                setAccounts(data.accounts || []);
                setIsPageAvailable(true);
            } catch (error) {
                console.error('Error fetching test credentials:', error);
                setIsPageAvailable(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCredentials();
    }, []);

    const togglePasswordVisibility = (role: string) => {
        setVisiblePasswords(prev => ({ ...prev, [role]: !prev[role] }));
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setToast({ message: `${label} copied to clipboard`, variant: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (error) {
            setToast({ message: 'Failed to copy', variant: 'danger' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleLogin = async (account: TestAccount) => {
        if (!account.email || !account.password) {
            setToast({ message: 'Test credentials not configured', variant: 'danger' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setLoginLoading(account.role);
        try {
            await signInWithEmailAndPassword(auth, account.email, account.password);
            setToast({ message: `Logged in as ${account.role}`, variant: 'success' });
            setTimeout(() => {
                router.push('/en/v2');
            }, 1000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            console.error('Login error:', err);
            setToast({
                message: errorMessage,
                variant: 'danger'
            });
            setTimeout(() => setToast(null), 5000);
        } finally {
            setLoginLoading(null);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="p-16 text-center">
                <p className="text-lg text-neutral-600">Loading...</p>
            </div>
        );
    }

    // Page not available (production or disabled)
    if (!isPageAvailable) {
        return (
            <div className="p-16">
                <EmptyState
                    variant="error"
                    title="Page Not Available"
                    message="This page is only available in development mode with ENABLE_TEST_LOGIN=true."
                />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Test Login"
                subtitle="Quick access to test accounts for development"
            />

            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 mt-8">
                {accounts.map((account) => (
                    <div key={account.role} className="bg-white p-8 rounded-lg shadow-md border border-neutral-200">
                        {/* Role Header */}
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                                {account.role}
                            </h3>
                            <p className="text-sm text-neutral-600">
                                {account.description}
                            </p>
                        </div>

                        {/* Email Field */}
                        <div className="mb-4">
                            <div className="flex gap-2">
                                <Input
                                    label="Email"
                                    value={account.email || 'Not configured'}
                                    readOnly
                                    fullWidth
                                />
                                <Button
                                    variant="outline"
                                    size="md"
                                    onClick={() => copyToClipboard(account.email, 'Email')}
                                    className="mt-[26px]"
                                    disabled={!account.email}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="mb-6">
                            <div className="flex gap-2">
                                <Input
                                    label="Password"
                                    type={visiblePasswords[account.role] ? 'text' : 'password'}
                                    value={account.password || 'Not configured'}
                                    readOnly
                                    fullWidth
                                    suffixIcon={
                                        <button
                                            onClick={() => togglePasswordVisibility(account.role)}
                                            className="bg-transparent border-none cursor-pointer p-0 flex text-neutral-500 hover:text-neutral-700"
                                        >
                                            {visiblePasswords[account.role] ?
                                                <EyeOff className="w-4 h-4" /> :
                                                <Eye className="w-4 h-4" />
                                            }
                                        </button>
                                    }
                                />
                                <Button
                                    variant="outline"
                                    size="md"
                                    onClick={() => copyToClipboard(account.password, 'Password')}
                                    className="mt-[26px]"
                                    disabled={!account.password}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={() => handleLogin(account)}
                            loading={loginLoading === account.role}
                            disabled={!account.email || !account.password || loginLoading !== null}
                        >
                            <LogIn className="w-4 h-4" />
                            Login as {account.role}
                        </Button>
                    </div>
                ))}
            </div>

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    variant={toast.variant}
                    position="top-right"
                    onClose={() => setToast(null)}
                    duration={3000}
                />
            )}
        </div>
    );
}
