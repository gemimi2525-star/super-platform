import { BaseAdapter } from './base';
import { CoreObject } from '../types';

interface OrgApiResponse {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    // ... other fields
}

interface ApiResponse {
    success?: boolean;
    organizations?: OrgApiResponse[];
    organization?: OrgApiResponse;
    error?: any;
}

export class OrgsAdapter extends BaseAdapter {
    async resolve(path: string): Promise<CoreObject | null> {
        // Collection: /data/orgs
        if (path === '/data/orgs') {
            try {
                // Call the Hardened API
                const res = await fetch('/api/platform/orgs');
                // Note: API returns 401 if unauth, 503 if degraded.
                // We should handle these status codes if possible, 
                // but fetch doesn't throw on 401/503 automatically.

                const data = await res.json() as ApiResponse;

                let children: CoreObject[] = [];

                if (data.organizations) {
                    children = data.organizations.map(org => ({
                        id: org.id,
                        type: 'object',
                        path: `/data/orgs/${org.id}`,
                        name: org.name,
                        meta: {
                            slug: org.slug,
                            icon: 'building'
                        },
                        createdAt: org.createdAt,
                        updatedAt: org.updatedAt,
                        capabilities: ['read']
                    }));
                }

                return {
                    id: 'data-orgs',
                    type: 'collection',
                    path: '/data/orgs',
                    name: 'Organizations',
                    meta: {
                        icon: 'building-folder',
                        degraded: data.error?.degraded || false
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    capabilities: ['read', 'list'],
                    children
                };

            } catch (error) {
                console.error("OrgsAdapter error:", error);
                // Return empty collection with error meta
                return {
                    id: 'data-orgs',
                    type: 'collection',
                    path: '/data/orgs',
                    name: 'Organizations (Error)',
                    meta: { icon: 'alert-triangle' },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    capabilities: [],
                    children: []
                };
            }
        }

        // Single Object: /data/orgs/[id]
        // For v1, we only implement list. Single resolve can be added later or purely via children.
        // But to be complete, let's allow resolving a child if we knew how to fetch one efficiently.
        // The API /api/platform/orgs returns list. 
        // We can implement finding by ID if we wanted, but let's stick to List View first.
        return null;
    }
}
