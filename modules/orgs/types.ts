/**
 * Organizations Module Types
 */

export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    logoURL: string | null;
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    settings: {
        timezone: string;
        currency: string;
        dateFormat: string;
        language: string;
    };
    modules: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface CreateOrgRequest {
    name: string;
    slug: string;
    domain?: string;
    plan?: Organization['plan'];
    modules?: string[];
}
