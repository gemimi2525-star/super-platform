'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const STORAGE_KEY = 'admin_context_org_id';

interface AdminContextType {
    selectedOrgId: string | null;
    selectOrg: (orgId: string | null) => void;
    isLoadingContext: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [isLoadingContext, setIsLoadingContext] = useState(true);

    // Load from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setSelectedOrgId(stored);
        }
        setIsLoadingContext(false);
    }, []);

    const selectOrg = (orgId: string | null) => {
        if (orgId) {
            localStorage.setItem(STORAGE_KEY, orgId);
            toast.success(`Switched to Organization: ${orgId}`);
        } else {
            localStorage.removeItem(STORAGE_KEY);
            toast('Cleared Organization Context');
        }
        setSelectedOrgId(orgId);

        // Optional: Refresh page or revalidate data
        // router.refresh(); 
    };

    return (
        <AdminContext.Provider value={{ selectedOrgId, selectOrg, isLoadingContext }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminContext() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdminContext must be used within an AdminProvider');
    }
    return context;
}
