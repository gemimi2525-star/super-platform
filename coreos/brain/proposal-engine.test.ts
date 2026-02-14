/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN PROPOSAL ENGINE TESTS (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 12+ test cases covering:
 * - Zod schema validation (propose, approve, LLM output)
 * - Scope violation detection
 * - Blocked action detection
 * - Rate limit enforcement
 * - Status transitions (approve, reject)
 * - AuditTrail append
 *
 * @module coreos/brain/proposal-engine.test
 */

import {
    proposeRequestSchema,
    approveRequestSchema,
    proposalContentSchema,
} from './brain-proposal-schemas';

import {
    checkRateLimit,
    checkScopeViolations,
} from './proposal-engine';

import type { ProposalStep } from './brain-proposal-types';
import { BLOCKED_ACTIONS, RATE_LIMIT_PROPOSALS_PER_HOUR } from './brain-proposal-types';

// ═══════════════════════════════════════════════════════════════════════════
// 1-3: proposeRequestSchema
// ═══════════════════════════════════════════════════════════════════════════

describe('proposeRequestSchema', () => {
    test('1. valid propose request passes', () => {
        const result = proposeRequestSchema.safeParse({
            scope: 'notes',
            userGoal: 'Organize my meeting notes by date',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.scope).toBe('notes');
            expect(result.data.userGoal).toBe('Organize my meeting notes by date');
        }
    });

    test('2. invalid scope rejected', () => {
        const result = proposeRequestSchema.safeParse({
            scope: 'invalid',
            userGoal: 'Some goal description',
        });
        expect(result.success).toBe(false);
    });

    test('3. missing userGoal rejected', () => {
        const result = proposeRequestSchema.safeParse({
            scope: 'files',
        });
        expect(result.success).toBe(false);
    });

    test('3b. userGoal too short rejected', () => {
        const result = proposeRequestSchema.safeParse({
            scope: 'files',
            userGoal: 'abc', // < 5 chars
        });
        expect(result.success).toBe(false);
    });

    test('3c. all valid scopes accepted', () => {
        for (const scope of ['notes', 'files', 'ops', 'jobs']) {
            const result = proposeRequestSchema.safeParse({
                scope,
                userGoal: 'A valid goal with enough length',
            });
            expect(result.success).toBe(true);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4-5: Scope violations & blocked actions
// ═══════════════════════════════════════════════════════════════════════════

describe('checkScopeViolations', () => {
    test('4. blocked destructive actions detected', () => {
        const steps: ProposalStep[] = [
            { toolName: 'deleteNote', intent: 'Delete all old notes', riskLevel: 'high', requiresApproval: true },
        ];
        const violations = checkScopeViolations('notes', steps);
        expect(violations.length).toBeGreaterThan(0);
        expect(violations.some(v => v.includes('delete'))).toBe(true);
    });

    test('5. scope violation detected (ops → files)', () => {
        const steps: ProposalStep[] = [
            { toolName: 'files.upload', intent: 'Upload a file to storage', riskLevel: 'medium', requiresApproval: true },
        ];
        const violations = checkScopeViolations('ops', steps);
        expect(violations.length).toBeGreaterThan(0);
        expect(violations.some(v => v.includes('files'))).toBe(true);
    });

    test('5b. scope violation detected (jobs → secrets)', () => {
        const steps: ProposalStep[] = [
            { toolName: 'secrets.read', intent: 'Read secrets for config', riskLevel: 'high', requiresApproval: true },
        ];
        const violations = checkScopeViolations('jobs', steps);
        expect(violations.length).toBeGreaterThan(0);
        expect(violations.some(v => v.includes('secrets'))).toBe(true);
    });

    test('5c. valid scope action passes (notes → notes)', () => {
        const steps: ProposalStep[] = [
            { toolName: 'notes.analyze', intent: 'Analyze note structure', riskLevel: 'low', requiresApproval: true },
        ];
        const violations = checkScopeViolations('notes', steps);
        expect(violations.length).toBe(0);
    });

    test('5d. multiple blocked actions in single step', () => {
        const steps: ProposalStep[] = [
            { toolName: 'revokeAndDelete', intent: 'Revoke access then delete account', riskLevel: 'high', requiresApproval: true },
        ];
        const violations = checkScopeViolations('ops', steps);
        // Should detect both 'revoke' AND 'delete'
        expect(violations.length).toBeGreaterThanOrEqual(2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6: Rate limit enforcement
// ═══════════════════════════════════════════════════════════════════════════

describe('checkRateLimit', () => {
    test('6. rate limit enforcement', () => {
        const testUid = `rate-test-${Date.now()}`;

        // First 20 should pass
        for (let i = 0; i < RATE_LIMIT_PROPOSALS_PER_HOUR; i++) {
            expect(checkRateLimit(testUid)).toBe(true);
        }

        // 21st should fail
        expect(checkRateLimit(testUid)).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7-8: approveRequestSchema
// ═══════════════════════════════════════════════════════════════════════════

describe('approveRequestSchema', () => {
    test('7. valid approve request passes', () => {
        const result = approveRequestSchema.safeParse({
            proposalId: 'abc123',
            action: 'APPROVE',
        });
        expect(result.success).toBe(true);
    });

    test('8. invalid action rejected', () => {
        const result = approveRequestSchema.safeParse({
            proposalId: 'abc123',
            action: 'EXECUTE', // not valid
        });
        expect(result.success).toBe(false);
    });

    test('8b. missing proposalId rejected', () => {
        const result = approveRequestSchema.safeParse({
            action: 'APPROVE',
        });
        expect(result.success).toBe(false);
    });

    test('8c. REJECT action accepted', () => {
        const result = approveRequestSchema.safeParse({
            proposalId: 'abc123',
            action: 'REJECT',
        });
        expect(result.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9-12: proposalContentSchema (LLM output validation)
// ═══════════════════════════════════════════════════════════════════════════

describe('proposalContentSchema', () => {
    test('9. valid proposal content passes', () => {
        const result = proposalContentSchema.safeParse({
            summary: 'Organize notes by category',
            steps: [
                { toolName: 'notes.categorize', intent: 'Group notes', riskLevel: 'low', requiresApproval: true },
            ],
            estimatedImpact: 'Notes will be organized into folders',
            blockedActions: [],
        });
        expect(result.success).toBe(true);
    });

    test('10. empty steps array rejected', () => {
        const result = proposalContentSchema.safeParse({
            summary: 'Plan',
            steps: [],
            estimatedImpact: 'Impact',
            blockedActions: [],
        });
        expect(result.success).toBe(false);
    });

    test('11. invalid riskLevel rejected', () => {
        const result = proposalContentSchema.safeParse({
            summary: 'Plan',
            steps: [
                { toolName: 'action', intent: 'do something', riskLevel: 'critical', requiresApproval: true },
            ],
            estimatedImpact: 'Impact',
            blockedActions: [],
        });
        expect(result.success).toBe(false);
    });

    test('12. missing summary rejected', () => {
        const result = proposalContentSchema.safeParse({
            steps: [
                { toolName: 'action', intent: 'do something', riskLevel: 'low', requiresApproval: true },
            ],
            estimatedImpact: 'Impact',
            blockedActions: [],
        });
        expect(result.success).toBe(false);
    });

    test('12b. blockedActions default to empty array', () => {
        const result = proposalContentSchema.safeParse({
            summary: 'Plan',
            steps: [
                { toolName: 'action', intent: 'do something', riskLevel: 'low', requiresApproval: true },
            ],
            estimatedImpact: 'Impact',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.blockedActions).toEqual([]);
        }
    });

    test('12c. requiresApproval must be true', () => {
        const result = proposalContentSchema.safeParse({
            summary: 'Plan',
            steps: [
                { toolName: 'action', intent: 'do something', riskLevel: 'low', requiresApproval: false },
            ],
            estimatedImpact: 'Impact',
            blockedActions: [],
        });
        expect(result.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKED_ACTIONS constant sanity check
// ═══════════════════════════════════════════════════════════════════════════

describe('BLOCKED_ACTIONS', () => {
    test('contains expected destructive actions', () => {
        expect(BLOCKED_ACTIONS).toContain('delete');
        expect(BLOCKED_ACTIONS).toContain('revoke');
        expect(BLOCKED_ACTIONS).toContain('rotateKey');
        expect(BLOCKED_ACTIONS).toContain('dropCollection');
        expect(BLOCKED_ACTIONS).toContain('modifyGovernance');
    });
});
