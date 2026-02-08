/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPENAI PROVIDER (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Adapter for OpenAI Chat Completion API.
 * Handles:
 * - Message format conversion
 * - Tool calling (Function calling)
 * - Rate limits and timeouts
 * 
 * @module coreos/brain/providers/openai
 */

import { BrainRequest, BrainResponse, BrainMessage, BrainToolCall } from '../types';
import { SYSTEM_PROMPT } from '../prompts';
import { toolRegistry } from '../registry'; // We need access to registered tools for definitions

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o'; // Or gpt-4-turbo

export class OpenAIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = DEFAULT_MODEL) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async processRequest(request: BrainRequest, tools: any[]): Promise<BrainResponse> {
        const messages = this.buildMessages(request);

        const payload: any = {
            model: this.model,
            messages: messages,
            temperature: 0.2, // Low temperature for deterministic behavior
            tools: tools.length > 0 ? tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                }
            })) : undefined,
            tool_choice: tools.length > 0 ? 'auto' : undefined
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return this.parseResponse(data);

        } catch (error: any) {
            console.error('[OpenAI] Request Failed:', error);
            throw error;
        }
    }

    private buildMessages(request: BrainRequest): any[] {
        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        // Add additional context as system message if present
        if (request.context) {
            messages.push({
                role: 'system',
                content: `Current Context: ${JSON.stringify(request.context)}`
            });
        }

        // Map internal messages to OpenAI format
        for (const msg of request.messages) {
            const openAIMsg: any = {
                role: mapRole(msg.role),
                content: msg.content
            };

            if (msg.name) openAIMsg.name = msg.name;
            if (msg.tool_call_id) openAIMsg.tool_call_id = msg.tool_call_id;

            // If it's a tool response, content is the result
            if (msg.role === 'tool') {
                openAIMsg.role = 'tool';
                // OpenAI expects 'tool_call_id' in tool messages
            }

            messages.push(openAIMsg);
        }

        return messages;
    }

    private parseResponse(data: any): BrainResponse {
        const choice = data.choices[0];
        const message = choice.message;

        const response: BrainResponse = {
            id: data.id,
            content: message.content || undefined,
            usage: data.usage
        };

        if (message.tool_calls) {
            response.tool_calls = message.tool_calls.map((tc: any) => ({
                id: tc.id,
                type: 'function',
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }));
        }

        return response;
    }
}

function mapRole(role: string): string {
    if (role === 'app') return 'user'; // Treat app requests as user messages
    return role;
}
