import { glob as globFn } from 'glob';

export const globTool = {
  name: 'glob',
  description: 'Find files matching a glob pattern',
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.ts)' },
      cwd: { type: 'string', description: 'Base directory' },
      ignore: { type: 'array', items: { type: 'string' }, description: 'Patterns to ignore' },
    },
    required: ['pattern'],
  },
  execute: async ({ pattern, cwd, ignore }: { pattern: string; cwd?: string; ignore?: string[] }) => {
    try {
      const files = await globFn(pattern, {
        cwd: cwd || process.cwd(),
        ignore: ignore || ['**/node_modules/**', '**/.git/**'],
        nodir: true,
      });
      return { files, count: files.length };
    } catch (err: any) {
      return { error: err.message };
    }
  },
};
