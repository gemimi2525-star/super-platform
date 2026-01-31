import { BaseAdapter } from './base';
import { CoreObject } from '../types';

export class SystemAdapter extends BaseAdapter {
    async resolve(path: string): Promise<CoreObject | null> {
        // Mock System Structure
        if (path === '/system') {
            return {
                id: 'system-root',
                type: 'system',
                path: '/system',
                name: 'System',
                meta: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                capabilities: ['read'],
                children: [
                    await this.resolve('/system/apps')!,
                    await this.resolve('/system/settings')!
                ] as CoreObject[]
            };
        }

        if (path === '/system/apps') {
            return {
                id: 'system-apps',
                type: 'collection',
                path: '/system/apps',
                name: 'Applications',
                meta: { icon: 'apps' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                capabilities: ['read', 'list'],
                children: [
                    {
                        id: 'app-users',
                        type: 'app',
                        path: '/system/apps/users',
                        name: 'Users',
                        meta: { icon: 'users', appId: 'users' },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        capabilities: ['execute']
                    },
                    {
                        id: 'app-orgs',
                        type: 'app',
                        path: '/system/apps/orgs',
                        name: 'Organizations',
                        meta: { icon: 'building', appId: 'orgs' },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        capabilities: ['execute']
                    }
                ]
            };
        }

        if (path === '/system/settings') {
            return {
                id: 'system-settings',
                type: 'collection',
                path: '/system/settings',
                name: 'Settings',
                meta: { icon: 'settings' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                capabilities: ['read', 'list'],
                children: []
            };
        }

        return null;
    }
}
