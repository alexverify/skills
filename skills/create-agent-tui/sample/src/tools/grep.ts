import { readFile } from 'fs/promises';
import { glob } from 'glob';

export const grepTool = {
  name: 'grep',
  description: 'Search for a pattern in files',
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Regex pattern to search' },
      path: { type: 'string', description: 'File or glob pattern to search in' },
      cwd: { type: 'string', description: 'Base directory' },
    },
    required: ['pattern', 'path'],
  },
  execute: async ({ pattern, path, cwd }: { pattern: string; path: string; cwd?: string }) => {
    try {
      const regex = new RegExp(pattern, 'gi');
      const files = await glob(path, {
        cwd: cwd || process.cwd(),
        ignore: ['**/node_modules/**', '**/.git/**'],
        nodir: true,
        absolute: true,
      });

      const results: Array<{ file: string; line: number; content: string }> = [];

      for (const file of files.slice(0, 100)) { // Limit to 100 files
        try {
          const content = await readFile(file, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((lineContent, i) => {
            if (regex.test(lineContent)) {
              results.push({
                file: file.replace(process.cwd() + '/', ''),
                line: i + 1,
                content: lineContent.trim().slice(0, 200),
              });
            }
          });
        } catch {
          // Skip unreadable files
        }
      }

      return { matches: results.slice(0, 50), total: results.length };
    } catch (err: any) {
      return { error: err.message };
    }
  },
};
