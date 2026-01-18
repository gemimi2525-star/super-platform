/**
 * API: Get Auth Context
 * Returns current user's decoded token claims
 * Used by QA route for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@platform/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No token' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = await verifyIdToken(token);

        return NextResponse.json({
            uid: decoded.uid,
            email: decoded.email,
            role: decoded.role || 'org_member',
            orgId: decoded.orgId
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
