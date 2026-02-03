/**
 * API: Platform Health Check
 * 
 * Lightweight health endpoint for monitoring.
 * Public endpoint - no authentication required.
 * 
 * Returns:
 * - Build info + commit SHA (if available)
 * - Timestamp
 * - Project kind (apicoredata vs synapsegovernance)
 * - Environment status
 * 
 * Phase 5: Operational Visibility
 */

import { NextRequest } from 'next/server';
import { ApiSuccessResponse } from '@/lib/api';

export const runtime = 'nodejs';

// Build info from environment
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';
const DEPLOY_ID = process.env.VERCEL_DEPLOYMENT_ID || 'local';
const VERCEL_ENV = process.env.VERCEL_ENV || 'development';
const PROJECT_KIND = process.env.PROJECT_KIND || 'apicoredata';

// Determine domain from environment
function getCurrentDomain(): string {
    const url = process.env.NEXT_PUBLIC_SERVER_URL || '';
    if (url.includes('synapsegovernance')) return 'synapsegovernance.com';
    if (url.includes('apicoredata')) return 'apicoredata.com';
    return 'localhost';
}

export async function GET(request: NextRequest) {
    const now = new Date();

    // Collect health info
    const health = {
        status: 'healthy',
        timestamp: now.toISOString(),
        build: {
            commit: BUILD_ID,
            deploymentId: DEPLOY_ID,
            environment: VERCEL_ENV,
        },
        project: {
            kind: PROJECT_KIND,
            domain: getCurrentDomain(),
        },
        runtime: {
            node: process.version,
            platform: process.platform,
        },
        uptime: process.uptime(),
    };

    // Add response headers for monitoring
    const response = ApiSuccessResponse.ok(health);

    return response;
}
