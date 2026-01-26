/**
 * DEV-Only Test Credentials API
 * Returns test account credentials for development/preview only
 * 
 * Security:
 * - Only enabled when ENABLE_TEST_LOGIN=true
 * - Blocked in production (NODE_ENV=production)
 * - Server-only ENV vars never exposed to client
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Security check: Only allow in DEV/Preview
    const isTestLoginEnabled = process.env.ENABLE_TEST_LOGIN === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isTestLoginEnabled || isProduction) {
        return NextResponse.json(
            { error: 'Not available' },
            { status: 404 }
        );
    }

    // Return test credentials from server-only ENV vars
    const credentials = {
        accounts: [
            {
                role: 'Owner',
                email: process.env.TEST_OWNER_EMAIL || '',
                password: process.env.TEST_OWNER_PASSWORD || '',
                description: 'Full platform access',
            },
            {
                role: 'Admin',
                email: process.env.TEST_ADMIN_EMAIL || '',
                password: process.env.TEST_ADMIN_PASSWORD || '',
                description: 'Organization admin',
            },
            {
                role: 'User',
                email: process.env.TEST_USER_EMAIL || '',
                password: process.env.TEST_USER_PASSWORD || '',
                description: 'Standard user access',
            },
        ],
    };

    return NextResponse.json(credentials);
}
