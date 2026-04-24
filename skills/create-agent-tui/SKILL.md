---
name: create-venice-agent-tui
description: Scaffolds a complete agent TUI in TypeScript using Venice AI — like create-react-app for terminal agents. Generates a customizable terminal interface with streaming output, session persistence, DIEM-aware cost tracking, and configurable tools. Works with any Venice model (Claude, GPT, Grok, Llama, Mistral, DeepSeek). Use when building an agent, creating a TUI, scaffolding an agent project, or building a coding assistant.
---

# Create Venice Agent TUI

Scaffolds a complete agent TUI in TypeScript targeting **Venice AI**. The generated project provides a production-ready terminal interface with:

- **Privacy-first inference** via Venice's zero-retention API
- **30+ model options** — Claude Opus 4.7, GPT-5.5, Grok 4, Llama 4, DeepSeek V4, Mistral, and more
- **DIEM integration** — optional pay-as-you-go with Venice's credit system
- **Built-in web search** — Venice's web search and X/Twitter search (via Grok models)
- **Customizable TUI** — input styles, tool displays, ASCII banners, loaders
- **Session persistence** — JSONL append-only conversation logs
- **Full tool suite** — file ops, shell, grep, glob, and custom tools

Architecture draws from production agent systems:
- **OpenClaw** — session management, tool permissions, approval flows
- **Claude Code** — tool metadata, system prompt composition
- **Codex CLI** — layered config, structured logging

## Prerequisites

- Node.js 18+
- `VENICE_API_KEY` from [venice.ai/settings/api](https://venice.ai/settings/api)
- Optional: DIEM balance for extended usage

---

## Decision Tree

| User wants to... | Action |
|---|---|
| Build a new agent from scratch | Present checklist below → follow Generation Workflow |
| Add tools to an existing harness | Read [references/tools.md](references/tools.md), present tool checklist only |
| Add a harness module | Read [references/modules.md](references/modules.md), generate the module |
| Configure DIEM payments | Read [references/diem-integration.md](references/diem-integration.md) |

---

## Interactive Tool Checklist

Present this as a multi-select checklist. Items marked **ON** are pre-selected defaults.

### Venice Server-Side Features

| Feature | Default | Config |
|---------|---------|--------|
| Web Search | ON | Auto-search with citations via `--web-search auto` |
| X/Twitter Search | OFF | Grok models only, via `--x-search` |
| Image Generation | OFF | Flux, DALL-E, Stable Diffusion models |
| Vision/Image Analysis | OFF | Analyze images in conversation |
| TTS (Text-to-Speech) | OFF | 60+ voices via Kokoro TTS |

### User-Defined Tools (client-side, generated into src/tools/)

| Tool | Default | Description |
|------|---------|-------------|
| File Read | ON | Read files with offset/limit, detect images |
| File Write | ON | Write/create files, auto-create directories |
| File Edit | ON | Search-and-replace with diff validation |
| Glob/Find | ON | File discovery by glob pattern |
| Grep/Search | ON | Content search by regex |
| Directory List | ON | List directory contents |
| Shell/Bash | ON | Execute commands with timeout and output capture |
| JS REPL | OFF | Persistent Node.js environment |
| Sub-agent Spawn | OFF | Delegate tasks to child agents |
| Plan/Todo | OFF | Track multi-step task progress |
| Request User Input | OFF | Structured multiple-choice questions |
| Web Fetch | OFF | Fetch and extract text from web pages |
| View Image | OFF | Read local images as base64 |
| Custom Tool Template | ON | Empty skeleton for domain-specific tools |

### Harness Modules (architectural components)

| Module | Default | Description |
|--------|---------|-------------|
| Session Persistence | ON | JSONL append-only conversation log |
| ASCII Logo Banner | OFF | Custom ASCII art banner on startup |
| Context Compaction | OFF | Summarize older messages when context is long |
| System Prompt Composition | OFF | Assemble instructions from static + dynamic context |
| Tool Permissions / Approval | OFF | Gate dangerous tools behind user confirmation |
| Structured Event Logging | OFF | Emit events for tool calls, API requests, errors |
| DIEM Cost Tracking | OFF | Track and display DIEM credit usage per session |
| Balance Awareness | OFF | Show Venice balance, warn when low |
| `@`-file References | OFF | `@filename` to attach file content to next message |
| `!` Shell Shortcut | OFF | `!command` to run shell and inject output into context |

### Slash Commands (user-facing REPL commands)

| Command | Default | Description |
|---------|---------|-------------|
| `/model` | ON | Switch Venice model interactively |
| `/new` | ON | Start a fresh conversation |
| `/help` | ON | List available commands |
| `/balance` | OFF | Show Venice API balance |
| `/compact` | OFF | Manually trigger context compaction |
| `/session` | OFF | Show session metadata and token usage |
| `/export` | OFF | Save conversation as Markdown |

### Visual Customization

**Input style** — how the prompt looks:

| Style | Default | Description |
|-------|---------|-------------|
| `block` | ON | Full-width background box with `›` prompt, adapts to terminal theme |
| `bordered` | | Horizontal `─` lines above and below input |
| `plain` | | Simple `> ` readline prompt, no escape sequences |

**Tool display** — how tool calls appear during execution:

| Style | Default | Description |
|-------|---------|-------------|
| `grouped` | ON | Bold action labels with tree-branch output |
| `emoji` | | Per-call `⚡`/`✓` markers with args and timing |
| `minimal` | | Aggregated one-liner summaries |
| `hidden` | | No tool output |

**Loader animation** — shown while waiting for model response:

| Style | Default | Description |
|-------|---------|-------------|
| `spinner` | ON | Braille dot spinner (⠋⠙⠹…) to the left of the text |
| `gradient` | | Scrolling color shimmer over the loader text |
| `minimal` | | Trailing dots (`Working···`) |

---

## Generation Workflow

After getting checklist selections, follow this workflow:

```
- [ ] Generate package.json with dependencies
- [ ] Generate src/config.ts with Venice-specific settings
- [ ] Generate src/venice-client.ts (Venice API wrapper)
- [ ] Generate src/tools/index.ts wiring selected tools
- [ ] Generate selected tool files in src/tools/
- [ ] Generate src/agent.ts (core runner with streaming)
- [ ] Generate selected harness modules
- [ ] Generate src/terminal-bg.ts (adaptive input background)
- [ ] Generate src/renderer.ts (tool display)
- [ ] Generate src/loader.ts (loader animation)
- [ ] If slash commands selected: generate src/commands.ts
- [ ] If ASCII Logo Banner is ON: generate src/banner.ts
- [ ] If DIEM tracking is ON: generate src/diem-tracker.ts
- [ ] Generate src/cli.ts entry point
- [ ] Generate .env.example with VENICE_API_KEY=
- [ ] Verify: run npx tsc --noEmit to check types
```

---

## Core Files

### package.json

```bash
npm init -y
npm pkg set type=module
npm pkg set scripts.start="tsx src/cli.ts"
npm pkg set scripts.dev="tsx watch src/cli.ts"
npm install zod
npm install -D tsx typescript @types/node
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### src/config.ts

```typescript
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface DisplayConfig {
  toolDisplay: 'emoji' | 'grouped' | 'minimal' | 'hidden';
  reasoning: boolean;
  inputStyle: 'block' | 'bordered' | 'plain';
  loader: { style: 'spinner' | 'gradient' | 'minimal'; text: string };
}

export interface VeniceConfig {
  webSearch: 'off' | 'auto' | 'on';
  webCitations: boolean;
  xSearch: boolean;
  reasoningEffort: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'max';
}

export interface AgentConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTurns: number;
  maxTokens: number;
  sessionDir: string;
  showBanner: boolean;
  display: DisplayConfig;
  venice: VeniceConfig;
  slashCommands: boolean;
}

