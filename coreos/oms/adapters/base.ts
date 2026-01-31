import { OMSAdapter, CoreObject } from '../types';

export abstract class BaseAdapter implements OMSAdapter {
    abstract resolve(path: string): Promise<CoreObject | null>;

    async list(path: string): Promise<CoreObject[]> {
        const obj = await this.resolve(path);
        return obj?.children || [];
    }

    async get(path: string): Promise<CoreObject | null> {
        return this.resolve(path);
    }

    async search(query: string, scope?: string): Promise<CoreObject[]> {
        return []; // Default empty implementation
    }
}
