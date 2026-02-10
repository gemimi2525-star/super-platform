/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS CONSUMER HOOK (Phase 16B)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Standard React hook for apps to consume VFS via AppVFSAdapter.
 * Creates and memoizes an adapter instance per appId.
 * 
 * Usage:
 *   const adapter = useVFSAdapter('core.finder');
 *   const files = await adapter.list('user://');
 * 
 * @module coreos/vfs/useVFSAdapter
 * @version 1.0.0 (Phase 16B)
 */

'use client';

import { useState } from 'react';
import { AppVFSAdapter } from './app-adapter';

/**
 * React hook that creates and memoizes an AppVFSAdapter for the given appId.
 * The adapter is stable across renders (same instance unless appId changes).
 */
export function useVFSAdapter(appId: string, userId: string = 'default-user'): AppVFSAdapter {
    const [adapter] = useState(() => new AppVFSAdapter(appId, userId));
    return adapter;
}
