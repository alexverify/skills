import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

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
  execute: async ({ path, content }: { path: string; content: string }) => {
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content, 'utf-8');
      const lines = content.split('\n').length;
      return { success: true, path, lines };
    } catch (err: any) {
      return { error: err.message };
    }
  },
};
