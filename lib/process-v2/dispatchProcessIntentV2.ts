/**
 * Phase 15B.2: Process Intent Dispatcher V2
 * 
 * Client-side dispatcher for v2 process intents.
 */

'use client';

import type { ProcessIntentV2, ProcessIntentResultV2 } from './types';

const API_ENDPOINT = '/api/platform/process-intents-v2';

export async function dispatchProcessIntentV2(
    intent: ProcessIntentV2,
    traceId?: string
): Promise<ProcessIntentResultV2> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (traceId) {
        headers['x-trace-id'] = traceId;
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify(intent),
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            return {
                success: false,
                action: intent.action,
                error: error.error || `HTTP ${response.status}`,
            };
        }

        return await response.json();
    } catch (error) {
        return {
            success: false,
            action: intent.action,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════════════════

export async function suspendProcess(pid: string, reason?: string, traceId?: string): Promise<ProcessIntentResultV2> {
    return dispatchProcessIntentV2({
        action: 'os.process.suspend',
        pid,
        options: { reason },
    }, traceId);
}

export async function resumeProcess(pid: string, traceId?: string): Promise<ProcessIntentResultV2> {
    return dispatchProcessIntentV2({
        action: 'os.process.resume',
        pid,
    }, traceId);
}

export async function setPriority(
    pid: string,
    priority: 'low' | 'normal' | 'high' | 'realtime',
    traceId?: string
): Promise<ProcessIntentResultV2> {
    return dispatchProcessIntentV2({
        action: 'os.process.setPriority',
        pid,
        options: { priority },
    }, traceId);
}
