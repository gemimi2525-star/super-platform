/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN PROPOSAL ENGINE (Phase 25A — Brain Skeleton)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Core logic for generating, persisting, and managing Brain proposals.
 * Uses OpenAI to generate proposals, validates with Zod, saves to Firestore.
 *
 * HARDENING: Does NOT touch Worker, Signed Ticket, or Governance zones.
 *
 * @module coreos/brain/proposal-engine
 * @version 1.0.0
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { OpenAIAdapter } from './providers/openai';
import { proposalContentSchema } from './brain-proposal-schemas';
import type {
    BrainScope,
    BrainProposal,
    ProposalContent,
    ProposalAuditEvent,
    ProposalStep,
} from './brain-proposal-types';
import {
    COLLECTION_BRAIN_PROPOSALS,
    RATE_LIMIT_PROPOSALS_PER_HOUR,
    BLOCKED_ACTIONS,
    SCOPE_FORBIDDEN,
} from './brain-proposal-types';

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER (in-memory, per-process)
// ═══════════════════════════════════════════════════════════════════════════

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a uid has exceeded the rate limit.
 * @returns true if allowed, false if rate-limited
 */
export function checkRateLimit(uid: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(uid);

    if (!entry || now >= entry.resetAt) {
        // Reset window
        rateLimitMap.set(uid, { count: 1, resetAt: now + 3600_000 });
        return true;
    }

    if (entry.count >= RATE_LIMIT_PROPOSALS_PER_HOUR) {
        return false;
    }

    entry.count++;
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCOPE VIOLATION CHECKER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if any proposed steps violate scope boundaries.
 * @returns list of blocked action descriptions
 */
export function checkScopeViolations(
    scope: BrainScope,
    steps: ProposalStep[],
): string[] {
    const forbidden = SCOPE_FORBIDDEN[scope];
    const violations: string[] = [];

    for (const step of steps) {
        const toolLower = step.toolName.toLowerCase();
        const intentLower = step.intent.toLowerCase();

        // Check if tool name touches forbidden resources
        for (const resource of forbidden) {
            if (toolLower.includes(resource) || intentLower.includes(resource)) {
                violations.push(
                    `Step "${step.toolName}" violates scope=${scope}: cannot access "${resource}" resources`,
                );
            }
        }

        // Check for globally blocked destructive actions
        for (const blocked of BLOCKED_ACTIONS) {
            const blockedLower = blocked.toLowerCase();
            if (toolLower.includes(blockedLower) || intentLower.includes(blockedLower)) {
                violations.push(
                    `Step "${step.toolName}" is blocked: "${blocked}" is a destructive action`,
                );
            }
        }
    }

    return violations;
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM PROPOSAL GENERATION
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a Brain Drafter for the Core OS platform.
Your role is to PROPOSE actions — you NEVER execute anything.

You must respond with ONLY valid JSON matching this schema:
{
  "summary": "Brief summary of the plan",
  "steps": [
    { "toolName": "actionName", "intent": "why this step", "riskLevel": "low|medium|high", "requiresApproval": true }
  ],
  "estimatedImpact": "Description of expected outcome",
  "blockedActions": []
}

Rules:
- Never propose destructive actions (delete, revoke, rotateKey, dropCollection, purge, destroy, wipe)
- Always set requiresApproval to true
- Classify risk honestly: low = read-only, medium = modify, high = potentially disruptive
- Keep steps specific and actionable
- If the user asks for something destructive, add it to blockedActions instead of steps
- Stay within the given scope — do NOT propose actions outside the scope boundary
- Respond ONLY with JSON, no markdown, no explanation`;

/**
 * Generate a proposal using OpenAI.
 * Returns validated ProposalContent.
 */
export async function generateProposal(
    scope: BrainScope,
    userGoal: string,
    context?: Record<string, any>,
): Promise<ProposalContent> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        // Fallback: generate a mock proposal for development
        console.warn('[BRAIN] No OPENAI_API_KEY — generating mock proposal');
        return generateMockProposal(scope, userGoal);
    }

    const adapter = new OpenAIAdapter(apiKey, 'gpt-4o');

    const userMessage = [
        `Scope: ${scope}`,
        `User Goal: ${userGoal}`,
        context ? `Context: ${JSON.stringify(context)}` : '',
    ].filter(Boolean).join('\n');

    try {
        const output = await adapter.generate({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
            tools: [],
            temperature: 0.2,
            maxTokens: 2000,
        });

        if (!output.content) {
            throw new Error('LLM returned empty content');
        }

        // Parse and validate JSON response
        let parsed: unknown;
        try {
            // Strip markdown code fences if present
            let cleaned = output.content.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            parsed = JSON.parse(cleaned);
        } catch {
            throw new Error(`LLM returned invalid JSON: ${output.content.substring(0, 200)}`);
        }

        // Validate with Zod
        const validated = proposalContentSchema.parse(parsed);

        // Enforce requiresApproval = true on all steps
        validated.steps = validated.steps.map(s => ({
            ...s,
            requiresApproval: true as const,
        }));

        // Check for scope violations and move them to blockedActions
        const violations = checkScopeViolations(scope, validated.steps);
        if (violations.length > 0) {
            validated.blockedActions = [...validated.blockedActions, ...violations];
            // Remove violating steps
            validated.steps = validated.steps.filter(step => {
                const stepViolations = checkScopeViolations(scope, [step]);
                return stepViolations.length === 0;
            });
        }

        return validated;
    } catch (err: any) {
        console.error('[BRAIN] generateProposal error:', err.message);
        throw err;
    }
}

/**
 * Mock proposal for development without API key.
 */
function generateMockProposal(scope: BrainScope, userGoal: string): ProposalContent {
    return {
        summary: `[MOCK] Plan for scope "${scope}": ${userGoal}`,
        steps: [
            {
                toolName: `${scope}.analyze`,
                intent: `Analyze current ${scope} state`,
                riskLevel: 'low',
                requiresApproval: true,
            },
            {
                toolName: `${scope}.propose_changes`,
                intent: `Draft changes based on user goal: "${userGoal.substring(0, 50)}"`,
                riskLevel: 'medium',
                requiresApproval: true,
            },
        ],
        estimatedImpact: `Will analyze and propose modifications to ${scope} resources based on user goal.`,
        blockedActions: [],
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// FIRESTORE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Persist a new proposal to Firestore.
 * Returns the created proposal with its Firestore ID.
 */
export async function persistProposal(
    uid: string,
    scope: BrainScope,
    userGoal: string,
    proposal: ProposalContent,
): Promise<BrainProposal & { id: string }> {
    const db = getAdminFirestore();
    const now = Date.now();

    const auditEvent: ProposalAuditEvent = {
        event: 'CREATED',
        timestamp: now,
        uid,
    };

    const doc: Omit<BrainProposal, 'id'> = {
        createdAt: now,
        createdByUid: uid,
        scope,
        userGoal,
        proposal,
        status: 'PROPOSED',
        auditTrail: [auditEvent],
    };

    const ref = await db.collection(COLLECTION_BRAIN_PROPOSALS).add(doc);
    console.log(`[BRAIN] Proposal created: id=${ref.id}, scope=${scope}, uid=${uid}`);

    return { ...doc, id: ref.id };
}

/**
 * Approve a proposal. Owner-only (checked at API layer).
 */
export async function approveProposal(
    proposalId: string,
    ownerUid: string,
): Promise<BrainProposal & { id: string }> {
    const db = getAdminFirestore();
    const ref = db.collection(COLLECTION_BRAIN_PROPOSALS).doc(proposalId);
    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error(`Proposal not found: ${proposalId}`);
    }

    const data = snap.data() as BrainProposal;

    if (data.status !== 'PROPOSED') {
        throw new Error(`Proposal is already ${data.status}`);
    }

    const now = Date.now();
    const auditEvent: ProposalAuditEvent = {
        event: 'APPROVED',
        timestamp: now,
        uid: ownerUid,
    };

    await ref.update({
        status: 'APPROVED',
        approvedAt: now,
        approvedByUid: ownerUid,
        auditTrail: [...data.auditTrail, auditEvent],
    });

    console.log(`[BRAIN] Proposal approved: id=${proposalId}, by=${ownerUid}`);

    return {
        ...data,
        id: proposalId,
        status: 'APPROVED',
        approvedAt: now,
        approvedByUid: ownerUid,
        auditTrail: [...data.auditTrail, auditEvent],
    };
}

/**
 * Reject a proposal. Owner-only (checked at API layer).
 */
export async function rejectProposal(
    proposalId: string,
    ownerUid: string,
): Promise<BrainProposal & { id: string }> {
    const db = getAdminFirestore();
    const ref = db.collection(COLLECTION_BRAIN_PROPOSALS).doc(proposalId);
    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error(`Proposal not found: ${proposalId}`);
    }

    const data = snap.data() as BrainProposal;

    if (data.status !== 'PROPOSED') {
        throw new Error(`Proposal is already ${data.status}`);
    }

    const now = Date.now();
    const auditEvent: ProposalAuditEvent = {
        event: 'REJECTED',
        timestamp: now,
        uid: ownerUid,
    };

    await ref.update({
        status: 'REJECTED',
        auditTrail: [...data.auditTrail, auditEvent],
    });

    console.log(`[BRAIN] Proposal rejected: id=${proposalId}, by=${ownerUid}`);

    return {
        ...data,
        id: proposalId,
        status: 'REJECTED',
        auditTrail: [...data.auditTrail, auditEvent],
    };
}

/**
 * List proposals with optional status filter.
 */
export async function listProposals(
    status?: string,
    limit = 50,
): Promise<(BrainProposal & { id: string })[]> {
    const db = getAdminFirestore();
    let query = db.collection(COLLECTION_BRAIN_PROPOSALS)
        .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

    if (status) {
        query = query.where('status', '==', status);
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const proposals: (BrainProposal & { id: string })[] = [];

    snapshot.forEach((doc) => {
        proposals.push({ ...(doc.data() as BrainProposal), id: doc.id });
    });

    return proposals;
}
