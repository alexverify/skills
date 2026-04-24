import type { AgentConfig } from './config.js';

const VENICE_BASE_URL = 'https://api.venice.ai/api/v1';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | ContentPart[];
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done';
  content?: string;
  tool_calls?: ToolCall[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export class VeniceClient {
  private apiKey: string;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.apiKey = config.apiKey;
    this.config = config;
  }

  async *streamChat(
    messages: ChatMessage[],
    tools?: Tool[],
  ): AsyncGenerator<StreamChunk> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      stream: true,
      max_tokens: this.config.maxTokens,
    };

    if (tools?.length) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const veniceParams: Record<string, unknown> = {};
    
    if (this.config.venice.webSearch !== 'off') {
      veniceParams.enable_web_search = this.config.venice.webSearch;
      if (this.config.venice.webCitations) {
        veniceParams.enable_web_citations = true;
      }
    }

    if (this.config.venice.xSearch) {
      veniceParams.enable_x_search = true;
    }

    if (this.config.venice.reasoningEffort !== 'medium') {
      veniceParams.reasoning_effort = this.config.venice.reasoningEffort;
    }

    if (Object.keys(veniceParams).length > 0) {
      body.venice_parameters = veniceParams;
    }

    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Venice API error: ${response.status} ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    const toolCallBuffer: Record<string, { name: string; args: string }> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          // Emit completed tool calls
          const completedCalls = Object.entries(toolCallBuffer).map(([id, { name, args }]) => ({
            id,
            type: 'function' as const,
            function: { name, arguments: args },
          }));
          if (completedCalls.length > 0) {
            yield { type: 'tool_call', tool_calls: completedCalls };
          }
          yield { type: 'done' };
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            yield { type: 'text', content: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const id = tc.id || `call_${tc.index}`;
              if (tc.id) {
                toolCallBuffer[tc.id] = { name: tc.function?.name || '', args: '' };
              }
              if (tc.function?.arguments && toolCallBuffer[id]) {
                toolCallBuffer[id].args += tc.function.arguments;
              }
              if (tc.function?.name && toolCallBuffer[id]) {
                toolCallBuffer[id].name = tc.function.name;
              }
            }
          }

          if (parsed.usage) {
            yield { type: 'done', usage: parsed.usage };
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  async getBalance(): Promise<{ credits: number; usd: number }> {
    const response = await fetch(`${VENICE_BASE_URL}/api_keys/self`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    if (!response.ok) throw new Error('Failed to fetch balance');
    const data = await response.json();
    return {
      credits: data.balance_credits || 0,
      usd: (data.balance_credits || 0) / 100,
    };
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${VENICE_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.data?.map((m: { id: string }) => m.id) || [];
  }
}
