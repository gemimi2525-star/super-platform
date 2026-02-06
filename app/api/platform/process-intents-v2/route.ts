/**
 * Phase 15B.2: Process Intents V2 API Route
 * 
 * Handles suspend/resume/setPriority intents with policy enforcement.
 * DOES NOT modify frozen process-intents route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type {
    ProcessIntentV2,
    ProcessIntentResultV2,
    ProcessActionV2,
    ProcessDescriptorV2,
    ProcessPriority,
    ProcessStateV2,
} from '@/lib/process-v2/types';
import { ProcessErrorV2 } from '@/lib/process-v2/types';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

// Helper to write audit log
async function auditLogCreate(data: Record<string, unknown>) {
    try {
        const db = getAdminFirestore();
        await db.collection(COLLECTION_AUDIT_LOGS).add({
            ...data,
            timestamp: new Date(),
        });
    } catch (e) {
        console.error('[ProcessIntentsV2] Audit log failed:', e);
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// In-Memory Registry (V2 - extended with priority)
// For production, replace with database
// ═══════════════════════════════════════════════════════════════════════════

const registryV2: Map<string, ProcessDescriptorV2> = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// Permission Matrix
// ═══════════════════════════════════════════════════════════════════════════

const PERMISSION_MATRIX: Record<ProcessActionV2, { admin: boolean; owner: boolean; roles?: string[] }> = {
    'os.process.spawn': { admin: true, owner: true },
    'os.process.terminate': { admin: true, owner: true },
    'os.process.forceQuit': { admin: true, owner: true },
    'os.process.suspend': { admin: true, owner: true },
    'os.process.resume': { admin: true, owner: true },
    'os.process.setPriority': { admin: true, owner: true },
    'os.process.list': { admin: true, owner: true },
};

function canPerformAction(
    action: ProcessActionV2,
    actorRole: string,
    isOwner: boolean,
    priority?: ProcessPriority
): { allowed: boolean; reason?: string } {
    const rules = PERMISSION_MATRIX[action];

    // Admin always allowed
    if (actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN') {
        return { allowed: true };
    }

    // Owner allowed for most actions
    if (isOwner && rules.owner) {
        // Special case: realtime priority requires admin
        if (action === 'os.process.setPriority' && priority === 'realtime') {
            return { allowed: false, reason: 'Realtime priority requires admin' };
        }
        return { allowed: true };
    }

    return { allowed: false, reason: 'Insufficient permissions' };
}

// ═══════════════════════════════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    const authContext = await getAuthContext();

    if (!authContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const traceId = request.headers.get('x-trace-id') || `trace-${Date.now()}`;
    const now = Date.now();

    let intent: ProcessIntentV2;
    try {
        intent = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const opId = `${intent.action}-${now}`;
    const actorId = authContext.uid || authContext.email || 'unknown';
    const actorRole = (authContext as any).role || 'USER';

    // Get process for ownership check
    const process = intent.pid ? registryV2.get(intent.pid) : undefined;
    const isOwner = process?.ownerId === actorId;

    // Permission check
    const permCheck = canPerformAction(
        intent.action,
        actorRole,
        isOwner,
        (intent.options as any)?.priority
    );

    if (!permCheck.allowed) {
        await auditLogCreate({
            event: 'process_intent_v2',
            actor: actorId,
            role: actorRole,
            opId,
            traceId,
            action: intent.action,
            pid: intent.pid,
            decision: 'DENY',
            reason: permCheck.reason,
        });

        return NextResponse.json({
            success: false,
            action: intent.action,
            pid: intent.pid,
            opId,
            traceId,
            error: ProcessErrorV2.FORBIDDEN,
            decision: { outcome: 'DENY', reason: permCheck.reason },
        } satisfies ProcessIntentResultV2, { status: 403 });
    }

    // Dispatch by action
    let result: ProcessIntentResultV2;

    switch (intent.action) {
        case 'os.process.suspend':
            result = handleSuspend(intent.pid!, intent.options as any, opId, traceId);
            break;
        case 'os.process.resume':
            result = handleResume(intent.pid!, opId, traceId);
            break;
        case 'os.process.setPriority':
            result = handleSetPriority(intent.pid!, (intent.options as any).priority, opId, traceId);
            break;
        case 'os.process.list':
            result = handleList(actorId, actorRole);
            break;
        default:
            result = { success: false, action: intent.action, error: 'Unknown action' };
    }

    // Audit log
    await auditLogCreate({
        event: 'process_intent_v2',
        actor: actorId,
        role: actorRole,
        opId,
        traceId,
        action: intent.action,
        pid: intent.pid,
        decision: result.success ? 'ALLOW' : 'DENY',
        previousState: result.previousState,
        newState: result.newState,
        previousPriority: result.previousPriority,
        newPriority: result.newPriority,
        error: result.error,
    });

    return NextResponse.json({ ...result, opId, traceId });
}

// ═══════════════════════════════════════════════════════════════════════════
// Intent Handlers
// ═══════════════════════════════════════════════════════════════════════════

function handleSuspend(
    pid: string,
    options: { reason?: string },
    opId: string,
    traceId: string
): ProcessIntentResultV2 {
    const process = registryV2.get(pid);

    if (!process) {
        return { success: false, action: 'os.process.suspend', pid, error: ProcessErrorV2.PROCESS_NOT_FOUND };
    }

    if (process.state !== 'RUNNING') {
        if (process.state === 'SUSPENDED') {
            return { success: true, action: 'os.process.suspend', pid, previousState: 'SUSPENDED', newState: 'SUSPENDED' };
        }
        return { success: false, action: 'os.process.suspend', pid, error: ProcessErrorV2.INVALID_STATE };
    }

    const previousState = process.state;
    process.state = 'SUSPENDED';
    process.suspendedAt = Date.now();
    process.suspendReason = options?.reason;

    return {
        success: true,
        action: 'os.process.suspend',
        pid,
        previousState,
        newState: 'SUSPENDED',
        opId,
        traceId,
    };
}

function handleResume(pid: string, opId: string, traceId: string): ProcessIntentResultV2 {
    const process = registryV2.get(pid);

    if (!process) {
        return { success: false, action: 'os.process.resume', pid, error: ProcessErrorV2.PROCESS_NOT_FOUND };
    }

    if (process.state === 'CRASHED') {
        return { success: false, action: 'os.process.resume', pid, error: ProcessErrorV2.CANNOT_RESUME_CRASHED };
    }

    if (process.state !== 'SUSPENDED') {
        if (process.state === 'RUNNING') {
            return { success: true, action: 'os.process.resume', pid, previousState: 'RUNNING', newState: 'RUNNING' };
        }
        return { success: false, action: 'os.process.resume', pid, error: ProcessErrorV2.NOT_SUSPENDED };
    }

    const previousState = process.state;
    process.state = 'RUNNING';
    process.lastHeartbeat = Date.now();
    process.resumeCount += 1;
    delete process.suspendedAt;
    delete process.suspendReason;

    return {
        success: true,
        action: 'os.process.resume',
        pid,
        previousState,
        newState: 'RUNNING',
        opId,
        traceId,
    };
}

function handleSetPriority(
    pid: string,
    priority: ProcessPriority,
    opId: string,
    traceId: string
): ProcessIntentResultV2 {
    const process = registryV2.get(pid);

    if (!process) {
        return { success: false, action: 'os.process.setPriority', pid, error: ProcessErrorV2.PROCESS_NOT_FOUND };
    }

    const previousPriority = process.priority;

    if (previousPriority === priority) {
        return { success: true, action: 'os.process.setPriority', pid, previousPriority, newPriority: priority };
    }

    process.priority = priority;

    return {
        success: true,
        action: 'os.process.setPriority',
        pid,
        previousPriority,
        newPriority: priority,
        opId,
        traceId,
    };
}

function handleList(actorId: string, actorRole: string): ProcessIntentResultV2 {
    let processes = Array.from(registryV2.values());

    // Non-admin can only see their own processes
    if (actorRole !== 'ADMIN' && actorRole !== 'SUPER_ADMIN') {
        processes = processes.filter(p => p.ownerId === actorId);
    }

    return {
        success: true,
        action: 'os.process.list',
        processes,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET Handler (Registry Query)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    const authContext = await getAuthContext();

    if (!authContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const actorRole = (authContext as any).role || 'USER';
    const actorId = authContext.uid || authContext.email || 'unknown';

    let processes = Array.from(registryV2.values());

    if (actorRole !== 'ADMIN' && actorRole !== 'SUPER_ADMIN') {
        processes = processes.filter(p => p.ownerId === actorId);
    }

    return NextResponse.json({ success: true, processes });
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT Handler (Register from client - for testing)
// ═══════════════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
    const authContext = await getAuthContext();

    if (!authContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const process: ProcessDescriptorV2 = await request.json();
        process.ownerId = authContext.uid || authContext.email || 'unknown';
        registryV2.set(process.pid, process);
        return NextResponse.json({ success: true, process });
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }
}
