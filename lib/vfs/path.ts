/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS PATH UTILS (Phase 15A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Canonical Path Management for VFS.
 * Enforces scheme rules and prevents traversal attacks.
 * 
 * Schemes:
 * - system:// (ReadOnly/OS)
 * - user:// (User Data)
 * - workspace:// (Team Data)
 * 
 * @module lib/vfs/path
 */

import { VFSError, VFSScheme } from './types';

const VALID_SCHEMES: VFSScheme[] = ['system', 'user', 'workspace'];

export class VFSPath {
    /**
     * Normalizes and validates a path.
     * Throws VFSError if invalid.
     */
    static normalize(rawPath: string): string {
        // 1. Basic cleaning
        let path = rawPath.trim();

        // 2. Validate Scheme
        const schemeMatch = path.match(/^([a-z]+):\/\//);
        if (!schemeMatch) {
            throw new VFSError('INVALID_PATH', `Path must start with a valid scheme (${VALID_SCHEMES.join(', ')})`);
        }

        const scheme = schemeMatch[1] as VFSScheme;
        if (!VALID_SCHEMES.includes(scheme)) {
            throw new VFSError('INVALID_PATH', `Invalid scheme: ${scheme}`);
        }

        // 3. Extract path part
        let internalPath = path.substring(scheme.length + 3); // Remove scheme://

        // 4. Sanitize Path Traversal
        // Decode URI components to catch encoded attacks (e.g. %2e%2e -> ..)
        try {
            internalPath = decodeURIComponent(internalPath);
        } catch (e) {
            // Unlikely, but if decoding fails, we treat it as unsafe or just keep it raw?
            // Safer to block if it looks suspicious, but usually decodeURIComponent throws only on malformed URI
            throw new VFSError('INVALID_PATH', 'Malformed path encoding');
        }

        // Normalize slashes (Win -> Unix)
        internalPath = internalPath.replace(/\\/g, '/');

        // Check for traversal segments (.. as a full segment)
        // We split by slash and check each part specifically
        const parts = internalPath.split('/');
        for (const part of parts) {
            if (part === '..' || part === '.') {
                throw new VFSError('INVALID_PATH', 'Path traversal (..) is not allowed');
            }
        }

        // 5. Reassemble Clean Path
        // Filter out empty parts (// -> /)
        const cleanPath = parts.filter(p => p.length > 0).join('/');

        // 6. Final Reassembly
        return `${scheme}://${cleanPath}`;
    }

    /**
     * Parses a normalized path into components.
     */
    static parse(path: string): { scheme: VFSScheme; internalPath: string; segments: string[] } {
        const normalized = VFSPath.normalize(path);
        const schemeMatch = normalized.match(/^([a-z]+):\/\/(.*)/);

        if (!schemeMatch) throw new Error('Normalization failed to produce valid scheme');

        const scheme = schemeMatch[1] as VFSScheme;
        const internalPath = schemeMatch[2];
        const segments = internalPath.split('/').filter(s => s.length > 0);

        return { scheme, internalPath, segments };
    }

    static join(base: string, ...parts: string[]): string {
        const baseParse = VFSPath.parse(base);
        const joinedInternal = [baseParse.internalPath, ...parts].join('/');
        return VFSPath.normalize(`${baseParse.scheme}://${joinedInternal}`);
    }

    static dirname(path: string): string {
        const { scheme, segments } = VFSPath.parse(path);
        if (segments.length === 0) return `${scheme}://`; // Root
        segments.pop();
        return `${scheme}://${segments.join('/')}`;
    }

    static basename(path: string): string {
        const { segments } = VFSPath.parse(path);
        return segments.length > 0 ? segments[segments.length - 1] : '';
    }
}
