/**
 * React Query Hooks for Pages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPagesByOrganization,
    getPagesBySite,
    getPageById,
    createPage,
    updatePage,
    deletePage
} from '../services/pages';
import type { Page, CreatePageInput, UpdatePageInput } from '../types';

/**
 * Hook to fetch pages for current organization
 * SECURITY: Scoped by organizationId
 */
export function usePages(organizationId: string) {
    return useQuery({
        queryKey: ['pages', organizationId],
        queryFn: () => getPagesByOrganization(organizationId),
        enabled: !!organizationId,
    });
}

/**
 * Hook to fetch pages for a specific site
 * SECURITY: Scoped by organizationId AND siteId
 */
export function usePagesBySite(organizationId: string, siteId: string) {
    return useQuery({
        queryKey: ['pages', organizationId, 'site', siteId],
        queryFn: () => getPagesBySite(organizationId, siteId),
        enabled: !!organizationId && !!siteId,
    });
}

/**
 * Hook to fetch a single page
 */
export function usePage(organizationId: string, pageId: string) {
    return useQuery({
        queryKey: ['page', pageId, organizationId],
        queryFn: () => getPageById(organizationId, pageId),
        enabled: !!pageId && !!organizationId,
    });
}

/**
 * Hook to create a page
 */
import { auditLogService } from '../services/audit-logs';

// ...

export function useCreatePage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            organizationId,
            userId,
            pageData
        }: {
            organizationId: string;
            userId: string;
            pageData: Omit<CreatePageInput, 'organizationId' | 'createdBy'>;
        }) => {
            return createPage({
                ...pageData,
                organizationId,
                createdBy: userId,
            });
        },
        onSuccess: async (newPage, variables) => {
            // Invalidate pages list for this organization
            queryClient.invalidateQueries({ queryKey: ['pages', variables.organizationId] });

            await auditLogService.logAction({
                organizationId: variables.organizationId,
                actor: { userId: variables.userId },
                action: 'page.create',
                entity: { type: 'page', id: newPage, name: variables.pageData.title || variables.pageData.url }
            });
        },
    });
}

/**
 * Hook to update a page
 */
/**
 * Hook to update a page
 */
export function useUpdatePage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, updates, context }: { pageId: string; updates: Partial<CreatePageInput>; context?: { organizationId: string; userId: string; title: string } }) => {
            if (!context?.organizationId) throw new Error("Organization ID required for update");
            return updatePage({ organizationId: context.organizationId, pageId, updates });
        },
        onSuccess: async (_, variables) => {
            // Invalidate the specific page
            queryClient.invalidateQueries({ queryKey: ['page', variables.pageId] });
            // Also invalidate pages list (to refresh in table)
            queryClient.invalidateQueries({ queryKey: ['pages'] });

            if (variables.context) {
                await auditLogService.logAction({
                    organizationId: variables.context.organizationId,
                    actor: { userId: variables.context.userId },
                    action: 'page.update',
                    entity: { type: 'page', id: variables.pageId, name: variables.context.title }
                });
            }
        },
    });
}

/**
 * Hook to delete a page
 */
export function useDeletePage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, context }: { pageId: string; context?: { organizationId: string; userId: string; title: string } }) => {
            if (!context?.organizationId) throw new Error("Organization ID required for delete");
            return deletePage(context.organizationId, pageId);
        },
        onSuccess: async (_, variables) => {
            // Invalidate all pages queries
            queryClient.invalidateQueries({ queryKey: ['pages'] });

            if (variables.context) {
                await auditLogService.logAction({
                    organizationId: variables.context.organizationId,
                    actor: { userId: variables.context.userId },
                    action: 'page.delete',
                    entity: { type: 'page', id: variables.pageId, name: variables.context.title }
                });
            }
        },
    });
}
