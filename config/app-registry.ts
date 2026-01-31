import { OSAppDefinition, OSNavigationGroup } from '@super-platform/core/src/types/os-app';

export const APP_REGISTRY_VERSION = '1.0.0';

export const APP_REGISTRY: OSAppDefinition[] = [
    {
        appId: 'users',
        kind: 'business',
        i18nKey: 'apps.users.title',
        iconKey: 'users',
        mount: {
            basePath: '/v2/users',
        },
        nav: [
            {
                id: 'users-list',
                i18nKey: 'apps.users.nav.list',
                path: '/v2/users',
                type: 'link',
            },
        ],
        access: {
            requiredPolicies: ['users.read'],
        },
        entitlement: {
            requiredFlags: ['app.users'],
            availability: 'core',
        },
        lifecycle: {
            status: 'stable',
        },
    },
    {
        appId: 'orgs',
        kind: 'business',
        i18nKey: 'apps.orgs.title',
        iconKey: 'building',
        mount: {
            basePath: '/v2/orgs',
        },
        nav: [
            {
                id: 'orgs-list',
                i18nKey: 'apps.orgs.nav.list',
                path: '/v2/orgs',
                type: 'link',
            },
        ],
        access: {
            requiredPolicies: ['orgs.read'],
        },
        entitlement: {
            requiredFlags: ['app.orgs'],
            availability: 'core',
        },
        lifecycle: {
            status: 'stable',
        },
    },
    {
        appId: 'audit-logs',
        kind: 'system',
        i18nKey: 'apps.audit.title',
        iconKey: 'clipboard-list',
        mount: {
            basePath: '/v2/audit-logs',
        },
        nav: [
            {
                id: 'audit-logs-list',
                i18nKey: 'apps.audit.nav.list',
                path: '/v2/audit-logs',
                type: 'link',
            },
        ],
        access: {
            requiredPolicies: ['audit.view'],
        },
        entitlement: {
            requiredFlags: ['app.audit'],
            availability: 'addon',
        },
        lifecycle: {
            status: 'stable',
        },
    },
    {
        appId: 'settings',
        kind: 'system',
        i18nKey: 'apps.settings.title',
        iconKey: 'settings',
        mount: {
            basePath: '/v2/settings',
        },
        nav: [
            {
                id: 'settings-general',
                i18nKey: 'apps.settings.nav.general',
                path: '/v2/settings',
                type: 'link',
            },
        ],
        access: {
            requiredPolicies: ['settings.read'],
        },
        entitlement: {
            requiredFlags: ['app.settings'],
            availability: 'core',
        },
        lifecycle: {
            status: 'hidden', // Placeholder status as per requirements
        },
    },
];

export const NAV_GROUPS: OSNavigationGroup[] = [
    {
        id: 'workspace',
        i18nKey: 'nav.group.workspace',
        apps: ['users', 'orgs'],
    },
    {
        id: 'system',
        i18nKey: 'nav.group.system',
        apps: ['audit-logs', 'settings'],
    },
];