// Venice model aliases for convenience
export const MODEL_ALIASES: Record<string, string> = {
  'opus': 'claude-opus-4-6',
  'opus-4.7': 'claude-opus-4-7',
  'sonnet': 'claude-sonnet-4-6',
  'gpt5': 'gpt-5.5',
  'grok': 'grok-41-fast',
  'deepseek': 'deepseek-v4-pro',
  'llama': 'llama-4-maverick-17b-128e-instruct',
  'qwen': 'qwen3-235b-a22b',
  'mistral': 'mistral-large-2411',
};

const DEFAULTS: AgentConfig = {
  apiKey: '',
  model: 'claude-opus-4-6',
  systemPrompt: [
    'You are a coding assistant with access to tools for reading, writing, editing, and searching files, and running shell commands.',
    '',
    'Current working directory: {cwd}',
    '',
    'Guidelines:',
    '- Use your tools proactively. Explore the codebase to find answers instead of asking the user.',
    '- Keep working until the task is fully resolved before responding.',
    '- Do not guess or make up information — use your tools to verify.',
    '- Be concise and direct.',
    '- Show file paths clearly when working with files.',
    '- Prefer grep and glob tools over shell commands for file search.',
    '- When editing code, make minimal targeted changes consistent with the existing style.',
  ].join('\n'),
  maxTurns: 20,
  maxTokens: 16000,
  sessionDir: '.sessions',
  showBanner: false,
  display: {
    toolDisplay: 'grouped',
    reasoning: false,
    inputStyle: 'block',
    loader: { style: 'spinner', text: 'Thinking' },
  },
  venice: {
    webSearch: 'off',
    webCitations: false,
    xSearch: false,
    reasoningEffort: 'medium',
  },
  slashCommands: true,
};

