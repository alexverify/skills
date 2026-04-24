import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const shellTool = {
  name: 'shell',
  description: 'Execute a shell command and return the output',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to execute' },
      cwd: { type: 'string', description: 'Working directory' },
      timeout: { type: 'number', description: 'Timeout in ms (default 30000)' },
    },
    required: ['command'],
  },
  execute: async ({ command, cwd, timeout }: { command: string; cwd?: string; timeout?: number }) => {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: timeout || 30000,
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (err: any) {
      return {
        stdout: err.stdout?.trim() || '',
        stderr: err.stderr?.trim() || err.message,
        exitCode: err.code || 1,
        error: err.message,
      };
    }
  },
};
