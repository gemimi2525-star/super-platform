/**
 * Phase 16: Runtime Intents API
 * 
 * Server-side handler for runtime intent bridge.
 * Validates appId + grantedCapabilities and dispatches to appropriate handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type {
    IPCIntentRequest,
    RuntimeIntentResult,
    Capability,
} from '@/lib/runtime/types';
import { RuntimeError } from '@/lib/runtime/types';
import { RuntimeRegistry } from '@/lib/runtime';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

// ═══════════════════════════════════════════════════════════════════════════
// Audit Helper
// ═══════════════════════════════════════════════════════════════════════════

async function auditLogCreate(data: Record<string, unknown>) {
    try {
        const db = getAdminFirestore();
        await db.collection(COLLECTION_AUDIT_LOGS).add({
            ...data,
            timestamp: new Date(),
        });
    } catch (e) {
        console.error('[RuntimeIntents] Audit log failed:', e);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Intent Handlers
// ═══════════════════════════════════════════════════════════════════════════

async function handleFSRead(appId: string, params: any, traceId: string, opId: string): Promise<RuntimeIntentResult> {
    // Placeholder implementation
    return {
        success: true,
        action: 'fs.read',
        appId,
        traceId,
        opId,
        data: {
            path: params.path,
            data: 'File content placeholder',
            size: 100,
        },
    };
}

async function handleFSWrite(appId: string, params: any, traceId: string, opId: string): Promise<RuntimeIntentResult> {
    // Placeholder implementation
    return {
        success: true,
        action: 'fs.write',
        appId,
        traceId,
        opId,
        data: {
            path: params.path,
            bytesWritten: params.data?.length || 0,
        },
    };
}

async function handleUINotify(appId: string, params: any, traceId: string, opId: string): Promise<RuntimeIntentResult> {
    // Placeholder implementation
    console.log(`[RuntimeIntents] Notify from ${appId}:`, params.title);
    return {
        success: true,
        action: 'ui.notify',
        appId,
        traceId,
        opId,
    };
}

async function handleUIWindow(appId: string, params: any, traceId: string, opId: string): Promise<RuntimeIntentResult> {
    // Placeholder implementation
    const windowId = `win-${Date.now()}`;
    return {
        success: true,
        action: 'ui.openWindow',
        appId,
        traceId,
        opId,
        data: { windowId },
    };
}

async function handleNetFetch(appId: string, params: any, traceId: string, opId: string): Promise<RuntimeIntentResult> {
    // Placeholder implementation - would do allowlist check here
    return {
        success: false,
        action: 'net.fetch',
        appId,
        traceId,
        opId,
        error: RuntimeError.CAPABILITY_DENIED,
        decision: {
            outcome: 'DENY',
            reason: 'Domain not in allowlist (placeholder)',
        },
    };
}

async function handleProcessSpawn(appId: string, params: any, traceId: string, opId: string): Promise<RuntimeIntentResult> {
    // First-party only
    if (!appId.startsWith('os.') && !appId.startsWith('core.')) {
        return {
            success: false,
            action: 'process.spawn',
            appId,
            traceId,
            opId,
            error: RuntimeError.CAPABILITY_DENIED,
            decision: {
                outcome: 'DENY',
                reason: 'process.spawn is first-party only',
            },
        };
    }

    // Placeholder
    const pid = `proc-${Date.now()}`;
    return {
        success: true,
        action: 'process.spawn',
        appId,
        traceId,
        opId,
        data: { pid },
    };
}

async function handleAuditRead(appId: string, params: any, traceId: string, opId: string, isAdmin: boolean): Promise<RuntimeIntentResult> {
    if (!isAdmin) {
        return {
            success: false,
            action: 'audit.readLogs',
            appId,
            traceId,
            opId,
            error: RuntimeError.CAPABILITY_DENIED,
            decision: {
                outcome: 'DENY',
                reason: 'Admin required',
            },
        };
    }

    // Placeholder
    return {
        success: true,
        action: 'audit.readLogs',
        appId,
        traceId,
        opId,
        data: [],
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    const authContext = await getAuthContext();
    const now = Date.now();

    if (!authContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let intent: IPCIntentRequest;
    try {
        intent = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const { appId, traceId, opId, intent: intentPayload } = intent;
    const { action, capability, params } = intentPayload;

    // Check runtime exists
    const instance = RuntimeRegistry.get(appId);
    if (!instance) {
        await auditLogCreate({
            event: 'runtime_intent',
            appId,
            traceId,
            opId,
            action,
            capability,
            decision: 'DENY',
            reason: 'Runtime not found',
        });

        const result: RuntimeIntentResult = {
            success: false,
            action,
            appId,
            traceId,
            opId: opId || '',
            error: RuntimeError.RUNTIME_NOT_FOUND,
        };
        return NextResponse.json(result, { status: 404 });
    }

    // Check capability granted
    if (!instance.grantedCapabilities.includes(capability)) {
        await auditLogCreate({
            event: 'runtime_intent',
            appId,
            traceId,
            opId,
            action,
            capability,
            decision: 'DENY',
            reason: 'Capability not granted',
        });

        const result: RuntimeIntentResult = {
            success: false,
            action,
            appId,
            traceId,
            opId: opId || '',
            error: RuntimeError.CAPABILITY_DENIED,
            decision: {
                outcome: 'DENY',
                reason: `Capability not granted: ${capability}`,
            },
        };
        return NextResponse.json(result, { status: 403 });
    }

    // Dispatch to handler
    let result: RuntimeIntentResult;
    const isAdmin = (authContext as any).role === 'admin';

    try {
        switch (action) {
            case 'fs.read':
                result = await handleFSRead(appId, params, traceId, opId || '');
                break;
            case 'fs.write':
            case 'fs.writeTemp':
                result = await handleFSWrite(appId, params, traceId, opId || '');
                break;
            case 'ui.notify':
                result = await handleUINotify(appId, params, traceId, opId || '');
                break;
            case 'ui.openWindow':
                result = await handleUIWindow(appId, params, traceId, opId || '');
                break;
            case 'net.fetch':
                result = await handleNetFetch(appId, params, traceId, opId || '');
                break;
            case 'process.spawn':
                result = await handleProcessSpawn(appId, params, traceId, opId || '');
                break;
            case 'audit.readLogs':
                result = await handleAuditRead(appId, params, traceId, opId || '', isAdmin);
                break;
            default:
                result = {
                    success: false,
                    action,
                    appId,
                    traceId,
                    opId: opId || '',
                    error: 'Unknown action' as any,
                };
        }
    } catch (e) {
        result = {
            success: false,
            action,
            appId,
            traceId,
            opId: opId || '',
            error: (e as Error).message as any,
        };
    }

    // Audit
    await auditLogCreate({
        event: 'runtime_intent',
        appId,
        traceId,
        opId,
        action,
        capability,
        decision: result.success ? 'ALLOW' : 'DENY',
        error: result.error,
        latencyMs: Date.now() - now,
    });

    return NextResponse.json(result);
}
