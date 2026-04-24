# Tool Reference

All user-defined tools follow a consistent pattern. This document provides complete specs for each tool.

## Tool Interface

```typescript
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  execute: (args: any) => Promise<unknown>;
}
```

---

## File Read

Reads file contents with optional offset/limit for large files.

```typescript
export const fileReadTool = {
  name: 'file_read',
  description: 'Read the contents of a file at the given path',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file' },
      offset: { type: 'number', description: 'Start line (1-indexed)' },
      limit: { type: 'number', description: 'Max lines to return' },
    },
    required: ['path'],
  },
  execute: async ({ path, offset, limit }) => {
    // Returns: { content, totalLines, truncated?, nextOffset? }
  },
};
```

---

## File Write

Creates or overwrites files, auto-creating parent directories.

```typescript
export const fileWriteTool = {
  name: 'file_write',
  description: 'Write content to a file, creating directories if needed',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to write to' },
      content: { type: 'string', description: 'Content to write' },
    },
    required: ['path', 'content'],
  },
  execute: async ({ path, content }) => {
    // Returns: { success, path, lines }
  },
};
```

---

## File Edit

Search-and-replace with exact matching and diff validation.

```typescript
export const fileEditTool = {
  name: 'file_edit',
  description: 'Edit a file by replacing exact text',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to file' },
      oldText: { type: 'string', description: 'Exact text to find' },
      newText: { type: 'string', description: 'Replacement text' },
    },
    required: ['path', 'oldText', 'newText'],
  },
  execute: async ({ path, oldText, newText }) => {
    // Returns: { success, linesRemoved, linesAdded, diffPreview }
    // Errors if oldText not found or found multiple times
  },
};
```

---

## Shell/Bash

Executes shell commands with timeout and output capture.

```typescript
export const shellTool = {
  name: 'shell',
  description: 'Execute a shell command',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to execute' },
      cwd: { type: 'string', description: 'Working directory' },
      timeout: { type: 'number', description: 'Timeout in ms' },
    },
    required: ['command'],
  },
  execute: async ({ command, cwd, timeout }) => {
    // Returns: { stdout, stderr, exitCode }
  },
};
```

---

## Glob/Find

Finds files by glob pattern.

```typescript
export const globTool = {
  name: 'glob',
  description: 'Find files matching a glob pattern',
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.ts)' },
      cwd: { type: 'string', description: 'Base directory' },
      ignore: { type: 'array', description: 'Patterns to ignore' },
    },
    required: ['pattern'],
  },
  execute: async ({ pattern, cwd, ignore }) => {
    // Returns: { files, count }
  },
};
```

---

## Grep/Search

Searches file contents by regex pattern.

```typescript
export const grepTool = {
  name: 'grep',
  description: 'Search for a pattern in files',
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Regex pattern' },
      path: { type: 'string', description: 'File or glob to search' },
      cwd: { type: 'string', description: 'Base directory' },
    },
    required: ['pattern', 'path'],
  },
  execute: async ({ pattern, path, cwd }) => {
    // Returns: { matches: [{ file, line, content }], total }
  },
};
```

---

## List Directory

Lists directory contents with file types and sizes.

```typescript
export const listDirTool = {
  name: 'list_dir',
  description: 'List directory contents',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path' },
      showHidden: { type: 'boolean', description: 'Include hidden files' },
    },
    required: ['path'],
  },
  execute: async ({ path, showHidden }) => {
    // Returns: { path, count, entries: [{ name, type, size? }] }
  },
};
```

---

## JS REPL (Optional)

Persistent Node.js environment for code execution.

```typescript
export const jsReplTool = {
  name: 'js_repl',
  description: 'Execute JavaScript in a persistent Node.js environment',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'JavaScript code to execute' },
    },
    required: ['code'],
  },
  execute: async ({ code }) => {
    // Returns: { result, console: [] }
  },
};
```

---

## Web Fetch (Optional)

Fetches and extracts text from web pages.

```typescript
export const webFetchTool = {
  name: 'web_fetch',
  description: 'Fetch and extract text from a URL',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to fetch' },
      maxChars: { type: 'number', description: 'Max characters to return' },
    },
    required: ['url'],
  },
  execute: async ({ url, maxChars }) => {
    // Returns: { title, content, truncated? }
  },
};
```

---

## Custom Tool Template

Empty skeleton for domain-specific tools.

```typescript
export const customTool = {
  name: 'my_tool',
  description: 'Description of what this tool does',
  parameters: {
    type: 'object',
    properties: {
      // Add your parameters here
    },
    required: [],
  },
  execute: async (args) => {
    // Implement your tool logic here
    return { result: 'success' };
  },
};
```
