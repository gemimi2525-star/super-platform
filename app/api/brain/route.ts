/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API ROUTE — Brain Gateway (Phase 39 → Phase 20 AGENT)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Server-side endpoint for AI Brain interactions.
 * - Receives BrainRequest from client
 * - Processes via BrainGateway (server-side only)
 * - Returns BrainResponse
 * - API keys NEVER exposed to client
 * 
 * Phase 19: shadow=true enforced, appScope for DRAFTER access
 * Phase 20: shadow=true enforced, AGENT mode for core.notes
 *           Execute via separate /api/brain/execute endpoint
 * 
 * @module app/api/brain/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { brainGateway } from '@/coreos/brain/gateway';
import { BrainRequest } from '@/coreos/brain/types';
import { trustEngine } from '@/coreos/brain/trust';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(clientId);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Extract client identifier (use IP or session for rate limiting)
        const clientId = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'anonymous';

        // Rate limit check
        if (!checkRateLimit(clientId)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate required fields
        if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: messages array is required' },
                { status: 400 }
            );
        }

        // Construct BrainRequest
        // ═══════════════════════════════════════════════════════════════
        // PHASE 19 ENFORCEMENT: shadow = true (STILL FORCED)
        // AI Brain is DRAFTER mode. Client cannot override shadow.
        // appScope enables app-scoped propose tools.
        // ═══════════════════════════════════════════════════════════════
        const appScope = body.appScope || body.appId || 'brain.assist';
        const effectiveTier = trustEngine.getTierForApp(appScope);

        const brainRequest: BrainRequest = {
            appId: body.appId || 'brain.assist',
            correlationId: body.correlationId || crypto.randomUUID(),
            messages: body.messages,
            locale: body.locale,
            userId: body.userId,
            context: body.context,
            shadow: true, // Phase 20: shadow=true enforced for chat interactions
            appScope,     // Phase 19+: App-scoped context for propose/apply tools
        };

        // Process through BrainGateway (server-side only)
        const response = await brainGateway.processRequest(brainRequest);

        return NextResponse.json({
            ...response,
            _meta: {
                tier: effectiveTier,
                appScope,
                shadow: true,
                phase: 20,
            },
        });

    } catch (error: any) {
        console.error('[API/Brain] Error:', error.message);

        // Safety blocks return 403
        if (error.message?.startsWith('Safety Block:')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
