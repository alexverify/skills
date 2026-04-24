# Venice-Specific Features Reference

Venice AI provides unique features not available on other platforms.

---

## Model Diversity

Venice offers 30+ models through a single API:

### Claude Models
- `claude-opus-4-7` — Latest Opus, best for complex tasks
- `claude-opus-4-6` — Previous Opus, very capable
- `claude-sonnet-4-6` — Fast and efficient

### OpenAI Models
- `gpt-5.5` — Latest GPT, strong coding
- `gpt-4o` — Multimodal GPT-4

### Grok Models (with X search)
- `grok-41-fast` — Fast Grok with X/Twitter search
- `grok-4-20-beta` — Latest Grok beta

### Open Source
- `llama-4-maverick-17b-128e-instruct` — Llama 4 with 10M context
- `deepseek-v4-pro` — Best coding benchmarks
- `qwen3-235b-a22b` — Qwen 3 large
- `mistral-large-2411` — Mistral Large

---

## Web Search

Venice models can search the web in real-time.

```typescript
// Enable in config
venice: {
  webSearch: 'auto',  // 'off' | 'auto' | 'on'
  webCitations: true, // Include source URLs
}

// Or via API parameter
venice_parameters: {
  enable_web_search: 'auto',
  enable_web_citations: true,
}
```

**Modes:**
- `off` — No web search
- `auto` — Model decides when to search
- `on` — Always search

---

## X/Twitter Search

Grok models can search X/Twitter in real-time.

```typescript
// Requires a Grok model
model: 'grok-41-fast',
venice: {
  xSearch: true,
}

// Via API
venice_parameters: {
  enable_x_search: true,
}
```

---

## Reasoning Effort

Control how much the model "thinks" before responding.

```typescript
venice: {
  reasoningEffort: 'high', // 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'max'
}

// Via API
venice_parameters: {
  reasoning_effort: 'high',
}
```

Higher effort = more thorough reasoning, higher cost, slower response.

---

## Privacy Modes

Venice offers different privacy levels:

- **Private models** — Zero data retention, your data is never stored
- **Pro models** — Standard models with Venice's privacy protections
- **Uncensored models** — Venice's own models without content filters

Check model capabilities at venice.ai/models.

---

## DIEM Token Integration

DIEM provides permanent access to Venice inference.

**How it works:**
1. Buy DIEM tokens on-chain
2. Each DIEM generates $1/day of inference credits
3. Credits never expire, DIEM can be resold

**Cost tracking:**
```typescript
// Approximate rates (check venice.ai/pricing)
const RATES = {
  'claude-opus': { input: 15, output: 75 }, // per 1M tokens
  'claude-sonnet': { input: 3, output: 15 },
  'gpt-5.5': { input: 5, output: 15 },
  'grok': { input: 2, output: 8 },
  'deepseek': { input: 0.5, output: 2 },
};
```

---

## Image Generation

Venice supports multiple image models:

```typescript
const response = await fetch('https://api.venice.ai/api/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'flux-pro', // or 'dall-e-3', 'stable-diffusion-xl'
    prompt: 'A futuristic city at sunset',
    size: '1024x1024',
  }),
});
```

---

## Text-to-Speech

60+ voices via Kokoro TTS:

```typescript
const response = await fetch('https://api.venice.ai/api/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'kokoro',
    input: 'Hello, world!',
    voice: 'af_sarah', // See docs for all voices
  }),
});
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/v1/chat/completions` | Chat completion (OpenAI-compatible) |
| `/api/v1/models` | List available models |
| `/api/v1/images/generations` | Generate images |
| `/api/v1/audio/speech` | Text-to-speech |
| `/api/v1/audio/transcriptions` | Speech-to-text |
| `/api/v1/embeddings` | Text embeddings |
| `/api/v1/api_keys/self` | Check balance |

Base URL: `https://api.venice.ai`

---

## Rate Limits

Venice has generous rate limits:

- **Free tier:** 100 requests/minute
- **Pro tier:** 1000 requests/minute
- **Enterprise:** Custom limits

Use exponential backoff for 429 errors.
