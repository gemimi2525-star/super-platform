'use client';

import React from 'react';
import { useProgram, ProgramId } from '@/contexts/ProgramContext';
import { useWindowControls } from '@/coreos/react';
import { useBrand } from '@/contexts/BrandContext';
import { Shield, BarChart3, Search } from 'lucide-react';
import type { Window } from '@/coreos/types';

// Programs Definition (Should matches ProgramSwitcher.tsx)
interface ProgramOption {
    id: ProgramId;
    labelKey: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
    tag?: string;
}

interface UtilityToolsWindowProps {
    window: Window;
}

export function UtilityToolsWindow({ window }: UtilityToolsWindowProps) {
    const { activeProgram, setActiveProgram } = useProgram();
    const { close } = useWindowControls(window.id);

    // Reuse the programs list logic
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
        close(); // Close window on selection, mimicking sidebar behavior
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#E8E8E8]">
                <h2 className="text-sm font-bold text-[#111827]">Utility Tools</h2>
                <p className="text-xs text-gray-500 mt-0.5">Switch Program</p>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-2">
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
                                <div className="flex-1 text-left">
                                    <span className="block truncate">{program.labelKey}</span>
                                    <span className="block text-[10px] text-gray-400 font-normal truncate">
                                        {program.description}
                                    </span>
                                </div>
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
            <div className="px-3 py-2 border-t border-[#E8E8E8] bg-white">
                <div className="text-[10px] text-[#8E8E8E]">Standard Platform v2.0</div>
            </div>
        </div>
    );
}
