import { OSAppDefinition } from '../../types/os-app';

export class RegistryValidationError extends Error {
    constructor(message: string) {
        super(`[Registry Validation Error] ${message}`);
        this.name = 'RegistryValidationError';
    }
}

/**
 * Validates the App Registry configuration.
 * Enforces rules for appIds, paths, and mount points.
 * @param apps List of OSAppDefinition
 */
export function validateRegistry(apps: OSAppDefinition[]): void {
    const appIds = new Set<string>();

    for (const app of apps) {
        // Rule 1: Unique appId
        if (appIds.has(app.appId)) {
            throw new RegistryValidationError(`Duplicate appId found: '${app.appId}'`);
        }
        appIds.add(app.appId);

        // Rule 2 & 3: Mount path must start with /v2/
        if (!app.mount.basePath.startsWith('/v2/')) {
            throw new RegistryValidationError(
                `App '${app.appId}': Mount basePath must start with '/v2/'. Found: '${app.mount.basePath}'`
            );
        }

        // Validate Navigation Items
        validateNavItems(app.nav, app.mount.basePath, app.appId);
    }
}

function validateNavItems(items: OSAppDefinition['nav'], basePath: string, appId: string): void {
    for (const item of items) {
        // Rule 2: nav.path must be under mount.basePath
        // We allow absolute paths if they start with the basePath
        if (item.path.startsWith('/')) {
            if (!item.path.startsWith(basePath)) {
                throw new RegistryValidationError(
                    `App '${appId}': Nav item '${item.id}' path '${item.path}' is not within basePath '${basePath}'`
                );
            }
        } else {
            // Relative paths are generally fine, standardizing on absolute usually safer but for now, 
            // let's assume relative means relative to basePath.
            // If design system assumes absolute, warnings should be handled there.
            // For strict OS compliance, let's enforce absolute paths in registry for clarity.
            // (Self-correction: The prompt asks to check if under basePath. 
            // If path is relative 'dashboard', it technically is under basePath when resolved.
            // But to be safe, let's warn against suspicious paths like '../').
            if (item.path.includes('..')) {
                throw new RegistryValidationError(
                    `App '${appId}': Nav item '${item.id}' contains relative traversal '..', which is unsafe.`
                );
            }
        }

        if (item.children) {
            validateNavItems(item.children, basePath, appId);
        }
    }
}
