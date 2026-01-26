'use client';

import React, { createContext, useContext, useState } from 'react';

// Simplified to avoid potential type/parsing issues
export type ProgramId = 'platform' | 'seo' | 'analytics';
const ProgramContext = createContext<any>(undefined);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
    const [activeProgram, setActiveProgram] = useState('platform');

    return (
        <ProgramContext.Provider value={{ activeProgram, setActiveProgram }}>
            {children}
        </ProgramContext.Provider>
    );
}

export function useProgram() {
    return useContext(ProgramContext);
}
