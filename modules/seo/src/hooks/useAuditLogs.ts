import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditLogService, type CreateAuditLogData } from '../services/audit-logs';

const KEYS = {
    LOGS: 'audit_logs',
};

export function useAuditLogs(organizationId: string) {
    return useQuery({
        queryKey: [KEYS.LOGS, organizationId],
        queryFn: () => auditLogService.getLogs(organizationId),
        enabled: !!organizationId,
    });
}

export function useLogAudit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAuditLogData) => auditLogService.logAction(data),
        onSuccess: (_, variables) => {
            // Invalidate logs for the organization
            queryClient.invalidateQueries({
                queryKey: [KEYS.LOGS, variables.organizationId]
            });
        },
    });
}
