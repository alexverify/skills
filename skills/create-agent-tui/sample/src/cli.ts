#!/usr/bin/env node
import { createInterface } from 'readline';
import { parseArgs } from 'util';
import { loadConfig, MODEL_ALIASES, type AgentConfig } from './config.js';
import { runAgentWithRetry, type AgentEvent } from './agent.js';
import { SessionManager } from './session.js';
import { ToolRenderer, type ToolDisplayStyle } from './renderer.js';
import { Loader, type LoaderStyle } from './loader.js';
import { printBanner, printTextBanner, printVeniceBanner } from './banner.js';
import { detectBg, getDefaultInputBg } from './terminal-bg.js';
import type { ChatMessage } from './venice-client.js';

// ANSI codes
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const GRAY = '\x1b[90m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function parseCliArgs() {
  try {
    const { values } = parseArgs({
      options: {
        model: { type: 'string', short: 'm' },
        banner: { type: 'string', short: 'b' },
        input: { type: 'string', short: 'i' },
        'tool-display': { type: 'string', short: 't' },
        loader: { type: 'string', short: 'l' },
        'loader-text': { type: 'string' },
        'web-search': { type: 'string' },
        'x-search': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    });
    return values;
  } catch {
    return {};
  }
}

function showHelp() {
  console.log(`
${BOLD}Venice Agent TUI${RESET}

${BOLD}Usage:${RESET}
  npm start -- [options]

${BOLD}Options:${RESET}
  -m, --model <name>        Model name or alias (opus, sonnet, grok, deepseek, llama)
  -b, --banner <name>       Project name for ASCII banner (or "venice" for logo)
  -i, --input <style>       Input style: block, bordered, plain
  -t, --tool-display <style> Tool display: grouped, emoji, minimal, hidden
  -l, --loader <style>      Loader animation: spinner, gradient, minimal
      --loader-text <text>  Custom loader text (default: "Thinking")
      --web-search <mode>   Web search: off, auto, on
      --x-search            Enable X/Twitter search (Grok models only)
  -h, --help                Show this help

${BOLD}Model Aliases:${RESET}
${Object.entries(MODEL_ALIASES).map(([alias, full]) => `  ${CYAN}${alias.padEnd(12)}${RESET}${DIM}${full}${RESET}`).join('\n')}

${BOLD}Slash Commands:${RESET}
  /model [name]   Switch model or list aliases
  /new            Start fresh conversation
  /export         Export session as Markdown
  /session        Show session info
  /help           Show commands
  /exit           Quit

${BOLD}Examples:${RESET}
  npm start -- --model grok --banner "My Agent" --tool-display emoji
  npm start -- -m deepseek --web-search auto
`);
}

