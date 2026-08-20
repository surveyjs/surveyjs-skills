# Providers, environment, and privacy

## The three built-in providers

All import from the subpath, and every factory has the signature
`(model?: string, options?: Record<string, unknown>) => LLMProvider`:

```ts
import { openai, anthropic, ollama } from "ai-form-response-extractor/providers";

openai("gpt-4o");            // default model: "gpt-4o"
anthropic("claude-sonnet-4-6"); // default model: "claude-sonnet-4-6"; options.maxTokens (default 16384)
ollama("llama-3.2-vision");  // default model: "llama-3.2-vision"
```

Pick a **vision-capable** model — the provider sends the document as image or document
content, and a text-only model cannot read it. Model ids are passed through verbatim;
check the provider's current model list rather than trusting remembered names.

| | OpenAI | Anthropic | Ollama |
| :-- | :-- | :-- | :-- |
| SDK to install | `openai` | `@anthropic-ai/sdk` | none (plain HTTP) |
| Auth / endpoint env var | `OPENAI_API_KEY` | `ANTHROPIC_API_KEY` | `OLLAMA_BASE_URL` (default `http://localhost:11434`) |
| Image input (PNG/JPEG/WebP/GIF) | Yes | Yes | Yes |
| Native PDF input | Yes — sent as a file via the Responses API | Yes — sent as a `document` content block | **No — throws.** Convert PDF pages to images first |
| Where the document is processed | OpenAI's API | Anthropic's API | Your own infrastructure |

The SDKs are imported dynamically at call time; a missing SDK or env var throws a
descriptive error naming the fix. API keys are read **only** from environment variables —
the factories deliberately take no key parameter, so never work around that by embedding a
key in code, committed config, or logs.

## Privacy and data residency — a decision point

A filled-in form is personal data: names, health details, signatures, whatever the form
asked. State plainly in any answer:

- With `openai(...)` or `anthropic(...)`, **the document image and everything written on it
  is transmitted to that third-party API**. Whether that is acceptable depends on the
  user's data-processing agreements, consent, and the provider's retention terms — check
  them; do not assume.
- With `ollama(...)`, processing stays on infrastructure the user runs, at the cost of
  running a local vision model whose accuracy depends on the model chosen and no native PDF
  input.
- URL inputs are fetched by *your server* and re-sent as base64 — the LLM provider never
  fetches the URL itself.

Provider choice alone is **not** compliance. Local processing does not create GDPR or HIPAA
compliance by itself — storage of the original scans, access control, retention, and audit
remain the application's responsibility. Never claim a workflow "is compliant" because it
uses Ollama; say it "keeps document processing within your infrastructure" instead.

## Custom providers

`provider` accepts any object implementing `LLMProvider`, so an unsupported backend (Azure
OpenAI, a gateway, a mock for tests) is a small adapter:

```ts
import type { LLMProvider } from "ai-form-response-extractor";

const myProvider: LLMProvider = {
  name: "my-gateway",
  model: "some-vision-model",
  async extractFromImage({ image, prompt, systemPrompt }) {
    // send to your backend; image is ImageInput (Buffer/Uint8Array/string or array)
    return { content: jsonText /* , truncated?, usage? */ };
  },
};
```

Return the model's text in `content`; set `truncated: true` when the response hit a token
limit so the pipeline retries with a stricter prompt. A mock provider that returns canned
JSON is also the right way to unit-test extraction flows without paid API calls.
