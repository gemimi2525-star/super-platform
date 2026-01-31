export type OMSType = 'collection' | 'object' | 'app' | 'system';

export interface CoreObject {
    id: string;
    type: OMSType;
    path: string; // Canonical path e.g., /data/users/123
    name: string;
    meta: Record<string, any>;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    capabilities: string[]; // ['read', 'write', 'execute']
    children?: CoreObject[]; // For collections, optional
}

export interface OMSAdapter {
    resolve(path: string): Promise<CoreObject | null>;
    list(path: string): Promise<CoreObject[]>;
    get(path: string): Promise<CoreObject | null>;
    search(query: string, scope?: string): Promise<CoreObject[]>;
}

export interface OMSResolverInterface {
    resolve(path: string): Promise<CoreObject | null>;
    list(path: string): Promise<CoreObject[]>;
    get(path: string): Promise<CoreObject | null>;
    search(query: string, scope?: string): Promise<CoreObject[]>;
}
