/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Dev Package Loader (Phase 25)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates and installs capability packages (dev-only).
 * No dynamic code execution. No eval. No remote fetch.
 */

import type { CapabilityPackage, PackageValidationResult, InstalledPackage } from './types';
import { MAX_DEV_PACKAGES, FORBIDDEN_TRUST, PROTECTED_IDS } from './types';
import { usePackageStore } from './store';

/**
 * SHA-256 hash of stringified package JSON (for audit argsHash)
 */
async function computeArgsHash(pkg: CapabilityPackage): Promise<string> {
    const data = JSON.stringify(pkg, Object.keys(pkg).sort());
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const buf = new TextEncoder().encode(data);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for SSR
    return `hash:${data.length}:${Date.now()}`;
}

/**
 * Validate a capability package JSON
 */
export function validatePackage(pkg: unknown): PackageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pkg || typeof pkg !== 'object') {
        return { valid: false, errors: ['Package must be a JSON object'], warnings };
    }

    const p = pkg as Record<string, unknown>;

    // Required fields
    if (!p.id || typeof p.id !== 'string') errors.push('Missing or invalid "id"');
    if (!p.version || typeof p.version !== 'string') errors.push('Missing or invalid "version"');

    // Semver check
    if (typeof p.version === 'string' && !/^\d+\.\d+\.\d+/.test(p.version)) {
        errors.push('Version must be semver (e.g. "0.1.0")');
    }

    // Manifest
    if (!p.manifest || typeof p.manifest !== 'object') {
        errors.push('Missing "manifest" object');
    } else {
        const m = p.manifest as Record<string, unknown>;
        if (!m.capabilityId || typeof m.capabilityId !== 'string') {
            errors.push('Missing manifest.capabilityId');
        }
        if (!m.trustLevel || typeof m.trustLevel !== 'string') {
            errors.push('Missing manifest.trustLevel');
        } else if (FORBIDDEN_TRUST.includes(m.trustLevel as string)) {
            errors.push(`Forbidden trustLevel: "${m.trustLevel}" — SYSTEM trust not allowed`);
        }
        if (!Array.isArray(m.permissions)) {
            warnings.push('Missing manifest.permissions array (defaulting to [])');
        }
    }

    // UI
    if (!p.ui || typeof p.ui !== 'object') {
        errors.push('Missing "ui" object');
    } else {
        const u = p.ui as Record<string, unknown>;
        if (!u.title || typeof u.title !== 'string') errors.push('Missing ui.title');
        if (!u.icon || typeof u.icon !== 'string') warnings.push('Missing ui.icon (will use default)');
    }

    // Protected ID check
    if (typeof p.id === 'string' && PROTECTED_IDS.includes(p.id)) {
        errors.push(`Cannot overwrite protected capability: "${p.id}"`);
    }

    // Duplicate check
    if (typeof p.id === 'string' && usePackageStore.getState().hasPackage(p.id)) {
        errors.push(`Package "${p.id}" is already installed`);
    }

    // Cap check
    if (usePackageStore.getState().packages.length >= MAX_DEV_PACKAGES) {
        errors.push(`Maximum ${MAX_DEV_PACKAGES} dev packages allowed`);
    }

    return { valid: errors.length === 0, errors, warnings };
}

/**
 * Install a capability package (dev-only)
 */
export async function installPackage(pkg: CapabilityPackage): Promise<{
    success: boolean;
    installed?: InstalledPackage;
    errors?: string[];
}> {
    if (process.env.NODE_ENV === 'production') {
        return { success: false, errors: ['Package installation disabled in production'] };
    }

    const validation = validatePackage(pkg);
    if (!validation.valid) {
        return { success: false, errors: validation.errors };
    }

    const argsHash = await computeArgsHash(pkg);
    const installed: InstalledPackage = {
        ...pkg,
        installedAt: new Date().toISOString(),
        argsHash,
    };

    const added = usePackageStore.getState().addPackage(installed);
    if (!added) {
        return { success: false, errors: ['Failed to add package to store (duplicate or cap reached)'] };
    }

    return { success: true, installed };
}

/**
 * Uninstall a capability package
 */
export function uninstallPackage(id: string): { success: boolean; error?: string } {
    if (process.env.NODE_ENV === 'production') {
        return { success: false, error: 'Package uninstallation disabled in production' };
    }

    const removed = usePackageStore.getState().removePackage(id);
    if (!removed) {
        return { success: false, error: `Package "${id}" not found` };
    }

    return { success: true };
}
