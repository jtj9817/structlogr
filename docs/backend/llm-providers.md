# LLM providers

[Home](../Home.md) › [Backend](index.md) › LLM providers

> Which LLM providers StructLogr calls, how each is configured, and how to debug a provider failure.

| | |
| --- | --- |
| **Source** | `app/Services/LogFormatterService.php`, `config/prism.php`, `routes/web.php`, `resources/js/hooks/use-llm-model.ts` |
| **Owner** | backend |
| **Last verified** | 2026-11-16 against `e89b491` |
| **Open tickets** | SLOG-003 |

StructLogr calls LLMs through the [Prism](https://github.com/echolabsdev/prism) PHP package (`vendor/prism-php/`). Structured output is enforced with provider-specific schema formats (see [How formatting works](formatter.md)).

## Supported models

The `llm_model` form field on `POST /format` is validated against a fixed list (`routes/web.php:8` → `LogFormatterController.php:27`), and the frontend model picker is a separate hardcoded list in `resources/js/hooks/use-llm-model.ts:53-62`. The two lists must stay in sync — there is no shared constant.

| `llm_model` value | Prism provider | Upstream model | Response format |
| --- | --- | --- | --- |
| `deepseek-chat` (default) | DeepSeek | `deepseek-chat` | `response_format: { type: 'json_object' }` |
| `gemini-2.5-flash` | Gemini | `gemini-2.5-flash` | `responseMimeType: application/json` + `responseSchema` |
| `kimi-k2-turbo-preview` | OpenRouter | `moonshotai/kimi-k2` | `json_schema` (name `formatted_log`, no `strict`) |
| `GLM-4.5-Air` | OpenRouter | `z-ai/glm-4.5-air` | `json_schema` with `strict: true`, `thinking` disabled |
| `GLM-4.6` | OpenRouter | `z-ai/glm-4.6` | `json_schema` with `strict: true`, `thinking` disabled |

All providers are called with `temperature: 0.0`, `max_tokens: 8192`, HTTP timeout 600s, connect timeout 60s (`LogFormatterService.php:64-84`). The default when the field is omitted is `deepseek-chat` (`LogFormatterService.php:21`). The frontend stores the last choice in `localStorage` key `llm-model-preference` (`use-llm-model.ts:4`).

## Configuration

Provider credentials come from `config/prism.php`, which reads environment variables:

| Provider | Env vars | Default URL |
| --- | --- | --- |
| DeepSeek | `DEEPSEEK_API_KEY` | `https://api.deepseek.com/v1` (`DEEPSEEK_URL` overrides) |
| Gemini | `GEMINI_API_KEY` | `https://generativelanguage.googleapis.com/v1beta/models` |
| OpenRouter (Kimi, GLM) | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1` (`OPENROUTER_URL` overrides) |

`config/prism.php` also defines providers StructLogr does not use (`openai`, `anthropic`, `ollama`, `mistral`, `groq`, `xai`, `elevenlabs`, `voyageai`) — Prism's stock config, none of which are wired into `LogFormatterService`.

**HTTP timeouts are not env-configurable.** The code reads `config('services.http.timeout', 600)` and `config('services.http.connect_timeout', 60)` (`LogFormatterService.php:68-69, 81-82`), but `config/services.php` has no `http` key, so the fallback values 600s / 60s always apply. Setting `HTTP_TIMEOUT` in `.env` has no effect. Tracked in SLOG-003.

## Provider notes

### DeepSeek (default)

No schema is sent to the provider — DeepSeek is asked for `json_object` output and the schema is enforced only by the post-response validation (`validateStructuredOutput()`). The system prompt gets an extra "Return ONLY valid JSON" suffix for `deepseek-chat` only (`LogFormatterService.php:263-267`).

### Gemini

The Prism schema is converted to Gemini's format (`convertSchemaToGeminiFormat()`, `LogFormatterService.php:492`): uppercase type names (`OBJECT`, `STRING`, `NUMBER`, `ARRAY`), `nullable` fields, and `propertyOrdering` arrays for every object schema. DeepSeek-style `json_object` mode is not used.

### Kimi K2 (via OpenRouter)

The frontend alias `kimi-k2-turbo-preview` maps to upstream model `moonshotai/kimi-k2` (`LogFormatterService.php:305-318`) — the alias name does not match the upstream model id. Schema is sent as standard JSON Schema (`convertSchemaToJsonSchema()`) inside `json_schema`, without `strict`.

### GLM models (via OpenRouter)

Aliases `GLM-4.5-Air` / `GLM-4.6` are mapped to `z-ai/glm-4.5-air` / `z-ai/glm-4.6` by `mapGLMModelId()` (`LogFormatterService.php:872-879`). The upstream request adds `strict: true` in the JSON Schema and disables the thinking/reasoning mode (`thinking: { type: 'disabled' }`).

## Retry behaviour

Transient failures (`PrismException` and any other `Exception`) are retried with exponential backoff inside `format()`: up to `maxRetries` attempts (default 3), sleeping `pow(2, attempt)` seconds between attempts (2s, 4s), then the exception is rethrown and the controller surfaces a generic error to the user (`LogFormatterService.php:152-208`). There is no provider-level fallback — a failed request does not roll over to another provider.

## Troubleshooting

Logs live in `storage/logs/laravel.log` by default (`LOG_CHANNEL=stack`, `LOG_STACK=single`). See [Logging and debugging](logging.md) for the lifecycle log statements and debugging workflows.

| Symptom (in log) | Likely cause | Fix |
| --- | --- | --- |
| `[PrismException] Structured output attempt N failed … 401` | Wrong/missing API key for the configured provider | Check `DEEPSEEK_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` in `.env` |
| `Validation failed: Missing detected_log_type` / `Missing or invalid results_summary` / `Missing summary.status or summary.headline` | Provider returned output that does not match the schema (most likely with DeepSeek, which receives no schema) | Retry; or switch to Gemini/GLM, which receive the schema in the request |
| `[Exception] Structured output attempt N failed … cURL error 28: Timeout` | Request exceeded the 600s LLM HTTP timeout | Reduce `raw_log` size, or switch provider |
| `Empty response from API` (`LogFormatterService.php:100`) | Provider returned no structured payload | Check provider status, API key quota, and `max_tokens` (8192) consumption of very large inputs |
| `[PrismException] … 429` | Provider rate limit | Reduce request rate, upgrade the API plan, or switch provider |
| `CRITICAL: Exceeded retry loop` | Logic error in the retry loop; should not happen | Treat as a bug; check `LogFormatterService.php:32-209` |

## Choosing a provider

Qualitative guidance only — this repository contains no benchmark data:

- **General use / low friction**: DeepSeek (`deepseek-chat`) — default; no schema sent, parse quality depends on prompt discipline.
- **Schema enforcement, fast**: Gemini (`gemini-2.5-flash`) — schema sent as `responseSchema`, which usually produces valid output on the first attempt.
- **Strictest schema compliance**: GLM-4.6 or GLM-4.5-Air — `strict: true` JSON Schema via OpenRouter.
- **Complex, long logs**: Kimi K2 via OpenRouter — large context window, schema sent as JSON Schema without `strict`.

## Adding a new provider

1. Add credentials to `config/prism.php` under `providers` and document the env vars.
2. Add a `configureXyz()` method in `LogFormatterService.php` (see `configureGLM` for the OpenRouter + JSON Schema pattern).
3. Extend the `match` in `format()` (`LogFormatterService.php:53-60`), the `llm_model` validation `in:` list (`LogFormatterController.php:27`), and the frontend `LLMModel` union + `validModels` (`resources/js/types/preferences.ts`, `resources/js/hooks/use-llm-model.ts:53-62`).
4. If the provider needs a non-standard schema shape, add a `convertSchemaToXyzFormat()` method.

## Related

- [How formatting works](formatter.md) — the pipeline these providers sit inside
- [Logging and debugging](logging.md) — tracing a single formatting request end to end
- [Archive index](../archive/index.md) — historical point-in-time documents, including the original provider guide references

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [StructLogr wiki](../Home.md) | StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken. |
| [Architecture overview](../architecture/overview.md) | The runtime shape of StructLogr — components, the format request flow, who owns what data, and how it deploys. |
| [How formatting works](formatter.md) | What happens between pasting a log and seeing structured JSON — schema, prompt, provider call, validation, retry, persistence. |
| [Logging and debugging](logging.md) | How StructLogr logs the formatting pipeline — levels, lifecycle statements, where logs live, and how to debug a failing format request. |
| [Log format](../domain/log-format.md) | The structured-JSON contract between the LLM, the database, and the UI — and what is actually enforced where. |
<!-- wiki:backlinks:end -->