async function main() {
  const args = parseCliArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Build config from CLI args
  const configOverrides: Partial<AgentConfig> = {};
  
  if (args.model) {
    configOverrides.model = args.model;
  }
  
  if (args.input) {
    configOverrides.display = {
      ...configOverrides.display,
      inputStyle: args.input as 'block' | 'bordered' | 'plain',
    } as any;
  }
  
  if (args['tool-display']) {
    configOverrides.display = {
      ...configOverrides.display,
      toolDisplay: args['tool-display'] as ToolDisplayStyle,
    } as any;
  }

  if (args.loader || args['loader-text']) {
    configOverrides.display = {
      ...configOverrides.display,
      loader: {
        style: (args.loader as LoaderStyle) || 'spinner',
        text: args['loader-text'] || 'Thinking',
      },
    } as any;
  }

  if (args['web-search']) {
    configOverrides.venice = {
      ...configOverrides.venice,
      webSearch: args['web-search'] as 'off' | 'auto' | 'on',
    } as any;
  }

  if (args['x-search']) {
    configOverrides.venice = {
      ...configOverrides.venice,
      xSearch: true,
    } as any;
  }

  const config = loadConfig(configOverrides);
  
  // Initialize session
  const session = new SessionManager(config.sessionDir);
  await session.init();

  // Initialize renderer
  const renderer = new ToolRenderer(config.display.toolDisplay);

  // Detect terminal background for block input style
  const inputBg = config.display.inputStyle === 'block' 
    ? await detectBg() 
    : getDefaultInputBg();

  // Print banner
  if (args.banner === 'venice') {
    printVeniceBanner(config.model);
  } else if (args.banner) {
    printBanner(args.banner, config.model);
  } else {
    printTextBanner('Venice Agent', config.model);
  }

  console.log(`  ${DIM}Session: ${session.getSessionId()}${RESET}`);
  console.log(`  ${DIM}/help for commands${RESET}\n`);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${GREEN}›${RESET} `,
  });

  const messages: ChatMessage[] = [];

  const handleInput = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    // Handle slash commands
    if (trimmed.startsWith('/')) {
      const [cmd, ...cmdArgs] = trimmed.slice(1).split(' ');
      
      if (cmd === 'exit' || cmd === 'quit') {
        console.log(`\n${DIM}Goodbye!${RESET}\n`);
        process.exit(0);
      }
      
      if (cmd === 'help') {
        console.log(`\n${BOLD}Commands:${RESET}`);
        console.log(`  ${CYAN}/model [name]${RESET}  Switch model (e.g., opus, sonnet, grok, deepseek)`);
        console.log(`  ${CYAN}/new${RESET}           Start fresh conversation`);
        console.log(`  ${CYAN}/export${RESET}        Export session as Markdown`);
        console.log(`  ${CYAN}/session${RESET}       Show session info`);
        console.log(`  ${CYAN}/help${RESET}          Show this help`);
        console.log(`  ${CYAN}/exit${RESET}          Quit\n`);
        rl.prompt();
        return;
      }
      
      if (cmd === 'model') {
        const newModel = cmdArgs[0];
        if (!newModel) {
          console.log(`\n${BOLD}Current model:${RESET} ${CYAN}${config.model}${RESET}\n`);
          console.log(`${BOLD}Available aliases:${RESET}`);
          for (const [alias, full] of Object.entries(MODEL_ALIASES)) {
            const current = config.model === full ? ` ${GREEN}←${RESET}` : '';
            console.log(`  ${CYAN}${alias.padEnd(12)}${RESET}${DIM}${full}${RESET}${current}`);
          }
          console.log(`\n${DIM}Or use any Venice model ID directly${RESET}\n`);
        } else {
          config.model = MODEL_ALIASES[newModel] || newModel;
          console.log(`\n${GREEN}✓${RESET} Switched to ${CYAN}${config.model}${RESET}\n`);
        }
        rl.prompt();
        return;
      }
      
      if (cmd === 'new') {
        messages.length = 0;
        renderer.reset();
        console.log(`\n${GREEN}✓${RESET} Started new conversation\n`);
        rl.prompt();
        return;
      }

      if (cmd === 'export') {
        const md = await session.exportMarkdown();
        const filename = `${session.getSessionId()}.md`;
        const fs = await import('fs/promises');
        await fs.writeFile(filename, md);
        console.log(`\n${GREEN}✓${RESET} Exported to ${CYAN}${filename}${RESET}\n`);
        rl.prompt();
        return;
      }

      if (cmd === 'session') {
        console.log(`\n${BOLD}Session Info:${RESET}`);
        console.log(`  ${DIM}ID:${RESET} ${session.getSessionId()}`);
        console.log(`  ${DIM}File:${RESET} ${session.getSessionFile()}`);
        console.log(`  ${DIM}Messages:${RESET} ${messages.length}`);
        console.log(`  ${DIM}Model:${RESET} ${config.model}\n`);
        rl.prompt();
        return;
      }
      
      console.log(`${YELLOW}Unknown command: /${cmd}${RESET}\n`);
      rl.prompt();
      return;
    }

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    messages.push(userMessage);
    await session.appendMessage(userMessage);
    console.log();

    // Start loader
    const loader = new Loader(config.display.loader);
    loader.start();
    let hasOutput = false;
    renderer.reset();

    try {
      const result = await runAgentWithRetry(config, messages, {
        onEvent: (event) => {
          if (event.type === 'text') {
            if (!hasOutput) {
              loader.stop();
              hasOutput = true;
            }
            process.stdout.write(event.delta);
          } else if (event.type === 'tool_call') {
            if (!hasOutput) {
              loader.stop();
              hasOutput = true;
            }
            renderer.onToolCall(event);
            session.appendToolCall(event.name, event.callId, event.args);
          } else if (event.type === 'tool_result') {
            renderer.onToolResult(event);
            session.appendToolResult(event.name, event.callId, event.output, 0);
          } else if (event.type === 'done' && event.usage) {
            if (!hasOutput) loader.stop();
            renderer.flushMinimal();
            console.log(`\n\n${DIM}tokens: ${formatTokens(event.usage.prompt)} in → ${formatTokens(event.usage.completion)} out${RESET}\n`);
          }
        },
      });

      // Update messages with full conversation
      messages.length = 0;
      messages.push(...result.messages.filter(m => m.role !== 'system'));
      
      // Log assistant response
      if (result.text) {
        await session.appendMessage({ role: 'assistant', content: result.text });
      }
      
    } catch (err: any) {
      loader.stop();
      console.error(`\n${RED}Error: ${err.message}${RESET}\n`);
    }

    rl.prompt();
  };

  rl.on('line', handleInput);
  rl.on('close', () => {
    console.log(`\n${DIM}Goodbye!${RESET}\n`);
    process.exit(0);
  });

  rl.prompt();
}

main().catch(err => {
  console.error(`${RED}Fatal: ${err.message}${RESET}`);
  process.exit(1);
});
