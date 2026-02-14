/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN PROPOSAL SCHEMAS (Phase 25A — Zod Validation)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zod schemas for request/response validation.
 * All LLM output is validated before persisting to Firestore.
 *
 * @module coreos/brain/brain-proposal-schemas
 * @version 1.0.0
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** POST /api/brain/propose request body */
export const proposeRequestSchema = z.object({
    scope: z.enum(['notes', 'files', 'ops', 'jobs'], {
        required_error: 'scope is required',
        invalid_type_error: 'scope must be one of: notes, files, ops, jobs',
    }),
    userGoal: z.string({
        required_error: 'userGoal is required',
    }).min(5, 'userGoal must be at least 5 characters')
        .max(1000, 'userGoal must be at most 1000 characters'),
    context: z.record(z.any()).optional(),
});

/** POST /api/brain/approve request body */
export const approveRequestSchema = z.object({
    proposalId: z.string({
        required_error: 'proposalId is required',
    }).min(1, 'proposalId is required'),
    action: z.enum(['APPROVE', 'REJECT'], {
        required_error: 'action is required',
        invalid_type_error: 'action must be APPROVE or REJECT',
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// LLM RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Schema for a single proposal step (LLM output) */
export const proposalStepSchema = z.object({
    toolName: z.string().min(1),
    intent: z.string().min(1),
    riskLevel: z.enum(['low', 'medium', 'high']),
    requiresApproval: z.literal(true),
});

/** Schema for the complete proposal content (LLM output) */
export const proposalContentSchema = z.object({
    summary: z.string().min(1, 'summary is required'),
    steps: z.array(proposalStepSchema).min(1, 'at least one step is required'),
    estimatedImpact: z.string().min(1, 'estimatedImpact is required'),
    blockedActions: z.array(z.string()).default([]),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS (inferred from schemas)
// ═══════════════════════════════════════════════════════════════════════════

export type ProposeRequest = z.infer<typeof proposeRequestSchema>;
export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type ProposalContentValidated = z.infer<typeof proposalContentSchema>;
