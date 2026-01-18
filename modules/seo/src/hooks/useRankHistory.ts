/**
 * React Query Hooks for Rank History
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    addRankEntry,
    getRankHistory,
    deleteRankEntry
} from '../services/rank-history';
import type { RankHistory, CreateRankHistoryInput } from '../types';
import { auditLogService } from '../services/audit-logs';

/**
 * Hook to fetch rank history for a keyword
 */
export function useRankHistory(organizationId: string, keywordId: string) {
    return useQuery({
        queryKey: ['rank-history', organizationId, keywordId],
        queryFn: () => getRankHistory(organizationId, keywordId),
        enabled: !!organizationId && !!keywordId,
    });
}

/**
 * Hook to add a rank entry
 */
export function useAddRankEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRankHistoryInput) => {
            return addRankEntry(data);
        },
        onSuccess: (_, variables) => {
            // Invalidate history for this keyword
            queryClient.invalidateQueries({
                queryKey: ['rank-history', variables.organizationId, variables.keywordId]
            });
            // Invalidate keywords list (to show new Current Rank)
            queryClient.invalidateQueries({
                queryKey: ['keywords', variables.organizationId]
            });
            // Invalidate single keyword (to update detail view)
            queryClient.invalidateQueries({
                queryKey: ['keyword', variables.keywordId]
            });
        },
    });
}

/**
 * Hook to delete a rank entry
 */
/**
 * Hook to delete a rank entry
 */
export function useDeleteRankEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, context }: { id: string; context?: { organizationId: string; userId: string; keywordId: string } }) => {
            if (!context?.organizationId) throw new Error("Organization ID required for delete");
            return deleteRankEntry(context.organizationId, id);
        },
        onSuccess: async (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rank-history'] });

            if (variables.context) {
                await auditLogService.logAction({
                    organizationId: variables.context.organizationId,
                    actor: { userId: variables.context.userId },
                    action: 'rank.update',
                    entity: { type: 'rank', id: variables.context.keywordId, name: 'Deleted Rank' }
                });
            }
        },
    });
}
