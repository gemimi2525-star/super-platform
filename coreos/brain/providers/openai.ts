/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPENAI ADAPTER (Phase 21B — Brain-Adapter Hardening)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implements LLMProvider for OpenAI Chat Completion API (raw fetch).
 * Maps LLMInput → OpenAI format → fetch → LLMOutput
 *
 * Phase 21B changes:
 * - Renamed from OpenAIProvider to OpenAIAdapter
 * - Implements LLMProvider interface (generate instead of processRequest)
 * - Returns ToolCallNormalized with argumentsHash
 * - Classifies errors: 429/5xx = Retryable, 400/401/403 = NonRetryable
 * - Reports ProviderMeta for audit
 *
 * @module coreos/brain/providers/openai
 */

import {
    LLMProvider,
    LLMInput,
    LLMOutput,
    LLMMessage,
    ToolCallNormalized,
    ProviderMeta,
    LLMRetryableError,
    LLMNonRetryableError,
    hashArguments,
} from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TIMEOUT_MS = 30_000;

export class OpenAIAdapter implements LLMProvider {
    readonly providerId = 'openai' as const;
    readonly modelId: string;
    private readonly apiKey: string;

    constructor(apiKey: string, model: string = DEFAULT_MODEL) {
        this.apiKey = apiKey;
        this.modelId = model;
    }

    async generate(input: LLMInput): Promise<LLMOutput> {
        const startMs = Date.now();

        // Map LLMInput → OpenAI request payload
        const messages = this.buildMessages(input.messages);
        const payload: any = {
            model: this.modelId,
            messages,
            temperature: input.temperature ?? 0.2,
        };

        if (input.maxTokens) {
            payload.max_tokens = input.maxTokens;
        }

        if (input.tools.length > 0) {
            payload.tools = input.tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            }));
            payload.tool_choice = 'auto';
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const latencyMs = Date.now() - startMs;

            if (!response.ok) {
                const errorText = await response.text();
                this.throwClassifiedError(response.status, errorText);
            }

            const data = await response.json();
            return this.parseResponse(data, latencyMs);

        } catch (error: any) {
            if (error instanceof LLMRetryableError || error instanceof LLMNonRetryableError) {
                throw error;
            }
            // Timeout or network error → retryable
            console.error('[OpenAIAdapter] Request failed:', error.message);
            throw new LLMRetryableError(
                `OpenAI request failed: ${error.message}`,
                this.providerId,
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE: Message mapping
    // ═══════════════════════════════════════════════════════════════

    private buildMessages(messages: LLMMessage[]): any[] {
        return messages.map(msg => {
            const oai: any = {
                role: this.mapRole(msg.role),
                content: msg.content,
            };
            if (msg.name) oai.name = msg.name;
            if (msg.toolCallId) oai.tool_call_id = msg.toolCallId;
            if (msg.role === 'tool') oai.role = 'tool';
            return oai;
        });
    }

    private mapRole(role: string): string {
        if (role === 'app') return 'user';
        return role;
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE: Response parsing
    // ═══════════════════════════════════════════════════════════════

    private parseResponse(data: any, latencyMs: number): LLMOutput {
        const choice = data.choices[0];
        const message = choice.message;

        const toolCalls: ToolCallNormalized[] = [];
        if (message.tool_calls) {
            for (const tc of message.tool_calls) {
                let parsedArgs: Record<string, any> = {};
                try {
                    parsedArgs = JSON.parse(tc.function.arguments);
                } catch {
                    parsedArgs = { _raw: tc.function.arguments };
                }

                toolCalls.push({
                    callId: tc.id,
                    toolName: tc.function.name,
                    arguments: parsedArgs,
                    argumentsHash: hashArguments(parsedArgs),
                });
            }
        }

        const providerMeta: ProviderMeta = {
            providerId: this.providerId,
            modelId: this.modelId,
            requestId: data.id,
            latencyMs,
            rawResponse: data,
        };

        return {
            content: message.content || undefined,
            toolCalls,
            usage: {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
            },
            providerMeta,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE: Error classification
    // ═══════════════════════════════════════════════════════════════

    private throwClassifiedError(status: number, body: string): never {
        const msg = `OpenAI API Error: ${status} - ${body}`;
        if (status === 429 || status >= 500) {
            throw new LLMRetryableError(msg, this.providerId, status);
        }
        throw new LLMNonRetryableError(msg, this.providerId, status);
    }
}
