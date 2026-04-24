import { fileReadTool } from './file-read.js';
import { fileWriteTool } from './file-write.js';
import { fileEditTool } from './file-edit.js';
import { shellTool } from './shell.js';
import { globTool } from './glob.js';
import { grepTool } from './grep.js';
import { listDirTool } from './list-dir.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: any) => Promise<unknown>;
}

export const tools: ToolDefinition[] = [
  fileReadTool,
  fileWriteTool,
  fileEditTool,
  shellTool,
  globTool,
  grepTool,
  listDirTool,
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
