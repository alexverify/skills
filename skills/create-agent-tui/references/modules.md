# Harness Modules Reference

Architectural components that can be added to the agent harness.

---

## Session Persistence

JSONL append-only conversation log for persistence and export.

```typescript
// src/session.ts
export class SessionManager {
  constructor(sessionDir: string);
  async init(): Promise<void>;
  async appendMessage(message: ChatMessage): Promise<void>;
  async appendToolCall(name: string, callId: string, args: unknown): Promise<void>;
  async appendToolResult(name: string, callId: string, result: unknown, durationMs: number): Promise<void>;
  async getMessages(): Promise<ChatMessage[]>;
  async exportMarkdown(): Promise<string>;
  getSessionId(): string;
  getSessionFile(): string;
}
```

**File format:** Each line is a JSON object with `timestamp`, `type`, and `data`.

---

## Context Compaction

Summarizes older messages when context gets too long.

```typescript
// src/compaction.ts
export interface CompactionConfig {
  maxTokens: number;          // Trigger compaction above this
  keepRecentMessages: number; // Messages to preserve uncompacted
  summaryModel: string;       // Model for generating summaries
}

export async function compactConversation(
  messages: ChatMessage[],
  config: CompactionConfig,
  client: VeniceClient,
): Promise<ChatMessage[]>;
```

**Strategy:**
1. Count tokens in conversation
2. If above threshold, take older messages
3. Generate a summary using a fast model
4. Replace old messages with summary message

---

## System Prompt Composition

Assembles system prompt from static and dynamic context.

```typescript
// src/system-prompt.ts
export interface SystemPromptConfig {
  base: string;              // Base instructions
  tools?: string;            // Tool usage guidelines
  context?: string;          // Dynamic context (cwd, date, etc.)
  project?: string;          // Project-specific instructions
}

export function buildSystemPrompt(config: SystemPromptConfig): string {
  return [
    config.base,
    config.tools && `\n## Tools\n${config.tools}`,
    config.context && `\n## Context\n${config.context}`,
    config.project && `\n## Project\n${config.project}`,
  ].filter(Boolean).join('\n');
}
```

---

## Tool Permissions / Approval

Gates dangerous tools behind user confirmation.

```typescript
// src/approval.ts
export interface ToolMetadata {
  name: string;
  category: 'read-only' | 'write' | 'destructive' | 'network';
  requiresApproval: boolean;
}

export const TOOL_METADATA: Record<string, ToolMetadata> = {
  file_read: { name: 'file_read', category: 'read-only', requiresApproval: false },
  file_write: { name: 'file_write', category: 'write', requiresApproval: true },
  shell: { name: 'shell', category: 'destructive', requiresApproval: true },
  // ...
};

export async function requestApproval(
  toolName: string,
  args: Record<string, unknown>,
): Promise<boolean>;
```

---

## Structured Event Logging

Emits events for tool calls, API requests, errors.

```typescript
// src/logger.ts
export type LogEvent = 
  | { type: 'api_request'; model: string; tokens: number; latencyMs: number }
  | { type: 'tool_call'; name: string; args: unknown; durationMs: number }
  | { type: 'tool_error'; name: string; error: string }
  | { type: 'session_start'; sessionId: string }
  | { type: 'session_end'; totalTokens: number; totalCost: number };

export class EventLogger {
  constructor(logFile?: string);
  emit(event: LogEvent): void;
  flush(): Promise<void>;
}
```

---

## DIEM Cost Tracking

Tracks Venice credit usage per session.

```typescript
// src/diem-tracker.ts
export class DiemTracker {
  private sessionCredits = 0;
  
  addUsage(promptTokens: number, completionTokens: number, model: string): void;
  getSessionCost(): string;
  getSessionCredits(): number;
  
  private getModelRate(model: string): { input: number; output: number };
}
```

---

## Balance Awareness

Shows Venice balance, warns when low.

```typescript
// In CLI startup
const client = new VeniceClient(config);
const balance = await client.getBalance();

if (balance.usd < 1) {
  console.log(`${YELLOW}⚠ Low balance: $${balance.usd.toFixed(2)}${RESET}`);
}
```

---

## @-file References

Allows `@filename` syntax to attach file content.

```typescript
// src/file-refs.ts
export async function expandFileRefs(input: string): Promise<string> {
  const regex = /@([\w\-\.\/]+)/g;
  let result = input;
  
  for (const match of input.matchAll(regex)) {
    const filePath = match[1];
    try {
      const content = await readFile(filePath, 'utf-8');
      result = result.replace(match[0], `\n<file path="${filePath}">\n${content}\n</file>\n`);
    } catch {
      // Leave as-is if file doesn't exist
    }
  }
  
  return result;
}
```

---

## ! Shell Shortcut

Allows `!command` to run shell and inject output.

```typescript
// In input handler
if (input.startsWith('!')) {
  const command = input.slice(1);
  const { stdout, stderr } = await exec(command);
  const output = stdout || stderr;
  
  // Inject into context
  messages.push({
    role: 'user',
    content: `Shell command: ${command}\n\nOutput:\n${output}`,
  });
}
```
