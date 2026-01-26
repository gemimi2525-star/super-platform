'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { Portal } from '@/components/ui-base/Portal';
import { useSidebar } from '@/contexts/SidebarContext';
import { useBrand } from '@/contexts/BrandContext';
import { BrandLogo } from '@/components/BrandLogo';
import { LogOut, User, Settings, X, Shield, Bell, HelpCircle } from 'lucide-react';

export function UserMenu() {
    const router = useRouter();
    const t = useTranslations();
    const { isUserSidebarOpen, toggleUserSidebar, closeUserSidebar } = useSidebar();
    const { sidebar } = useBrand();
    const [isLoading, setIsLoading] = useState(false);

    // Animation state - separate from visibility for smooth transition
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isUserSidebarOpen) {
            // Small delay to trigger CSS transition after mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isUserSidebarOpen]);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await signOut(auth);
            localStorage.removeItem('auth-storage');
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
            closeUserSidebar();
        }
    };

    const menuItems = [
        { icon: User, label: t('common.profile') || 'Profile', action: () => closeUserSidebar() },
        { icon: Settings, label: t('common.settings') || 'Settings', action: () => closeUserSidebar() },
        { icon: Bell, label: 'Notifications', action: () => closeUserSidebar() },
        { icon: Shield, label: 'Security', action: () => closeUserSidebar() },
        { icon: HelpCircle, label: 'Help & Support', action: () => closeUserSidebar() },
    ];

    return (
        <>
            {/* User Button (AD) */}
            <button
                onClick={toggleUserSidebar}
                className={`
                    flex items-center justify-center
                    h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] md:h-[42px] md:w-[42px]
                    rounded-full transition-all duration-150 border group outline-none
                    shadow-sm hover:shadow-md focus-visible:ring-2 ring-blue-500/20
                    ${isUserSidebarOpen
                        ? 'bg-orange-50 border-orange-300 shadow-md'
                        : 'bg-white/80 hover:bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }
                `}
                title="User Menu"
            >
                <span className="text-[7px] sm:text-[10px] md:text-xs font-bold text-[#242424] uppercase leading-none">AD</span>
            </button>

            {/* User Sidebar Panel - FROM RIGHT */}
            {isUserSidebarOpen && (
                <Portal>
                    {/* Backdrop - No blur/opacity */}
                    <div
                        className="fixed inset-0 z-[240]"
                        onClick={closeUserSidebar}
                    />

                    {/* Sidebar Panel - RIGHT SIDE, Using transition-transform like Main Sidebar */}
                    <aside className={`
                        fixed top-0 right-0 bottom-0 z-[250] w-[180px]
                        bg-[#FAFAFA] border-l border-[#E8E8E8] flex flex-col
                        transition-transform duration-300 ease-in-out
                        ${isVisible ? 'translate-x-0 shadow-lg' : 'translate-x-full'}
                    `}>
                        {/* Sidebar Header with BrandLogo - Same as Main Sidebar */}
                        <div className="px-4 py-4 border-b border-gray-100">
                            <Link href="/platform" className="flex items-center group" onClick={closeUserSidebar}>
                                <BrandLogo size="sm" location="sidebar" />
                                <span className="font-bold text-[#111827] text-sm ml-2 group-hover:text-gray-700 transition-colors truncate">
                                    {sidebar.brandName}
                                </span>
                            </Link>
                        </div>

                        {/* Header with User Info */}
                        <div className="px-3 py-3 border-b border-[#E8E8E8]">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F6FDE] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm shadow">
                                    AD
                                </div>
                                <button
                                    onClick={closeUserSidebar}
                                    className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            <h2 className="text-sm font-bold text-[#111827]">Admin User</h2>
                            <p className="text-[10px] text-[#8E8E8E]">admin@apicoredata.com</p>
                            <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Online
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-2 px-3">
                            <div className="space-y-0.5">
                                {menuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={item.action}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424] transition-all duration-200"
                                    >
                                        <item.icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <div className="px-3 py-3 border-t border-[#E8E8E8]">
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-medium text-[12px]">
                                    {isLoading ? t('common.loggingOut') || 'Logging out...' : t('common.logout') || 'Sign Out'}
                                </span>
                            </button>
                        </div>
                    </aside>
                </Portal>
            )}
        </>
    );
}
