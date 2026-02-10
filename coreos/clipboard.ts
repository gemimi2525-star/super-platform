/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ClipboardService — Phase 13: OS-Level Clipboard
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central clipboard service for copy/paste across apps.
 * Uses the browser Clipboard API with event bus integration.
 * 
 * @module coreos/clipboard
 * @version 1.0.0 (Phase 13)
 */

import { createCorrelationId } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ClipboardItem {
    readonly type: 'text' | 'file-reference';
    readonly text?: string;
    readonly fileRef?: {
        readonly path: string;
        readonly name: string;
        readonly mimeType: string;
    };
    readonly copiedAt: number;
    readonly sourceApp?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIPBOARD SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class OSClipboardService {
    private lastItem: ClipboardItem | null = null;

    /**
     * Copy text to clipboard
     */
    async copyText(text: string, sourceApp?: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);

            this.lastItem = {
                type: 'text',
                text,
                copiedAt: Date.now(),
                sourceApp,
            };

            // Audit trail (EventBus types are frozen, use console)
            console.debug('[Clipboard] copy text', {
                correlationId: createCorrelationId(),
                source: sourceApp,
                length: text.length,
            });

            return true;
        } catch (err) {
            console.warn('[Clipboard] Copy failed:', err);
            return false;
        }
    }

    /**
     * Copy file reference (metadata only, not content)
     */
    async copyFileReference(path: string, name: string, mimeType: string, sourceApp?: string): Promise<boolean> {
        try {
            // Store metadata in clipboard as JSON text
            const ref = { path, name, mimeType };
            await navigator.clipboard.writeText(JSON.stringify({ __osFileRef: ref }));

            this.lastItem = {
                type: 'file-reference',
                fileRef: { path, name, mimeType },
                copiedAt: Date.now(),
                sourceApp,
            };

            console.debug('[Clipboard] copy file-ref', { name, source: sourceApp });

            return true;
        } catch (err) {
            console.warn('[Clipboard] Copy file ref failed:', err);
            return false;
        }
    }

    /**
     * Paste text from clipboard
     */
    async pasteText(): Promise<string | null> {
        try {
            const text = await navigator.clipboard.readText();
            console.debug('[Clipboard] paste', { length: text.length });
            return text;
        } catch (err) {
            console.warn('[Clipboard] Paste failed:', err);
            return null;
        }
    }

    /**
     * Get the last copied item (OS-level only, not external)
     */
    getLastItem(): ClipboardItem | null {
        return this.lastItem;
    }

    /**
     * Check if clipboard has a file reference
     */
    isFileReference(text: string): boolean {
        try {
            const parsed = JSON.parse(text);
            return parsed?.__osFileRef != null;
        } catch {
            return false;
        }
    }

    /**
     * Extract file reference from clipboard text
     */
    extractFileReference(text: string): ClipboardItem['fileRef'] | null {
        try {
            const parsed = JSON.parse(text);
            return parsed?.__osFileRef ?? null;
        } catch {
            return null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: OSClipboardService | null = null;

export function getClipboardService(): OSClipboardService {
    if (!instance) {
        instance = new OSClipboardService();
    }
    return instance;
}
