/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LLM PROVIDER CONTRACT (Phase 21B — Brain-Adapter Hardening)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Vendor-neutral interface for LLM providers.
 * Orchestrator (gateway.ts) depends ONLY on these types — never on
 * provider SDKs or vendor-specific shapes.
 *
 * @module coreos/brain/providers/types
 */

import { createHash } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface LLMProvider {
    /** Stable identifier, e.g. 'openai', 'anthropic', 'mock' */
    readonly providerId: string;
    /** Model identifier, e.g. 'gpt-4o', 'claude-3-opus' */
    readonly modelId: string;

    /** Single entry point — orchestrator calls ONLY this */
    generate(input: LLMInput): Promise<LLMOutput>;
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT CONTRACT (orchestrator → provider)
// ═══════════════════════════════════════════════════════════════════════════

export interface LLMInput {
    messages: LLMMessage[];
    tools: LLMToolDef[];
    temperature?: number;
    maxTokens?: number;
    /** Metadata for audit trail — NOT sent to provider */
    metadata?: {
        correlationId: string;
        appScope: string;
        trustTier: string;
    };
}

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCallNormalized[];
}

export interface LLMToolDef {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT CONTRACT (provider → orchestrator)
// ═══════════════════════════════════════════════════════════════════════════

export interface LLMOutput {
    content?: string;
    toolCalls: ToolCallNormalized[];
    usage: LLMUsage;
    providerMeta: ProviderMeta;
}

export interface ToolCallNormalized {
    callId: string;
    toolName: string;
    arguments: Record<string, any>;
    argumentsHash: string;
}

export interface LLMUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface ProviderMeta {
    providerId: string;
    modelId: string;
    modelVersion?: string;
    requestId?: string;
    latencyMs: number;
    rawResponse?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MODEL
// ═══════════════════════════════════════════════════════════════════════════

export class LLMRetryableError extends Error {
    constructor(
        message: string,
        public readonly provider: string,
        public readonly statusCode?: number,
    ) {
        super(message);
        this.name = 'LLMRetryableError';
    }
}

export class LLMNonRetryableError extends Error {
    constructor(
        message: string,
        public readonly provider: string,
        public readonly statusCode?: number,
    ) {
        super(message);
        this.name = 'LLMNonRetryableError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** Deterministic hash of tool call arguments (canonical JSON → SHA-256 hex, 16 chars) */
export function hashArguments(args: Record<string, any>): string {
    const canonical = JSON.stringify(args, Object.keys(args).sort());
    return createHash('sha256').update(canonical).digest('hex').substring(0, 16);
}
