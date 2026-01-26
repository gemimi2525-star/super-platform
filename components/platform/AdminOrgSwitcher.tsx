'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminContext } from '@/contexts/AdminContext';
import { apiClient } from '@/lib/api-client';
import { useBrand } from '@/contexts/BrandContext';
import { BrandLogo } from '@/components/BrandLogo';
import { Building2, Check, X, Loader2 } from 'lucide-react';
import { Portal } from '@/components/ui-base/Portal';
import { useSidebar } from '@/contexts/SidebarContext';

interface Organization {
    id: string;
    name: string;
    slug: string;
}

export function AdminOrgSwitcher() {
    const { selectedOrgId, selectOrg, isLoadingContext } = useAdminContext();
    const { isORSidebarOpen, toggleORSidebar, closeORSidebar } = useSidebar();
    const { sidebar } = useBrand();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Animation state - separate from visibility for smooth transition
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isORSidebarOpen) {
            // Small delay to trigger CSS transition after mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isORSidebarOpen]);

    useEffect(() => {
        async function fetchOrgs() {
            try {
                const res = await apiClient<{ data: { organizations: Organization[] } }>('/api/platform/orgs', {
                    skipOrgContext: true
                });
                setOrgs(res.data.organizations || []);
            } catch (error) {
                console.error('Failed to fetch orgs', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchOrgs();
    }, []);

    const selectedOrg = orgs.find(o => o.id === selectedOrgId);
    const displayName = selectedOrg ? selectedOrg.name : "Select Organization...";

    const handleSelect = (orgId: string) => {
        selectOrg(orgId);
        closeORSidebar();
    };

    const handleClear = () => {
        selectOrg(null);
        closeORSidebar();
    };

    if (isLoadingContext) {
        return <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />;
    }

    return (
        <>
            {/* OR Button */}
            <button
                onClick={toggleORSidebar}
                className={`
                    flex items-center justify-center gap-1
                    h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] md:h-[42px] md:w-[42px]
                    rounded-full transition-all duration-150 border group outline-none 
                    shadow-sm hover:shadow-md focus-visible:ring-2 ring-blue-500/20
                    ${isORSidebarOpen
                        ? 'bg-green-50 border-green-300 shadow-md'
                        : 'bg-white/80 hover:bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }
                `}
                title={displayName}
            >
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-[#242424] leading-none uppercase">OR</span>
            </button>

            {/* OR Sidebar Panel */}
            {isORSidebarOpen && (
                <Portal>
                    {/* Backdrop - No blur/opacity */}
                    <div
                        className="fixed inset-0 z-[240]"
                        onClick={closeORSidebar}
                    />

                    {/* Sidebar Panel - Using transition-transform like Main Sidebar */}
                    <aside className={`
                        fixed top-0 left-0 bottom-0 z-[250] min-w-[180px] max-w-[300px] w-auto
                        bg-[#FAFAFA] border-r border-[#E8E8E8] flex flex-col
                        transition-transform duration-300 ease-in-out
                        ${isVisible ? 'translate-x-0 shadow-lg' : '-translate-x-full'}
                    `}>
                        {/* Sidebar Header with BrandLogo - Same as Main Sidebar */}
                        <div className="px-4 py-4 border-b border-gray-100">
                            <Link href="/platform" className="flex items-center group" onClick={closeORSidebar}>
                                <BrandLogo size="sm" location="sidebar" />
                                <span className="font-bold text-[#111827] text-sm ml-2 group-hover:text-gray-700 transition-colors truncate">
                                    {sidebar.brandName}
                                </span>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-3 border-b border-[#E8E8E8]">
                            <div>
                                <h2 className="text-sm font-bold text-[#111827]">Organizations</h2>
                                <p className="text-[10px] text-[#8E8E8E] mt-0.5 leading-tight">
                                    {selectedOrg ? `Selected: ${selectedOrg.name}` : 'Select an organization'}
                                </p>
                            </div>
                            <button
                                onClick={closeORSidebar}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Organization List */}
                        <div className="flex-1 overflow-y-auto py-2 px-3">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                </div>
                            ) : orgs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No organizations found
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {orgs.map((org) => {
                                        const isActive = org.id === selectedOrgId;
                                        return (
                                            <button
                                                key={org.id}
                                                onClick={() => handleSelect(org.id)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                                    transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-white text-[#0F6FDE] shadow-sm ring-1 ring-[#E8E8E8]'
                                                        : 'text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424]'
                                                    }
                                                `}
                                            >
                                                <Building2 className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{org.name}</span>
                                                {isActive && (
                                                    <Check className="w-4 h-4 text-[#0F6FDE] flex-shrink-0 ml-auto" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer with Clear Action */}
                        {selectedOrgId && (
                            <div className="px-3 py-2 border-t border-[#E8E8E8]">
                                <button
                                    onClick={handleClear}
                                    className="w-full text-center py-1.5 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </aside>
                </Portal>
            )}
        </>
    );
}