export function loadConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  let config = { ...DEFAULTS };

  const configPath = resolve('agent.config.json');
  if (existsSync(configPath)) {
    const file = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (file.display) config.display = { ...config.display, ...file.display };
    if (file.venice) config.venice = { ...config.venice, ...file.venice };
    config = { ...config, ...file };
  }

  if (process.env.VENICE_API_KEY) config.apiKey = process.env.VENICE_API_KEY;
  if (process.env.AGENT_MODEL) config.model = process.env.AGENT_MODEL;
  if (process.env.AGENT_MAX_TURNS) config.maxTurns = Number(process.env.AGENT_MAX_TURNS);
  if (process.env.AGENT_MAX_TOKENS) config.maxTokens = Number(process.env.AGENT_MAX_TOKENS);

  // Resolve model alias
  if (MODEL_ALIASES[config.model]) {
    config.model = MODEL_ALIASES[config.model];
  }

  config = { ...config, ...overrides };
  if (!config.apiKey) throw new Error('VENICE_API_KEY is required. Get one at venice.ai/settings/api');
  return config;
}
```

### src/venice-client.ts

```typescript
import type { AgentConfig } from './config.js';

const VENICE_BASE_URL = 'https://api.venice.ai/api/v1';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
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

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_call_delta' | 'done';
  content?: string;
  tool_call?: {
    id: string;
    function: { name: string; arguments: string };
  };
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

    // Venice-specific parameters
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
    let toolCallBuffer: Record<string, { name: string; args: string }> = {};

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
              const id = tc.id || Object.keys(toolCallBuffer)[tc.index];
              if (tc.id) {
                toolCallBuffer[tc.id] = { name: tc.function?.name || '', args: '' };
              }
              if (tc.function?.arguments) {
                toolCallBuffer[id].args += tc.function.arguments;
              }
              if (tc.function?.name) {
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

    // Emit completed tool calls
    for (const [id, { name, args }] of Object.entries(toolCallBuffer)) {
      yield {
        type: 'tool_call',
        tool_call: { id, function: { name, arguments: args } },
      };
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
```

### src/agent.ts

```typescript
import type { AgentConfig } from './config.js';
import { VeniceClient, type ChatMessage, type Tool } from './venice-client.js';
import { tools, executeToolCall, type ToolDefinition } from './tools/index.js';

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; name: string; callId: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; callId: string; output: string; error?: boolean }
  | { type: 'reasoning'; delta: string }
  | { type: 'done'; usage?: { prompt_tokens: number; completion_tokens: number } };

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
    const toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> = [];

    for await (const chunk of client.streamChat(conversationMessages, openaiTools)) {
      if (options?.signal?.aborted) break;

      if (chunk.type === 'text' && chunk.content) {
        turnText += chunk.content;
        options?.onEvent?.({ type: 'text', delta: chunk.content });
      }

      if (chunk.type === 'tool_call' && chunk.tool_call) {
        const tc = chunk.tool_call;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }
        toolCalls.push({ id: tc.id, name: tc.function.name, args });
        options?.onEvent?.({ type: 'tool_call', name: tc.function.name, callId: tc.id, args });
      }

      if (chunk.type === 'done' && chunk.usage) {
        totalUsage.prompt += chunk.usage.prompt_tokens;
        totalUsage.completion += chunk.usage.completion_tokens;
      }
    }

    // If there's text, add assistant message
    if (turnText) {
      finalText = turnText;
      conversationMessages.push({ role: 'assistant', content: turnText });
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      options?.onEvent?.({ type: 'done', usage: totalUsage });
      break;
    }

    // Execute tool calls
    const toolResults: ChatMessage[] = [];
    for (const tc of toolCalls) {
      const result = await executeToolCall(tc.name, tc.args);
      const output = typeof result === 'string' ? result : JSON.stringify(result);
      const isError = typeof result === 'object' && 'error' in result;
      
      options?.onEvent?.({
        type: 'tool_result',
        name: tc.name,
        callId: tc.id,
        output: output.length > 200 ? output.slice(0, 200) + '…' : output,
        error: isError,
      });

      toolResults.push({
        role: 'assistant',
        content: `Tool ${tc.name} result: ${output}`,
      });
    }

    conversationMessages.push(...toolResults);
  }

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
```

### src/tools/index.ts

```typescript
import { z } from 'zod';
import { fileReadTool } from './file-read.js';
import { fileWriteTool } from './file-write.js';
import { fileEditTool } from './file-edit.js';
import { globTool } from './glob.js';
import { grepTool } from './grep.js';
import { listDirTool } from './list-dir.js';
import { shellTool } from './shell.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export const tools: ToolDefinition[] = [
  fileReadTool,
  fileWriteTool,
  fileEditTool,
  globTool,
  grepTool,
  listDirTool,
  shellTool,
];

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return await tool.execute(args);
  } catch (err: any) {
    return { error: err.message || String(err) };
  }
}
```

### src/tools/file-read.ts

```typescript
import { readFile } from 'fs/promises';

