import React, { useEffect } from 'react';
import { useProgram, ProgramId } from '@/contexts/ProgramContext';
import { useSystemState, useOpenCapability } from '@/coreos/react';
import { getKernel, IntentFactory } from '@/coreos';
import { useBrand } from '@/contexts/BrandContext';
import { Shield, BarChart3, Search } from 'lucide-react';

interface ProgramOption {
    id: ProgramId;
    labelKey: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
    tag?: string;
}

export function ProgramSwitcher() {
    const { activeProgram } = useProgram();
    const systemState = useSystemState();
    const openCapability = useOpenCapability();

    // Check if tools window is open
    const openWindows = Object.values(systemState.windows).filter(w => w.capabilityId === 'core.tools');
    const isToolsOpen = openWindows.length > 0;
    const toolsWindowId = openWindows[0]?.id;

    const toggleTools = () => {
        if (isToolsOpen && toolsWindowId) {
            getKernel().emit(IntentFactory.closeWindow(toolsWindowId));
        } else {
            // Phase 18: Open as UTILITY window
            openCapability('core.tools');
        }
    };

    return (
        <button
            onClick={toggleTools}
            className={`
                flex items-center justify-center gap-1
                h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] md:h-[42px] md:w-[42px]
                rounded-full transition-all duration-150 border group outline-none 
                shadow-sm hover:shadow-md focus-visible:ring-2 ring-blue-500/20
                ${isToolsOpen
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'bg-white/80 hover:bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                }
            `}
            title="Utility Tools"
        >
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-[#242424] leading-none uppercase">UT</span>
        </button>
    );
}

