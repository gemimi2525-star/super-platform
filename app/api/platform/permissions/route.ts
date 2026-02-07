
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAppGrants, setPermissionGrant } from '@/lib/permissions/db';
import type { PermissionGrant, PermissionRequest } from '@/lib/permissions/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const authContext = await getAuthContext();
    if (!authContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
        return NextResponse.json({ success: false, error: 'Missing appId' }, { status: 400 });
    }

    try {
        const grants = await getAppGrants(appId, authContext.uid);
        return NextResponse.json({ success: true, grants });
    } catch (e) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authContext = await getAuthContext();
    if (!authContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { appId, capability, granted, traceId, opId } = body;

        if (!appId || !capability || granted === undefined || !traceId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const grant: PermissionGrant = {
            appId,
            userId: authContext.uid,
            capability,
            granted,
            timestamp: Date.now(),
            traceId,
            opId: opId || `perm-${Date.now()}`,
        };

        await setPermissionGrant(grant);

        return NextResponse.json({ success: true, grant });
    } catch (e) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
    }
}
