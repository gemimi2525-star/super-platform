/**
 * Auth Store
 * 
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, Organization } from '@/lib/types';

interface AuthState {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    currentOrganization: Organization | null;
    loading: boolean;

    setFirebaseUser: (user: FirebaseUser | null) => void;
    setUser: (user: User | null) => void;
    setCurrentOrganization: (org: Organization | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            firebaseUser: null,
            user: null,
            currentOrganization: null,
            loading: true,

            setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
            setUser: (user) => set({ user }),
            setCurrentOrganization: (currentOrganization) => set({ currentOrganization }),
            setLoading: (loading) => set({ loading }),

            logout: () => set({
                firebaseUser: null,
                user: null,
                currentOrganization: null,
            }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                currentOrganization: state.currentOrganization,
            }),
        }
    )
);
