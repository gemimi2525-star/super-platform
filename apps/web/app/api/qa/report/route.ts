/**
 * API: QA Report
 * Returns latest test results for AI analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@platform/firebase-admin';

// In-memory storage for demo (replace with database in production)
let latestReport: any = null;

export async function GET(request: NextRequest) {
    try {
        // Optional auth (QA endpoint, but good practice)
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            await verifyIdToken(token); // Validate but don't require specific role
        }

        if (!latestReport) {
            return NextResponse.json({
                status: 'no_data',
                message: 'No test results available yet'
            }, { status: 404 });
        }

        return NextResponse.json(latestReport);
    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Store latest report
        const body = await request.json();
        latestReport = {
            ...body,
            receivedAt: new Date().toISOString()
        };

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
