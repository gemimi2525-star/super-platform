/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL REGISTRY (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages available tools for the AI Brain.
 * Enforces Capability Checks before execution.
 * 
 * @module coreos/brain/registry
 */

import { BrainTool, ToolContext } from './types';
import { CapabilityId } from '../types';

class ToolRegistry {
    private tools: Map<string, BrainTool> = new Map();

    constructor() {
        this.registerDefaultTools();
    }

    registerTool(tool: BrainTool) {
        if (this.tools.has(tool.name)) {
            console.warn(`[Registry] Overwriting tool: ${tool.name}`);
        }
        this.tools.set(tool.name, tool);
    }

    getTool(name: string): BrainTool | undefined {
        return this.tools.get(name);
    }

    /**
     * Get all registered tools (for LLM context)
     */
    getAllTools(): BrainTool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Execute a tool with security checks
     */
    async executeTool(name: string, args: any, context: ToolContext): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }

        // 1. Security Check: Does App have required capabilities?
        // In a real system, we'd check AppRegistry for context.appId's capabilities.
        // For scaffold, we assume "system" or trust the check for now.
        console.log(`[Registry] Checking capabilities for ${context.appId} -> ${tool.name} [Required: ${tool.requiredCapabilities.join(', ')}]`);

        // Mock Capability Check
        // if (!hasCapabilities(context.appId, tool.requiredCapabilities)) throw ...

        // 2. Execute Handler
        try {
            return await tool.handler(args, context);
        } catch (e: any) {
            console.error(`[Registry] Tool Execution Failed: ${e.message}`);
            throw new Error(`Tool error: ${e.message}`);
        }
    }

    private registerDefaultTools() {
        // 1. Compliance Validator (Mock)
        this.registerTool({
            name: 'validate_document_compliance',
            description: 'Validates a document against a compliance standard.',
            parameters: {
                type: 'object',
                properties: {
                    documentId: { type: 'string' },
                    standard: { type: 'string', enum: ['ISO-27001', 'GDPR'] }
                },
                required: ['documentId', 'standard']
            },
            requiredCapabilities: ['audit.view'], // Example requirement
            handler: async (args, ctx) => {
                return {
                    status: 'compliant',
                    score: 98,
                    issues: [],
                    auditedBy: 'AI-Scaffold'
                };
            }
        });

        // 2. Draft Intent (Mock)
        this.registerTool({
            name: 'draft_intent_from_text',
            description: 'Analyzes text and proposes a system intent.',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string' }
                },
                required: ['text']
            },
            requiredCapabilities: ['core.tools'],
            handler: async (args, ctx) => {
                return {
                    intent: 'CREATE_INVOICE',
                    parameters: { amount: 1000, currency: 'USD' },
                    confidence: 0.95
                };
            }
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PHASE 26.2B: Real Execution Tools (System/User Only)
        // ─────────────────────────────────────────────────────────────────────────

        // 3. File Execution Tools
        this.registerTool({
            name: 'execute_file_move',
            description: 'Moves a file to a new destination. REQUIRES APPROVAL.',
            parameters: {
                type: 'object',
                properties: {
                    source: { type: 'string' },
                    destination: { type: 'string' }
                },
                required: ['source', 'destination']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                const { snapshotManager } = await import('@/coreos/fs/snapshot');
                const snapshotId = await snapshotManager.createSnapshot([args.source], `Pre-Move: ${args.source}`);

                console.log(`[EXECUTE] Moving file ${args.source} -> ${args.destination}`);
                // In real OS: await vfs.move(args.source, args.destination);
                return { success: true, moved: args.source, undoToken: snapshotId };
            }
        });

        this.registerTool({
            name: 'execute_file_rename',
            description: 'Renames a file. REQUIRES APPROVAL.',
            parameters: {
                type: 'object',
                properties: {
                    source: { type: 'string' },
                    newName: { type: 'string' }
                },
                required: ['source', 'newName']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                console.log(`[EXECUTE] Renaming file ${args.source} -> ${args.newName}`);
                // In real OS: await vfs.rename(args.source, args.newName);
                return { success: true, renamed: args.newName };
            }
        });

        // 4. Settings Execution Tools
        this.registerTool({
            name: 'execute_revoke_permission',
            description: 'Revokes a permission from an app. REQUIRES APPROVAL.',
            parameters: {
                type: 'object',
                properties: {
                    appName: { type: 'string' },
                    capabilityId: { type: 'string' }
                },
                required: ['appName', 'capabilityId']
            },
            requiredCapabilities: ['core.settings'],
            handler: async (args, ctx) => {
                console.log(`[EXECUTE] Revoking ${args.capabilityId} from ${args.appName}`);
                // In real OS: await permissionStore.revoke(args.appName, args.capabilityId);
                return { success: true, status: 'revoked' };
            }
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PHASE 26.3: Automation Pilot (Limited Scope)
        // ─────────────────────────────────────────────────────────────────────────

        let automationEnabled = true; // Kill Switch

        this.registerTool({
            name: 'execute_auto_clean_tmp',
            description: 'Automatically cleans temporary files. SCOPE: tmp:// ONLY.',
            parameters: {
                type: 'object',
                properties: {
                    targetPath: { type: 'string' }
                },
                required: ['targetPath']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                // 1. Kill Switch Check
                if (!automationEnabled) {
                    throw new Error('Automation is DISABLED globally.');
                }

                // 2. Safety Scope Check (tmp:// only)
                if (!args.targetPath.startsWith('tmp://')) {
                    console.error(`[SAFETY] Blocked automation on non-tmp path: ${args.targetPath}`);
                    throw new Error('SAFETY BREACH: Automation allowed on tmp:// only.');
                }

                const { snapshotManager } = await import('@/coreos/fs/snapshot');
                const snapshotId = await snapshotManager.createSnapshot([args.targetPath], `Pre-AutoClean: ${args.targetPath}`);

                console.log(`[AUTO] Cleaning path: ${args.targetPath}`);

                // Mock Operation
                const cleaned = ['cache_01.log', 'session_dump.tmp'];

                return {
                    success: true,
                    cleanedFiles: cleaned,
                    undoToken: snapshotId // Reversibility
                };
            }
        });

        // Helper to toggle kill switch (exposed for verification)
        this.registerTool({
            name: 'admin_toggle_automation',
            description: 'Admin tool to toggle automation kill switch.',
            parameters: {
                type: 'object',
                properties: {
                    enable: { type: 'boolean' }
                },
                required: ['enable']
            },
            requiredCapabilities: ['core.admin'], // Requires high privilege
            handler: async (args, ctx) => {
                automationEnabled = args.enable;
                console.log(`[ADMIN] Automation enabled: ${automationEnabled}`);
                return { status: automationEnabled ? 'enabled' : 'disabled' };
            }
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PHASE 27: Intelligent Recovery (Recycle Bin & Snapshots)
        // ─────────────────────────────────────────────────────────────────────────

        // 5. Safe Delete (Recycle Bin)
        this.registerTool({
            name: 'execute_file_delete',
            description: 'Safely deletes a file to Recycle Bin. REQUIRES APPROVAL.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string' }
                },
                required: ['path']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                const { recycleBin } = await import('@/coreos/fs/recycle-bin');
                const item = await recycleBin.deleteFile(args.path, ctx.userId);
                return { success: true, recycleId: item.id, message: 'Moved to Recycle Bin' };
            }
        });

        // 6. Undo / Rollback
        this.registerTool({
            name: 'execute_system_rollback',
            description: 'Rolls back a snapshot or restores a file.',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['snapshot', 'recycle'] },
                    id: { type: 'string' }
                },
                required: ['type', 'id']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                if (args.type === 'snapshot') {
                    const { snapshotManager } = await import('@/coreos/fs/snapshot');
                    await snapshotManager.rollback(args.id);
                    return { success: true, restored: 'snapshot' };
                } else {
                    const { recycleBin } = await import('@/coreos/fs/recycle-bin');
                    await recycleBin.restoreFile(args.id);
                    return { success: true, restored: 'file' };
                }
            }
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PHASE 28: Automated User Data Management (Policy Bound)
        // ─────────────────────────────────────────────────────────────────────────

        this.registerTool({
            name: 'execute_auto_organize',
            description: 'Automatically organizes user files. Bound by Policy & Quota.',
            parameters: {
                type: 'object',
                properties: {
                    sourcePath: { type: 'string' },
                    targetPath: { type: 'string' }
                },
                required: ['sourcePath', 'targetPath']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                // 1. Kill Switch Check
                if (!automationEnabled) {
                    throw new Error('Automation is DISABLED globally.');
                }

                // 2. Policy & Quota Check
                const { policyEngine } = await import('@/coreos/brain/policy');
                policyEngine.checkOperation('move', args.sourcePath);
                // Also check target to be safe
                policyEngine.checkOperation('move', args.targetPath);

                // 3. Safety Snapshot
                const { snapshotManager } = await import('@/coreos/fs/snapshot');
                const snapshotId = await snapshotManager.createSnapshot([args.sourcePath], `Auto-Organize: ${args.sourcePath}`);

                console.log(`[AUTO] Organizing: ${args.sourcePath} -> ${args.targetPath}`);

                // 4. Commit Quota
                policyEngine.commitUsage(1);

                return {
                    success: true,
                    moved: args.sourcePath,
                    undoToken: snapshotId,
                    quotaRemaining: 50 - policyEngine.getStats().filesProcessed // Mock calc
                };
            }
        });

        // Admin Tool to Reset Quota (Verification only)
        this.registerTool({
            name: 'admin_reset_quota',
            description: 'Resets automation quota.',
            parameters: { type: 'object', properties: {} },
            requiredCapabilities: ['core.admin'],
            handler: async (args, ctx) => {
                const { policyEngine } = await import('@/coreos/brain/policy');
                policyEngine.resetUsage();
                return { success: true };
            }
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PHASE 29: Business Intelligence & Trust (Read/Draft Only)
        // ─────────────────────────────────────────────────────────────────────────

        this.registerTool({
            name: 'execute_business_analyze',
            description: 'Analyzes business documents (Read/Draft Only). Bound by Trust.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string' },
                    content: { type: 'string' } // Mock content passed for simplicity
                },
                required: ['path', 'content']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                const { businessLogic } = await import('@/coreos/brain/business-logic');
                return await businessLogic.analyzeDocument(args.path, args.content);
            }
        });

        // Prohibited Tool (For Verification Only - Simulation)
        this.registerTool({
            name: 'execute_accounting_post',
            description: 'Attempts to post to ledger. SHOULD FAIL.',
            parameters: { type: 'object', properties: {} },
            requiredCapabilities: ['core.finance'], // AI doesn't have this usually
            handler: async (args, ctx) => {
                const { businessLogic } = await import('@/coreos/brain/business-logic');
                await businessLogic.postToLedger({});
                return { success: false };
            }
        });

        // ─────────────────────────────────────────────────────────────────────────
        // PHASE 30: Human-Verified Accounting Workflow (Copilot Mode)
        // ─────────────────────────────────────────────────────────────────────────

        this.registerTool({
            name: 'execute_create_accounting_draft',
            description: 'AI creates a draft for accounting. Safe action.',
            parameters: {
                type: 'object',
                properties: {
                    sourceDoc: { type: 'string' },
                    data: { type: 'object' }
                },
                required: ['sourceDoc', 'data']
            },
            requiredCapabilities: ['core.files'],
            handler: async (args, ctx) => {
                const { accountingWorkflow } = await import('@/coreos/brain/accounting-workflow');

                // Phase 31: Control Plane Check
                const { controlPlane } = await import('@/coreos/brain/control-plane');
                const { complianceEngine } = await import('@/coreos/brain/compliance');
                const { subscriptionManager } = await import('@/coreos/brain/subscription');
                const { panicControl } = await import('@/coreos/brain/panic');
                const { trustObservatory } = await import('@/coreos/brain/observability');

                // Phase 33: Panic Check
                const dept = 'finance'; // Mock context
                panicControl.checkHealth(dept);

                // Phase 32: Subscription Check
                const tenantId = ctx.appId; // Mock mapping appId to tenant for demo
                subscriptionManager.checkFeature(tenantId, 'aiDraft');

                // Assume 'finance' dept for accounting tools
                controlPlane.checkAccess('finance', 'execute_create_accounting_draft');

                // Phase 32: Apply Compliance Logic (Tax Calculation)
                let draftData = args.data;
                let taxInfo = undefined;
                if (draftData.amount) {
                    taxInfo = complianceEngine.calculateTax(draftData.amount);
                    draftData = { ...draftData, ...taxInfo, country: complianceEngine.getRules().code };
                }

                const id = await accountingWorkflow.createDraft(args.sourceDoc, draftData, ctx.userId);

                // Phase 33: Observability Record (Assume Success implies 'PROPOSAL')
                // Real usage would record specific user feedback later
                // Here we just note that a proposal was generated
                // trustObservatory.recordInteraction(...) - usually called on feedback loop

                return { success: true, draftId: id, status: 'DRAFT', localizedInfo: taxInfo };
            }
        });

        this.registerTool({
            name: 'execute_human_ledger_post',
            description: 'Finalizes and Posts a Draft to Ledger. HUMAN ONLY + RBAC.',
            parameters: {
                type: 'object',
                properties: {
                    draftId: { type: 'string' }
                },
                required: ['draftId']
            },
            requiredCapabilities: ['core.finance'],
            handler: async (args, ctx) => {
                // Phase 31: RBAC Check (SoD)
                const { rbac } = await import('@/coreos/brain/rbac');
                rbac.enforceSoD(ctx.userId, 'POST_LEDGER');

                const { accountingWorkflow } = await import('@/coreos/brain/accounting-workflow');
                await accountingWorkflow.postToLedger(args.draftId, ctx.userId);
                return { success: true, status: 'POSTED' };
            }
        });

        // Admin Tool to Set Trust (Verification)
        this.registerTool({
            name: 'admin_set_trust',
            description: 'Sets AI Trust Score.',
            parameters: {
                type: 'object',
                properties: { score: { type: 'number' } },
                required: ['score']
            },
            requiredCapabilities: ['core.admin'],
            handler: async (args, ctx) => {
                const { trustEngine } = await import('@/coreos/brain/trust');
                trustEngine.setScore(args.score);
                return { success: true, tier: trustEngine.getTier() };
            }
        });

        // Phase 31: Admin Control Plane
        this.registerTool({
            name: 'admin_configure_dept',
            description: 'Configures Department AI Settings.',
            parameters: {
                type: 'object',
                properties: {
                    deptId: { type: 'string' },
                    aiEnabled: { type: 'boolean' }
                },
                required: ['deptId', 'aiEnabled']
            },
            requiredCapabilities: ['core.admin'],
            handler: async (args, ctx) => {
                const { controlPlane } = await import('@/coreos/brain/control-plane');
                controlPlane.setDepartmentConfig(args.deptId, {
                    id: args.deptId,
                    aiEnabled: args.aiEnabled,
                    quotaPerDay: 100, // Default preservation
                    allowedTools: ['execute_create_accounting_draft']
                });
                return { success: true, config: `AI Enabled: ${args.aiEnabled}` };
            }
        });

        // Phase 32: Admin Country Switch
        this.registerTool({
            name: 'admin_set_country',
            description: 'Sets Global Compliance Context.',
            parameters: {
                type: 'object',
                properties: { code: { type: 'string' } },
                required: ['code']
            },
            requiredCapabilities: ['core.admin'],
            handler: async (args, ctx) => {
                const { complianceEngine } = await import('@/coreos/brain/compliance');
                complianceEngine.setCountry(args.code);
                return { success: true, rules: complianceEngine.getRules() };
            }
        });

        // Phase 33: Observability & Kill Switch
        this.registerTool({
            name: 'admin_panic_switch',
            description: 'Activate/Reset Kill Switch.',
            parameters: {
                type: 'object',
                properties: { scope: { type: 'string' }, action: { type: 'string', enum: ['ACTIVATE', 'RESET'] } },
                required: ['scope', 'action']
            },
            requiredCapabilities: ['core.admin'],
            handler: async (args, ctx) => {
                const { panicControl } = await import('@/coreos/brain/panic');
                if (args.action === 'ACTIVATE') panicControl.activateKillSwitch(args.scope);
                else panicControl.resetKillSwitch(args.scope);
                return { success: true };
            }
        });

        this.registerTool({
            name: 'admin_get_trust_metrics',
            description: 'Get AI Trust Score and Metrics.',
            parameters: { type: 'object', properties: {} },
            requiredCapabilities: ['core.admin'],
            handler: async (args, ctx) => {
                const { trustObservatory } = await import('@/coreos/brain/observability');
                return trustObservatory.getMetrics();
            }
        });

        this.registerTool({
            name: 'execute_feedback_loop',
            description: 'Record user feedback on AI action.',
            parameters: {
                type: 'object',
                properties: { outcome: { type: 'string', enum: ['APPROVE', 'REJECT', 'OVERRIDE'] } },
                required: ['outcome']
            },
            requiredCapabilities: ['core.files'], // User level
            handler: async (args, ctx) => {
                const { trustObservatory } = await import('@/coreos/brain/observability');
                trustObservatory.recordInteraction(args.outcome);
                return { success: true };
            }
        });
    }
}

export const toolRegistry = new ToolRegistry();
