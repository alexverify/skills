# create-venice-agent-tui

> Like `create-react-app` but for terminal agents — scaffolds a complete agent TUI in TypeScript using Venice AI.

![Venice Agent TUI](./sample/screenshots/banner.png)

## What It Does

A skill for AI coding agents (Claude Code, Cursor, Codex, etc.) that scaffolds a complete agent TUI in TypeScript. Tell your coding agent what kind of agent you want, and it generates a runnable project that:

- Works with **any Venice model** (Claude, GPT-5.5, Grok, Llama, DeepSeek, Mistral)
- Provides a **fully customizable terminal interface** with streaming output
- Includes **file operations, shell, grep, glob** tools out of the box
- Supports **web search and X/Twitter search** via Venice's built-in capabilities
- Tracks **token usage and session persistence**
- Respects Venice's **privacy-first, zero-retention** inference

## Quick Start

### Try the sample:

```bash
cd sample
npm install
VENICE_API_KEY=vn_your_key npm start
```

### Or tell your coding agent:

> "Build me an agent TUI that can read/write files and run shell commands"

It will use this skill automatically.

## Features

### 🎨 Customizable UI
- **Input styles:** block (background box), bordered (line frame), plain (simple prompt)
- **Tool displays:** grouped (tree output), emoji (per-call markers), minimal (one-liners)
- **Loaders:** spinner, gradient shimmer, trailing dots

### 🛠️ Built-in Tools
- File read/write/edit with diff validation
- Shell command execution with timeout
- Glob file finding
- Grep content search
- Custom tool templates

### 🔍 Venice-Specific
- Web search with citations
- X/Twitter search (Grok models)
- Reasoning effort control
- DIEM cost tracking
- Balance awareness

### 📊 Session Management
- JSONL conversation persistence
- Token usage tracking
- Multi-turn conversations
- Slash commands (`/model`, `/new`, `/help`)

## Model Aliases

Quick shortcuts for common models:

```
opus     → claude-opus-4-6
opus-4.7 → claude-opus-4-7
sonnet   → claude-sonnet-4-6
gpt5     → gpt-5.5
grok     → grok-41-fast
deepseek → deepseek-v4-pro
llama    → llama-4-maverick-17b-128e-instruct
qwen     → qwen3-235b-a22b
mistral  → mistral-large-2411
```

Use with `/model grok` or `npm start -- --model=deepseek`.

## Why Venice?

1. **Privacy** — Zero data retention on private models
2. **Model diversity** — 30+ models in one API
3. **Built-in search** — Web and X search without extra API keys
4. **DIEM economics** — Pay-as-you-go credits that can be resold
5. **Uncensored options** — Models that work for legitimate use cases others refuse

## License

MIT

---

*Built for the Venice AI ecosystem. Get your API key at [venice.ai/settings/api](https://venice.ai/settings/api).*
