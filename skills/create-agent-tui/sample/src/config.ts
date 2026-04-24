import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface DisplayConfig {
  toolDisplay: 'emoji' | 'grouped' | 'minimal' | 'hidden';
  reasoning: boolean;
  inputStyle: 'block' | 'bordered' | 'plain';
  loader: { style: 'spinner' | 'gradient' | 'minimal'; text: string };
}

export interface VeniceConfig {
  webSearch: 'off' | 'auto' | 'on';
  webCitations: boolean;
  xSearch: boolean;
  reasoningEffort: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'max';
}

export interface AgentConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTurns: number;
  maxTokens: number;
  sessionDir: string;
  showBanner: boolean;
  display: DisplayConfig;
  venice: VeniceConfig;
  slashCommands: boolean;
}

export const MODEL_ALIASES: Record<string, string> = {
  'opus': 'claude-opus-4-6',
  'opus-4.7': 'claude-opus-4-7',
  'sonnet': 'claude-sonnet-4-6',
  'gpt5': 'gpt-5.5',
  'grok': 'grok-41-fast',
  'deepseek': 'deepseek-v4-pro',
  'llama': 'llama-4-maverick-17b-128e-instruct',
  'qwen': 'qwen3-235b-a22b',
  'mistral': 'mistral-large-2411',
};

const DEFAULTS: AgentConfig = {
  apiKey: '',
  model: 'claude-opus-4-6',
  systemPrompt: [
    'You are a coding assistant with access to tools for reading, writing, editing, and searching files, and running shell commands.',
    '',
    'Current working directory: {cwd}',
    '',
    'Guidelines:',
    '- Use your tools proactively to explore and understand the codebase.',
    '- Keep working until the task is fully resolved before responding.',
    '- Do not guess — use tools to verify information.',
    '- Be concise and direct in responses.',
    '- Prefer grep and glob over shell commands for file search.',
    '- Make minimal, targeted edits consistent with existing style.',
  ].join('\n'),
  maxTurns: 20,
  maxTokens: 16000,
  sessionDir: '.sessions',
  showBanner: true,
  display: {
    toolDisplay: 'grouped',
    reasoning: false,
    inputStyle: 'block',
    loader: { style: 'spinner', text: 'Thinking' },
  },
  venice: {
    webSearch: 'off',
    webCitations: false,
    xSearch: false,
    reasoningEffort: 'medium',
  },
  slashCommands: true,
};

export function loadConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  let config = { ...DEFAULTS };

  const configPath = resolve('agent.config.json');
  if (existsSync(configPath)) {
    const file = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (file.display) config.display = { ...config.display, ...file.display };
    if (file.venice) config.venice = { ...config.venice, ...file.venice };
    config = { ...config, ...file };
  }

  if (process.env.VENICE_API_KEY) config.apiKey = process.env.VENICE_API_KEY;
  if (process.env.AGENT_MODEL) config.model = process.env.AGENT_MODEL;
  if (process.env.AGENT_MAX_TURNS) config.maxTurns = Number(process.env.AGENT_MAX_TURNS);
  if (process.env.AGENT_MAX_TOKENS) config.maxTokens = Number(process.env.AGENT_MAX_TOKENS);

  if (MODEL_ALIASES[config.model]) {
    config.model = MODEL_ALIASES[config.model];
  }

  config = { ...config, ...overrides };
  if (!config.apiKey) throw new Error('VENICE_API_KEY is required. Get one at venice.ai/settings/api');
  return config;
}
