/**
 * React Query Hooks for Sites
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSitesByOrganization,
    getSiteById,
    createSite,
    updateSite,
    deleteSite
} from '../services/sites';
import type { Site } from '../types';

/**
 * Hook to fetch sites for current organization
 */
export function useSites(organizationId: string) {
    return useQuery({
        queryKey: ['sites', organizationId],
        queryFn: () => getSitesByOrganization(organizationId),
        enabled: !!organizationId,
    });
}

/**
 * Hook to fetch a single site
 */
export function useSite(siteId: string) {
    return useQuery({
        queryKey: ['site', siteId],
        queryFn: () => getSiteById(siteId),
        enabled: !!siteId,
    });
}

/**
 * Hook to create a site
 */
export function useCreateSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            organizationId,
            userId,
            siteData
        }: {
            organizationId: string;
            userId: string;
            siteData: Omit<Site, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy'>;
        }) => createSite(organizationId, userId, siteData),
        onSuccess: (_, variables) => {
            // Invalidate sites query for this organization
            queryClient.invalidateQueries({ queryKey: ['sites', variables.organizationId] });
        },
    });
}

/**
 * Hook to update a site
 */
export function useUpdateSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            siteId,
            updates
        }: {
            siteId: string;
            updates: Partial<Site>;
        }) => updateSite(siteId, updates),
        onSuccess: (_, variables) => {
            // Invalidate specific site query
            queryClient.invalidateQueries({ queryKey: ['site', variables.siteId] });
            // Invalidate sites list
            queryClient.invalidateQueries({ queryKey: ['sites'] });
        },
    });
}

/**
 * Hook to delete a site
 */
export function useDeleteSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (siteId: string) => deleteSite(siteId),
        onSuccess: () => {
            // Invalidate all sites queries
            queryClient.invalidateQueries({ queryKey: ['sites'] });
        },
    });
}
