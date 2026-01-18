/**
 * API: Platform Audit Logs
 * Returns audit log entries for platform owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@platform/firebase-admin';
import { requirePlatformOwner } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
    try {
        // Require platform owner
        await requirePlatformOwner();

        const db = getAdminFirestore();

        // Get latest 100 audit logs
        const snapshot = await db
            .collection('platform_audit_logs')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('[API] Failed to fetch audit logs:', error);
        return NextResponse.json({
            error: error.message
        }, { status: error.message.includes('Forbidden') ? 403 : 500 });
    }
}
