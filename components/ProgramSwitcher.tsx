'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProgram, ProgramId } from '@/contexts/ProgramContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useBrand } from '@/contexts/BrandContext';
import { BrandLogo } from '@/components/BrandLogo';
import { Shield, BarChart3, Search, X } from 'lucide-react';
import { Portal } from '@/components/ui-base/Portal';

interface ProgramOption {
    id: ProgramId;
    labelKey: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
    tag?: string;
}

export function ProgramSwitcher() {
    const { activeProgram, setActiveProgram } = useProgram();
    const { isUTSidebarOpen, toggleUTSidebar, closeUTSidebar } = useSidebar();
    const { sidebar } = useBrand();

    // Animation state - separate from visibility for smooth transition
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isUTSidebarOpen) {
            // Small delay to trigger CSS transition after mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isUTSidebarOpen]);

    const PROGRAMS: ProgramOption[] = [
        {
            id: 'platform',
            labelKey: 'Control Panel',
            description: 'Manage orgs, users, and roles',
            icon: <Shield className="w-5 h-5" />
        },
        {
            id: 'seo',
            labelKey: 'All Program',
            description: 'Track rankings and site health',
            icon: <Search className="w-5 h-5" />,
            disabled: false
        },
        {
            id: 'analytics',
            labelKey: 'Analytics',
            description: 'Traffic and conversion insights',
            icon: <BarChart3 className="w-5 h-5" />,
            disabled: true,
            tag: 'Coming Soon'
        }
    ];

    const handleSelect = (programId: ProgramId) => {
        setActiveProgram(programId);
        closeUTSidebar();
    };

    return (
        <>
            {/* UT Button */}
            <button
                onClick={toggleUTSidebar}
                className={`
                    flex items-center justify-center gap-1
                    h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] md:h-[42px] md:w-[42px]
                    rounded-full transition-all duration-150 border group outline-none 
                    shadow-sm hover:shadow-md focus-visible:ring-2 ring-blue-500/20
                    ${isUTSidebarOpen
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white/80 hover:bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }
                `}
                title="Utility Tools"
            >
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-[#242424] leading-none uppercase">UT</span>
            </button>

            {/* UT Sidebar Panel */}
            {isUTSidebarOpen && (
                <Portal>
                    {/* Backdrop - No blur/opacity */}
                    <div
                        className="fixed inset-0 z-[240]"
                        onClick={closeUTSidebar}
                    />

                    <aside className={`
                        fixed top-0 left-0 bottom-0 z-[250] w-[180px] 
                        bg-[#FAFAFA] border-r border-[#E8E8E8] flex flex-col
                        transition-transform duration-300 ease-in-out
                        ${isVisible ? 'translate-x-0 shadow-lg' : '-translate-x-full'}
                    `}>
                        {/* Sidebar Header with BrandLogo - Same as Main Sidebar */}
                        <div className="px-4 py-4 border-b border-gray-100">
                            <Link href="/platform" className="flex items-center group" onClick={closeUTSidebar}>
                                <BrandLogo size="sm" location="sidebar" />
                                <span className="font-bold text-[#111827] text-sm ml-2 group-hover:text-gray-700 transition-colors truncate">
                                    {sidebar.brandName}
                                </span>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-3 border-b border-[#E8E8E8]">
                            <div>
                                <h2 className="text-sm font-bold text-[#111827]">Utility Tools</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Switch Program</p>
                            </div>
                            <button
                                onClick={closeUTSidebar}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Program List */}
                        <div className="flex-1 overflow-y-auto py-2 px-3">
                            <div className="space-y-0.5">
                                {PROGRAMS.map((program) => {
                                    const isActive = activeProgram === program.id;
                                    return (
                                        <button
                                            key={program.id}
                                            disabled={program.disabled}
                                            onClick={() => !program.disabled && handleSelect(program.id)}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                                transition-all duration-200
                                                ${isActive
                                                    ? 'bg-white text-[#0F6FDE] shadow-sm ring-1 ring-[#E8E8E8]'
                                                    : 'text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424]'
                                                }
                                                ${program.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <div className="w-4 h-4 flex-shrink-0">
                                                {program.icon}
                                            </div>
                                            <span className="truncate">{program.labelKey}</span>
                                            {program.tag && (
                                                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded flex-shrink-0">
                                                    {program.tag}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-3 py-2 border-t border-[#E8E8E8]">
                            <div className="text-[10px] text-[#8E8E8E]">Standard Platform v2.0</div>
                        </div>
                    </aside>
                </Portal>
            )}
        </>
    );
}

