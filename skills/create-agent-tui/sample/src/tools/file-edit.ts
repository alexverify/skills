import { readFile, writeFile } from 'fs/promises';

export const fileEditTool = {
  name: 'file_edit',
  description: 'Edit a file by replacing exact text. The oldText must match exactly (including whitespace).',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file to edit' },
      oldText: { type: 'string', description: 'Exact text to find and replace (must match exactly)' },
      newText: { type: 'string', description: 'New text to replace the old text with' },
    },
    required: ['path', 'oldText', 'newText'],
  },
  execute: async ({ path, oldText, newText }: { path: string; oldText: string; newText: string }) => {
    try {
      const content = await readFile(path, 'utf-8');
      
      if (!content.includes(oldText)) {
        // Try to find similar text for helpful error
        const lines = content.split('\n');
        const oldLines = oldText.split('\n');
        const firstOldLine = oldLines[0].trim();
        
        let hint = '';
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(firstOldLine.slice(0, 20))) {
            hint = `\nPossible match at line ${i + 1}: "${lines[i].slice(0, 60)}..."`;
            break;
          }
        }
        
        return { 
          error: `oldText not found in file. Make sure it matches exactly including whitespace.${hint}`,
          fileLength: content.length,
          oldTextLength: oldText.length,
        };
      }

      const occurrences = content.split(oldText).length - 1;
      if (occurrences > 1) {
        return {
          error: `oldText found ${occurrences} times. Please provide more specific text to ensure a unique match.`,
          occurrences,
        };
      }

      const newContent = content.replace(oldText, newText);
      await writeFile(path, newContent, 'utf-8');

      // Generate a simple diff preview
      const oldLines = oldText.split('\n');
      const newLines = newText.split('\n');
      const diffPreview = [
        ...oldLines.slice(0, 3).map(l => `- ${l}`),
        ...(oldLines.length > 3 ? [`  ... (${oldLines.length - 3} more lines removed)`] : []),
        ...newLines.slice(0, 3).map(l => `+ ${l}`),
        ...(newLines.length > 3 ? [`  ... (${newLines.length - 3} more lines added)`] : []),
      ].join('\n');

      return {
        success: true,
        path,
        linesRemoved: oldLines.length,
        linesAdded: newLines.length,
        diffPreview,
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') return { error: `File not found: ${path}` };
      if (err.code === 'EACCES') return { error: `Permission denied: ${path}` };
      return { error: err.message };
    }
  },
};
