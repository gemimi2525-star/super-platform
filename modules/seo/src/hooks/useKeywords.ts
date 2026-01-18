/**
 * React Query Hooks for Keywords
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getKeywordsByOrganization,
    getKeywordsByPage,
    getKeywordById,
    createKeyword,
    updateKeyword,
    deleteKeyword
} from '../services/keywords';
import type { Keyword, CreateKeywordInput, UpdateKeywordInput } from '../types';

/**
 * Hook to fetch keywords for current organization
 * SECURITY: Scoped by organizationId
 */
export function useKeywords(organizationId: string) {
    return useQuery({
        queryKey: ['keywords', organizationId],
        queryFn: () => getKeywordsByOrganization(organizationId),
        enabled: !!organizationId,
    });
}

/**
 * Hook to fetch keywords for a specific page
 * SECURITY: Scoped by organizationId AND pageId
 */
export function useKeywordsByPage(organizationId: string, pageId: string) {
    return useQuery({
        queryKey: ['keywords', organizationId, 'page', pageId],
        queryFn: () => getKeywordsByPage(organizationId, pageId),
        enabled: !!organizationId && !!pageId,
    });
}

/**
 * Hook to fetch a single keyword
 */
/**
 * Hook to fetch a single keyword
 * REQUIRES organizationId
 */
export function useKeyword(organizationId: string, keywordId: string) {
    return useQuery({
        queryKey: ['keyword', keywordId, organizationId],
        queryFn: () => getKeywordById(organizationId, keywordId),
        enabled: !!keywordId && !!organizationId,
    });
}

/**
 * Hook to create a keyword
 */
export function useCreateKeyword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            organizationId,
            userId,
            keywordData
        }: {
            organizationId: string;
            userId: string;
            keywordData: Omit<CreateKeywordInput, 'organizationId' | 'createdBy'>;
        }) => {
            return createKeyword({
                ...keywordData,
                organizationId,
                createdBy: userId,
            });
        },
        onSuccess: (_, variables) => {
            // Invalidate keywords list for this organization
            queryClient.invalidateQueries({ queryKey: ['keywords', variables.organizationId] });
            // Also invalidate page-specific queries if pageId was provided
            if (variables.keywordData.pageId) {
                queryClient.invalidateQueries({
                    queryKey: ['keywords', variables.organizationId, 'page', variables.keywordData.pageId]
                });
            }
        },
    });
}

/**
 * Hook to update a keyword
 */
export function useUpdateKeyword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ organizationId, keywordId, updates, context }: { organizationId: string; keywordId: string; updates: UpdateKeywordInput; context?: any }) => {
            return updateKeyword({ organizationId, keywordId, updates });
        },
        onSuccess: (_, variables) => {
            // Invalidate the specific keyword
            queryClient.invalidateQueries({ queryKey: ['keyword', variables.keywordId] });
            // Invalidate keywords list
            queryClient.invalidateQueries({ queryKey: ['keywords'] });

            // Audit Log (if context provided) - Re-adding this as it seems missing
            if (variables.context) {
                import('../services/audit-logs').then(({ auditLogService }) => {
                    auditLogService.logAction({
                        organizationId: variables.organizationId,
                        actor: { userId: variables.context.userId },
                        action: 'keyword.update',
                        entity: { type: 'keyword', id: variables.keywordId, name: variables.context.term || 'Keyword' }
                    }).catch(console.error);
                });
            }
        },
    });
}

/**
 * Hook to delete a keyword
 */
export function useDeleteKeyword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ organizationId, keywordId, context }: { organizationId: string; keywordId: string; context?: any }) => {
            return deleteKeyword(organizationId, keywordId);
        },
        onSuccess: (_, variables) => {
            // Invalidate all keywords queries
            queryClient.invalidateQueries({ queryKey: ['keywords'] });

            // Audit Log
            if (variables.context) {
                import('../services/audit-logs').then(({ auditLogService }) => {
                    auditLogService.logAction({
                        organizationId: variables.organizationId,
                        actor: { userId: variables.context.userId },
                        action: 'keyword.delete',
                        entity: { type: 'keyword', id: variables.keywordId, name: variables.context.term || 'Keyword' }
                    }).catch(console.error);
                });
            }
        },
    });
}
