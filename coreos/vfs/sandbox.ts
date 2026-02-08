/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS SANDBOX (Boundary Logic)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enforces strict path boundaries for VFS operations.
 * Maps abstract schemes (app://) to concrete OPFS paths.
 * 
 * @module coreos/vfs/sandbox
 */

export interface SandboxContext {
    userId: string;
    appId: string;
}

export class VFSSandbox {
    /**
     * Resolve a VFS URI to a concrete OPFS path
     * e.g., app://config.json -> /apps/{appId}/config.json
     * e.g., user://docs/notes.txt -> /users/{userId}/docs/notes.txt
     */
    static resolvePath(uri: string, context: SandboxContext): string {
        try {
            const url = new URL(uri);
            const scheme = url.protocol.replace(':', '');
            const pathname = url.pathname; // includes leading slash

            // Prevent path traversal
            if (pathname.includes('..')) {
                throw new Error('PATH_TRAVERSAL_DETECTED');
            }

            switch (scheme) {
                case 'app':
                    // /apps/{appId}/{path}
                    return `apps/${context.appId}${pathname}`;

                case 'user':
                    // /users/{userId}/{path}
                    return `users/${context.userId}${pathname}`;

                case 'tmp':
                    // /tmp/{sessionId}/{path}
                    return `tmp/session/${pathname}`;

                default:
                    throw new Error(`UNSUPPORTED_SCHEME: ${scheme}`);
            }
        } catch (e: any) {
            throw new Error(`INVALID_URI: ${e.message}`);
        }
    }
}
