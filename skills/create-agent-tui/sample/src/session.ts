import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ChatMessage } from './venice-client.js';

export interface SessionEntry {
  timestamp: string;
  type: 'message' | 'tool_call' | 'tool_result' | 'meta';
  data: unknown;
}

export class SessionManager {
  private sessionDir: string;
  private sessionId: string;
  private sessionFile: string;

  constructor(sessionDir: string = '.sessions') {
    this.sessionDir = sessionDir;
    this.sessionId = this.generateSessionId();
    this.sessionFile = join(sessionDir, `${this.sessionId}.jsonl`);
  }

  private generateSessionId(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const rand = Math.random().toString(36).slice(2, 6);
    return `${date}_${time}_${rand}`;
  }

  async init(): Promise<void> {
    if (!existsSync(this.sessionDir)) {
      await mkdir(this.sessionDir, { recursive: true });
    }
    await this.append({ type: 'meta', data: { event: 'session_start', sessionId: this.sessionId } });
  }

  async append(entry: Omit<SessionEntry, 'timestamp'>): Promise<void> {
    const fullEntry: SessionEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    await writeFile(this.sessionFile, JSON.stringify(fullEntry) + '\n', { flag: 'a' });
  }

  async appendMessage(message: ChatMessage): Promise<void> {
    await this.append({ type: 'message', data: message });
  }

  async appendToolCall(name: string, callId: string, args: unknown): Promise<void> {
    await this.append({ type: 'tool_call', data: { name, callId, args } });
  }

  async appendToolResult(name: string, callId: string, result: unknown, durationMs: number): Promise<void> {
    await this.append({ type: 'tool_result', data: { name, callId, result, durationMs } });
  }

  async loadSession(sessionId: string): Promise<SessionEntry[]> {
    const file = join(this.sessionDir, `${sessionId}.jsonl`);
    try {
      const content = await readFile(file, 'utf-8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async getMessages(): Promise<ChatMessage[]> {
    const entries = await this.loadSession(this.sessionId);
    return entries
      .filter(e => e.type === 'message')
      .map(e => e.data as ChatMessage);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionFile(): string {
    return this.sessionFile;
  }

  async exportMarkdown(): Promise<string> {
    const entries = await this.loadSession(this.sessionId);
    const lines: string[] = [
      `# Session ${this.sessionId}`,
      '',
      `Started: ${entries[0]?.timestamp || 'unknown'}`,
      '',
      '---',
      '',
    ];

    for (const entry of entries) {
      if (entry.type === 'message') {
        const msg = entry.data as ChatMessage;
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        lines.push(`## ${role}`);
        lines.push('');
        lines.push(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
        lines.push('');
      } else if (entry.type === 'tool_call') {
        const tc = entry.data as { name: string; callId: string; args: unknown };
        lines.push(`> 🔧 **${tc.name}**`);
        lines.push('> ```json');
        lines.push(`> ${JSON.stringify(tc.args, null, 2).replace(/\n/g, '\n> ')}`);
        lines.push('> ```');
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
