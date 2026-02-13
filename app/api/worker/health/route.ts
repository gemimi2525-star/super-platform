/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/worker/health (Phase 22C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Health check endpoint with environment validation.
 * Returns server status, environment, and warnings for missing env vars.
 * NEVER logs or exposes actual secret values.
 */

import { NextResponse } from 'next/server';

// Required env vars for production operation (name only, never values)
const REQUIRED_ENV = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'JOB_WORKER_HMAC_SECRET',
    'ATTESTATION_PRIVATE_KEY',
    'ATTESTATION_PUBLIC_KEY',
] as const;

export async function GET() {
    // Check which required env vars are missing (name only, never values)
    const missingEnv = REQUIRED_ENV.filter(
        (key) => !process.env[key] || process.env[key]!.trim() === ''
    );

    const isHealthy = missingEnv.length === 0;

    return NextResponse.json({
        status: isHealthy ? 'ok' : 'degraded',
        env: process.env.NODE_ENV ?? 'unknown',
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? 'dev',
        timeISO: new Date().toISOString(),
        ...(missingEnv.length > 0 && {
            warnings: missingEnv.map((key) => `Missing env: ${key}`),
        }),
    });
}
