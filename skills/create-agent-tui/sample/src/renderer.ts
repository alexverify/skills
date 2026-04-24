/**
 * Tool display renderer for the agent TUI.
 * Four styles: grouped (tree output), emoji (per-call markers), minimal (one-liners), hidden.
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

export type ToolDisplayStyle = 'emoji' | 'grouped' | 'minimal' | 'hidden';

export interface ToolCallEvent {
  name: string;
  callId: string;
  args: Record<string, unknown>;
}

export interface ToolResultEvent {
  name: string;
  callId: string;
  output: string;
  error?: boolean;
  durationMs?: number;
}

// Tool-specific icons and labels
const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  file_read: { icon: '📖', label: 'Reading', color: CYAN },
  file_write: { icon: '✏️ ', label: 'Writing', color: GREEN },
  file_edit: { icon: '🔧', label: 'Editing', color: YELLOW },
  shell: { icon: '⚡', label: 'Running', color: YELLOW },
  glob: { icon: '🔍', label: 'Finding', color: CYAN },
  grep: { icon: '🔎', label: 'Searching', color: CYAN },
  list_dir: { icon: '📁', label: 'Listing', color: CYAN },
};

export class ToolRenderer {
  private style: ToolDisplayStyle;
  private currentGroup: string | null = null;
  private pendingCalls: Map<string, { name: string; startTime: number }> = new Map();
  private minimalBuffer: string[] = [];

  constructor(style: ToolDisplayStyle = 'grouped') {
    this.style = style;
  }

  onToolCall(event: ToolCallEvent): void {
    if (this.style === 'hidden') return;

    this.pendingCalls.set(event.callId, { name: event.name, startTime: Date.now() });

    switch (this.style) {
      case 'emoji':
        this.renderEmojiCall(event);
        break;
      case 'grouped':
        this.renderGroupedCall(event);
        break;
      case 'minimal':
        this.bufferMinimalCall(event);
        break;
    }
  }

  onToolResult(event: ToolResultEvent): void {
    if (this.style === 'hidden') return;

    const pending = this.pendingCalls.get(event.callId);
    const durationMs = pending ? Date.now() - pending.startTime : event.durationMs || 0;
    this.pendingCalls.delete(event.callId);

    switch (this.style) {
      case 'emoji':
        this.renderEmojiResult(event, durationMs);
        break;
      case 'grouped':
        this.renderGroupedResult(event, durationMs);
        break;
      case 'minimal':
        // Minimal doesn't show results individually
        break;
    }
  }

  flushMinimal(): void {
    if (this.style === 'minimal' && this.minimalBuffer.length > 0) {
      console.log(`${DIM}[${this.minimalBuffer.join(', ')}]${RESET}`);
      this.minimalBuffer = [];
    }
  }

  reset(): void {
    this.currentGroup = null;
    this.pendingCalls.clear();
    this.minimalBuffer = [];
  }

  // --- Emoji style ---

  private renderEmojiCall(event: ToolCallEvent): void {
    const meta = TOOL_META[event.name] || { icon: '🔧', label: event.name, color: CYAN };
    const args = this.summarizeArgs(event.name, event.args);
    console.log(`  ${YELLOW}⚡${RESET} ${meta.color}${event.name}${RESET}${args ? ` ${DIM}${args}${RESET}` : ''}`);
  }

  private renderEmojiResult(event: ToolResultEvent, durationMs: number): void {
    const status = event.error ? `${RED}✗${RESET}` : `${GREEN}✓${RESET}`;
    const time = `${(durationMs / 1000).toFixed(1)}s`;
    const preview = event.output.split('\n')[0].slice(0, 50);
    console.log(`  ${status} ${DIM}${event.name} (${time})${preview ? ': ' + preview : ''}${RESET}`);
  }

  // --- Grouped style ---

  private renderGroupedCall(event: ToolCallEvent): void {
    const meta = TOOL_META[event.name] || { icon: '🔧', label: event.name, color: CYAN };
    
    if (this.currentGroup !== event.name) {
      if (this.currentGroup) console.log(); // Space between groups
      console.log(`${BOLD}${meta.icon} ${meta.label}${RESET}`);
      this.currentGroup = event.name;
    }
    
    const args = this.summarizeArgs(event.name, event.args);
    if (args) {
      console.log(`${GRAY}  └─ ${args}${RESET}`);
    }
  }

  private renderGroupedResult(event: ToolResultEvent, durationMs: number): void {
    const status = event.error ? `${RED}✗${RESET}` : `${GREEN}✓${RESET}`;
    const preview = event.output.split('\n')[0].slice(0, 60);
    console.log(`${GRAY}  └─ ${status} ${preview}${preview.length < event.output.length ? '…' : ''} ${DIM}(${(durationMs / 1000).toFixed(1)}s)${RESET}`);
  }

  // --- Minimal style ---

  private bufferMinimalCall(event: ToolCallEvent): void {
    const meta = TOOL_META[event.name] || { icon: '🔧', label: event.name, color: '' };
    this.minimalBuffer.push(meta.label || event.name);
  }

  // --- Helpers ---

  private summarizeArgs(name: string, args: Record<string, unknown>): string {
    const keyMap: Record<string, string> = {
      shell: 'command',
      file_read: 'path',
      file_write: 'path',
      file_edit: 'path',
      glob: 'pattern',
      grep: 'pattern',
      list_dir: 'path',
    };

    const key = keyMap[name] || Object.keys(args)[0];
    if (!key || !(key in args)) return '';

    const val = String(args[key]);
    return val.length > 50 ? val.slice(0, 50) + '…' : val;
  }
}
