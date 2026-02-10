/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES APP — Shell Wrapper (Phase 16A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Bridges AppProps (from AppRenderer) → NotesUI (from apps/core.notes).
 * 
 * @module components/os-shell/apps/notes/NotesApp
 */

'use client';

import React from 'react';
import { NotesUI } from '@/apps/core.notes/ui';
import type { AppProps } from '../registry';

export function NotesApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <NotesUI userId="default-user" />
    );
}
