import { CoreObject, OMSResolverInterface, OMSAdapter } from './types';
import { SystemAdapter } from './adapters/system';
import { UsersAdapter } from './adapters/users';
import { AuditAdapter } from './adapters/audit';

// Synapse Stub
const logPolicy = (action: string, resource: string) => {
    // In real implementation, this calls Synapse Policy Engine
    // console.log(`[Synapse Policy] Action: ${action} Resource: ${resource} Decision: ALLOW (Stub)`);
};

export class OMSResolver implements OMSResolverInterface {
    private static instance: OMSResolver;
    private adapters: Map<string, OMSAdapter> = new Map();

    private constructor() {
        this.adapters.set('/system', new SystemAdapter());
        this.adapters.set('/data/users', new UsersAdapter());
        this.adapters.set('/audit', new AuditAdapter());
        // /data/orgs can use UsersAdapter for now or similar stub
        this.adapters.set('/data/orgs', new UsersAdapter()); // Reusing for stub
    }

    public static getInstance(): OMSResolver {
        if (!OMSResolver.instance) {
            OMSResolver.instance = new OMSResolver();
        }
        return OMSResolver.instance;
    }

    private getAdapter(path: string): OMSAdapter | null {
        // Simple prefix match
        for (const [prefix, adapter] of this.adapters) {
            if (path.startsWith(prefix)) {
                return adapter;
            }
        }
        return null;
    }

    async resolve(path: string): Promise<CoreObject | null> {
        logPolicy('oms.resolve', path);

        // Root handling
        if (path === '/') {
            return {
                id: 'root',
                type: 'system',
                path: '/',
                name: 'Root',
                meta: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                capabilities: ['read', 'list'],
                children: [
                    await this.resolve('/system')!,
                    await this.resolve('/data/users')!, // Stub for /data
                    await this.resolve('/audit/logs')!// Stub for /audit
                ] as CoreObject[]
            };
        }

        const adapter = this.getAdapter(path);
        if (!adapter) {
            console.warn(`No adapter found for path: ${path}`);
            return null;
        }

        return adapter.resolve(path);
    }

    async list(path: string): Promise<CoreObject[]> {
        const obj = await this.resolve(path);
        return obj?.children || [];
    }

    async get(path: string): Promise<CoreObject | null> {
        return this.resolve(path);
    }

    async search(query: string, scope?: string): Promise<CoreObject[]> {
        logPolicy('oms.search', scope || '/');
        // Stub implementation
        return [];
    }
}
