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
                // Call the Hardened API (F4)
                const res = await fetch('/api/platform/orgs', {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include' // Ensure cookies are sent
                });

                // F4: Check Content-Type (Defensive Parse)
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    // Start of Defensive Logic
                    const text = await res.text();
                    const preview = text.slice(0, 80).replace(/\n/g, ' ');
                    console.error(`[OMS] Invalid API response (Not JSON). Status: ${res.status}. Preview: ${preview}`);

                    if (res.status === 401 || res.status === 403 || res.url.includes('/login')) {
                        // Handle session expiry logic
                        console.warn('[OMS] Session expired during fetch');
                        return {
                            id: 'orgs-error',
                            type: 'collection',
                            path: '/data/orgs',
                            name: 'Session Expired',
                            meta: {
                                icon: 'lock',
                                error: 'unauthorized',
                                description: 'Please login to view organizations'
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            capabilities: [],
                            children: []
                        };
                    }

                    throw new Error(`API returned ${contentType} instead of JSON`);
                }

                // If JSON, parse it
                const data = await res.json() as ApiResponse;

                // Handle Error Logic from API (401/503) embedded in JSON logic or status
                if (!res.ok) {
                    // Check if it is Degraded Mode 503
                    if (res.status === 503) {
                        return {
                            id: 'data-orgs',
                            type: 'collection',
                            path: '/data/orgs',
                            name: 'Organizations (Offline)',
                            meta: {
                                icon: 'cloud-off',
                                degraded: true,
                                error: data.error?.message || 'Service Unavailable'
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            capabilities: [],
                            children: []
                        };
                    }

                    // 401 check again just in case JSON returned 401
                    if (res.status === 401) {
                        return {
                            id: 'orgs-error',
                            type: 'collection',
                            path: '/data/orgs',
                            name: 'Session Expired',
                            meta: { icon: 'lock', error: 'unauthorized' },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            capabilities: [],
                            children: []
                        };
                    }

                    console.error('[OMS] API Error:', data.error);
                }

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

        return null;
    }
}