export const fileReadTool = {
  name: 'file_read',
  description: 'Read the contents of a file at the given path',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Absolute or relative path to the file' },
      offset: { type: 'number', description: 'Start reading from this line (1-indexed)' },
      limit: { type: 'number', description: 'Maximum number of lines to return' },
    },
    required: ['path'],
  },
  execute: async ({ path, offset, limit }: { path: string; offset?: number; limit?: number }) => {
    try {
      const content = await readFile(path, 'utf-8');
      const lines = content.split('\n');

      const start = offset ? offset - 1 : 0;
      const end = limit ? start + limit : lines.length;
      const slice = lines.slice(start, end);

      return {
        content: slice.join('\n'),
        totalLines: lines.length,
        ...(end < lines.length && { truncated: true, nextOffset: end + 1 }),
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') return { error: `File not found: ${path}` };
      if (err.code === 'EACCES') return { error: `Permission denied: ${path}` };
      return { error: err.message };
    }
  },
};
```

---

## Venice-Specific Features

### Web Search Integration

Enable web search for real-time information:

```typescript
// In config
venice: {
  webSearch: 'auto',  // 'off' | 'auto' | 'on'
  webCitations: true, // Include source citations
}
```

### X/Twitter Search (Grok models only)

```typescript
// In config — requires a Grok model
model: 'grok-41-fast',
venice: {
  xSearch: true,
}
```

### Reasoning Effort Control

```typescript
// In config
venice: {
  reasoningEffort: 'high', // 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'max'
}
```

### DIEM Cost Tracking Module

When enabled, track credit usage:

```typescript
// src/diem-tracker.ts
export class DiemTracker {
  private sessionCredits = 0;

  addUsage(promptTokens: number, completionTokens: number, model: string) {
    // Approximate credit calculation (varies by model)
    const rate = this.getModelRate(model);
    const credits = (promptTokens * rate.input + completionTokens * rate.output) / 1000;
    this.sessionCredits += credits;
  }

  getSessionCost(): string {
    return `${this.sessionCredits.toFixed(4)} credits (~$${(this.sessionCredits / 100).toFixed(4)})`;
  }

  private getModelRate(model: string) {
    // Simplified rates — check venice.ai/pricing for current rates
    if (model.includes('opus')) return { input: 15, output: 75 };
    if (model.includes('sonnet')) return { input: 3, output: 15 };
    if (model.includes('gpt-5')) return { input: 5, output: 15 };
    return { input: 1, output: 3 }; // Default for smaller models
  }
}
```

---

## Sample Project Structure

With all defaults selected:

```
my-venice-agent/
├── package.json
├── tsconfig.json
├── .env.example          # VENICE_API_KEY=
├── agent.config.json     # Optional config overrides
└── src/
    ├── config.ts         # Layered config (defaults → file → env)
    ├── venice-client.ts  # Venice API wrapper with streaming
    ├── agent.ts          # Core runner with tool loop
    ├── cli.ts            # Interactive REPL
    ├── session.ts        # JSONL conversation persistence
    ├── terminal-bg.ts    # Adaptive background detection
    ├── renderer.ts       # Tool display renderer
    ├── loader.ts         # Loader animation
    └── tools/
        ├── index.ts      # Tool registry
        ├── file-read.ts
        ├── file-write.ts
        ├── file-edit.ts
        ├── glob.ts
        ├── grep.ts
        ├── list-dir.ts
        └── shell.ts
```

---

## Quick Start

```bash
cd my-venice-agent
npm install
VENICE_API_KEY=vn_your_key npm start
```

Or with options:

```bash
npm start -- --model deepseek --input bordered --tool-display emoji
```

---

## Why Venice for Agent TUIs?

1. **Privacy** — Zero data retention on private models. Your agent's conversations stay yours.
2. **Model diversity** — Switch between Claude, GPT, Grok, Llama, DeepSeek in one API.
3. **Built-in search** — Web and X search without external API keys.
4. **DIEM economics** — Pay-as-you-go credits that can be resold. Profitable agent operation.
5. **Uncensored models** — Venice's own models work for legitimate use cases others refuse.

---

*Built for the Venice AI ecosystem. Not financial advice. Check venice.ai/pricing for current model rates.*
