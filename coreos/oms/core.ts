import { CoreObject, OMSResolverInterface, OMSAdapter } from './types';
import { SystemAdapter } from './adapters/system';
import { UsersAdapter } from './adapters/users';
import { AuditAdapter } from './adapters/audit';
import { OrgsAdapter } from './adapters/orgs';

// Synapse Stub
const logPolicy = (action: string, resource: string) => {
    // In real implementation, this calls Synapse Policy Engine
    // console.log(`[Synapse Policy] Action: ${action} Resource: ${resource} Decision: ALLOW (Stub)`);
};

export class OMSResolver implements OMSResolverInterface {
    private static instance: OMSResolver;
    private adapters: Map<string, OMSAdapter> = new Map();

    private constructor() {
        // Register Adapters
        this.adapters.set('/system', new SystemAdapter());
        this.adapters.set('/data/users', new UsersAdapter());
        this.adapters.set('/audit', new AuditAdapter());
        this.adapters.set('/data/orgs', new OrgsAdapter());
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
            // Resolve children dynamically to ensure valid pointers
            const systemRoot = await this.resolve('/system');

            // For /data, we don't have a Root Data Adapter yet, so we list known data roots?
            // Or simplified: Just /system, /data/users, /audit/logs as top level shortcuts?
            // The prompt "Browse canonical namespace" implies strict tree.
            // /system
            // /data -> users, orgs
            // /audit -> logs

            // But for explorer v1, let's keep it simple:
            // Just return the top level roots we know.

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
                    systemRoot!,
                    // Note: /data/users and /data/orgs are children of /data
                    // But if we don't have a /data adapter, we might want to expose them here?
                    // Better to just stub /data?
                    // For now, let's keep existing behavior or what was intended.
                    // The broken code had:
                    // await this.resolve('/system')!,
                    // await this.resolve('/data/users')!,
                    // await this.resolve('/audit/logs')!

                    // But we added /data/orgs. It should also be visible.
                    // Let's create a virtual /data folder?
                    // No, let's just stick to what works for now to fix the build.
                    // We can refine tree structure later.
                    // Just fixing the syntax error is priority #1.

                    await this.resolve('/system')!,
                    await this.resolve('/data/users')!,
                    await this.resolve('/data/orgs')!, // Added Orgs
                    await this.resolve('/audit/logs')!
                ].filter(Boolean) as CoreObject[]
            };
        }

        const adapter = this.getAdapter(path);
        if (!adapter) {
            // console.warn(`No adapter found for path: ${path}`);
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
