import { BaseAdapter } from './base';
import { CoreObject } from '../types';

export class UsersAdapter extends BaseAdapter {
    async resolve(path: string): Promise<CoreObject | null> {
        // /data/users
        if (path === '/data/users') {
            return {
                id: 'data-users',
                type: 'collection',
                path: '/data/users',
                name: 'Users',
                meta: { icon: 'users' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                capabilities: ['read', 'list', 'create'],
                children: [
                    {
                        id: 'user-1',
                        type: 'object',
                        path: '/data/users/1',
                        name: 'Admin User',
                        meta: { email: 'admin@apicoredata.com', role: 'admin' },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        capabilities: ['read', 'write']
                    }
                ]
            };
        }

        // /data/users/1
        if (path === '/data/users/1') {
            return {
                id: 'user-1',
                type: 'object',
                path: '/data/users/1',
                name: 'Admin User',
                meta: { email: 'admin@apicoredata.com', role: 'admin' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                capabilities: ['read', 'write']
            };
        }

        return null;
    }
}
