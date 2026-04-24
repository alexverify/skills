import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export const listDirTool = {
  name: 'list_dir',
  description: 'List the contents of a directory with file types and sizes',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the directory' },
      showHidden: { type: 'boolean', description: 'Include hidden files (starting with .)' },
    },
    required: ['path'],
  },
  execute: async ({ path, showHidden }: { path: string; showHidden?: boolean }) => {
    try {
      const entries = await readdir(path, { withFileTypes: true });
      
      const results: Array<{
        name: string;
        type: 'file' | 'directory' | 'symlink' | 'other';
        size?: number;
      }> = [];

      for (const entry of entries) {
        if (!showHidden && entry.name.startsWith('.')) continue;

        let type: 'file' | 'directory' | 'symlink' | 'other';
        let size: number | undefined;

        if (entry.isDirectory()) {
          type = 'directory';
        } else if (entry.isSymbolicLink()) {
          type = 'symlink';
        } else if (entry.isFile()) {
          type = 'file';
          try {
            const stats = await stat(join(path, entry.name));
            size = stats.size;
          } catch {
            // Skip if can't stat
          }
        } else {
          type = 'other';
        }

        results.push({ name: entry.name, type, size });
      }

      // Sort: directories first, then files, alphabetically
      results.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        path,
        count: results.length,
        entries: results,
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') return { error: `Directory not found: ${path}` };
      if (err.code === 'ENOTDIR') return { error: `Not a directory: ${path}` };
      if (err.code === 'EACCES') return { error: `Permission denied: ${path}` };
      return { error: err.message };
    }
  },
};
