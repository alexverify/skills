import type { AgentConfig } from './config.js';
import { VeniceClient, type ChatMessage, type Tool, type ToolCall } from './venice-client.js';
import { tools, executeToolCall, type ToolDefinition } from './tools/index.js';

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; name: string; callId: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; callId: string; output: string; error?: boolean }
  | { type: 'done'; usage?: { prompt: number; completion: number } };

export async function runAgent(
  config: AgentConfig,
  messages: ChatMessage[],
  options?: { onEvent?: (event: AgentEvent) => void; signal?: AbortSignal },
): Promise<{ text: string; messages: ChatMessage[]; usage: { prompt: number; completion: number } }> {
  const client = new VeniceClient(config);
  const conversationMessages = [...messages];
  let totalUsage = { prompt: 0, completion: 0 };
  let finalText = '';

  // Add system prompt if not present
  if (!conversationMessages.find(m => m.role === 'system')) {
    conversationMessages.unshift({
      role: 'system',
      content: config.systemPrompt.replace('{cwd}', process.cwd()),
    });
  }

  // Convert tools to OpenAI format
  const openaiTools: Tool[] = tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  for (let turn = 0; turn < config.maxTurns; turn++) {
    if (options?.signal?.aborted) break;

    let turnText = '';
    let toolCalls: ToolCall[] = [];

    for await (const chunk of client.streamChat(conversationMessages, openaiTools)) {
      if (options?.signal?.aborted) break;

      if (chunk.type === 'text' && chunk.content) {
        turnText += chunk.content;
        options?.onEvent?.({ type: 'text', delta: chunk.content });
      }

      if (chunk.type === 'tool_call' && chunk.tool_calls) {
        toolCalls = chunk.tool_calls;
        for (const tc of toolCalls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments); } catch {}
          options?.onEvent?.({ type: 'tool_call', name: tc.function.name, callId: tc.id, args });
        }
      }

      if (chunk.type === 'done' && chunk.usage) {
        totalUsage.prompt += chunk.usage.prompt_tokens;
        totalUsage.completion += chunk.usage.completion_tokens;
      }
    }

    // Add assistant message with text and/or tool calls
    if (turnText || toolCalls.length > 0) {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: turnText || '',
      };
      if (toolCalls.length > 0) {
        assistantMsg.tool_calls = toolCalls;
      }
      conversationMessages.push(assistantMsg);
      if (turnText) finalText = turnText;
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      options?.onEvent?.({ type: 'done', usage: totalUsage });
      break;
    }

    // Execute tool calls and add results
    for (const tc of toolCalls) {
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(tc.function.arguments); } catch {}
      
      const result = await executeToolCall(tc.function.name, args);
      const output = typeof result === 'string' ? result : JSON.stringify(result);
      const isError = typeof result === 'object' && result !== null && 'error' in result;
      
      options?.onEvent?.({
        type: 'tool_result',
        name: tc.function.name,
        callId: tc.id,
        output: output.length > 500 ? output.slice(0, 500) + '…' : output,
        error: isError,
      });

      conversationMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: output,
      });
    }
  }

  options?.onEvent?.({ type: 'done', usage: totalUsage });
  return { text: finalText, messages: conversationMessages, usage: totalUsage };
}

export async function runAgentWithRetry(
  config: AgentConfig,
  messages: ChatMessage[],
  options?: { onEvent?: (event: AgentEvent) => void; signal?: AbortSignal; maxRetries?: number },
) {
  for (let attempt = 0, max = options?.maxRetries ?? 3; attempt <= max; attempt++) {
    try {
      return await runAgent(config, messages, options);
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      if (!(status === 429 || (status >= 500 && status < 600)) || attempt === max) throw err;
      await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 30000)));
    }
  }
  throw new Error('Unreachable');
}
