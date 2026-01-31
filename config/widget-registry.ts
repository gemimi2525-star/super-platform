import { OSWidgetDefinition } from '../packages/core/src/os/widgets/types';
import { UsersSummaryWidget, AuditActivityWidget, OrgOverviewWidget } from './mock-widgets';

// --- WIDGET REGISTRY ---

export const WIDGET_REGISTRY: OSWidgetDefinition[] = [
    {
        widgetId: 'users.summary',
        title: 'Users',
        size: 'sm',
        requiredPolicies: ['users.read'],
        render: UsersSummaryWidget,
        priority: 100,
    },
    {
        widgetId: 'orgs.overview',
        title: 'Organizations',
        size: 'sm',
        requiredPolicies: ['orgs.read'],
        render: OrgOverviewWidget,
        priority: 90,
    },
    {
        widgetId: 'audit.activity',
        title: 'Security Audit',
        size: 'md',
        requiredFlags: ['app.audit'],
        requiredPolicies: ['audit.view'],
        render: AuditActivityWidget,
        priority: 80,
    },
];
