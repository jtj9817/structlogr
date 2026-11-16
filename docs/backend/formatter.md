# How formatting works

[Home](../Home.md) › [Backend](index.md) › How formatting works

> What happens between pasting a log and seeing structured JSON — schema, prompt, provider call, validation, retry, persistence.

| | |
| --- | --- |
| **Source** | `app/Services/LogFormatterService.php`, `app/Http/Controllers/LogFormatterController.php` |
| **Owner** | backend |
| **Last verified** | 2026-11-16 against `e89b491` |

Single entry point: `LogFormatterService::format(string $rawLog, ?string $llmModel = null, ?array $preferences = null, int $maxRetries = 3): array{structured: array, title: string}`.

## The pipeline

1. **Pick the provider.** `llm_model` (default `deepseek-chat`) maps to a Prism provider configuration via `match()` (`LogFormatterService.php:53-60`). Unsupported aliases throw `InvalidArgumentException` → controller renders `llm_model` error.
2. **Build the schema.** `getSchema()` (`:609`) — a Prism `ObjectSchema` with enum `detected_log_type` (`test_runner`, `application_error`, `http_access`, `build_pipeline`, `database`, `security_event`, `system_metrics`, `general`), a required `results_summary` object (`status`, `headline`, plus test counts / failure arrays), and sections for failed/passed tests, errors, HTTP requests, and build steps. The full contract is documented in [Log format](../domain/log-format.md).
3. **Build the prompt.** `getSystemPrompt()` (`:238`) — fixed system prompt instructing flat JSON output and verbatim preservation of messages/stack traces; `deepseek-chat` additionally gets "Return ONLY valid JSON" appended.
4. **Call the provider** through Prism `structured()` with `temperature: 0.0`, `max_tokens: 8192`, `timeout: 600`, `connect_timeout: 60` (config fallback — env-inert, see [LLM providers](llm-providers.md#configuration)).
5. **Validate the response.** `validateStructuredOutput()` requires `detected_log_type`, a `results_summary` array, and `results_summary.status`. Anything else passes.
6. **Extract the title.** From `structured.title` (≥5 chars) else `results_summary.test_suite` truncated to 47 chars + `...`, else `Untitled Log Entry` (`:109-130`). The `title` key is then **removed** from the structured array before storage/redirect.
7. **Apply preferences** (only those sent with the request): `parseTimestamps` rewrites `results_summary.timestamp`, `errors[].timestamp`, `http_requests[].timestamp` to `ISO8601 | Unix | Custom` in `UTC | Local` (`:774-834`); `normalizeLogLevels` uppercases levels (`:835`). `includeMetadata` is accepted by the validator but unused.
8. **Retry on any failure** (`PrismException` or other) up to 3 attempts with exponential backoff `pow(2, $attempt)` seconds (2s, 4s), then rethrow → controller renders `raw_log` error "Failed to format log…".
9. **Persist.** `saveLog()` creates a `FormattedLog` row for authenticated users only; guests get the flash output but no history row (`:213-215`).

The controller (`LogFormatterController::format`) validates `raw_log` as required string, then PRG-redirects home with `formattedLog` + `success` flash.

## Output schema hazards

- DeepSeek receives **no schema** — it works through prompt discipline + post-hoc validation. Gemini and GLM/Kimi receive the schema in the request.
- Validation is minimal by design (3 checks). Downstream code must tolerate missing `sections`, `entities`, `metrics`, etc.
- `field_count` stored on the row is the top-level key count of the *post-title-removal* array.

## Debugging

Every step logs (`=== START ===`, per-attempt, `SUCCESS`/`FAILED`/`CRITICAL`). See [Logging and debugging](logging.md) and [LLM providers](llm-providers.md#troubleshooting). A quick failure triage: grep `local.ERROR\|local.CRITICAL` in `storage/logs/laravel.log`.

## Related

- [LLM providers](llm-providers.md) — per-provider configuration and upstream model mapping
- [Log format](../domain/log-format.md) — the structured JSON contract
- [API surface](api.md#public-routes) — `POST /format` request/response

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [StructLogr wiki](../Home.md) | StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken. |
| [Architecture overview](../architecture/overview.md) | The runtime shape of StructLogr — components, the format request flow, who owns what data, and how it deploys. |
| [LLM providers](llm-providers.md) | Which LLM providers StructLogr calls, how each is configured, and how to debug a provider failure. |
| [Log format](../domain/log-format.md) | The structured-JSON contract between the LLM, the database, and the UI — and what is actually enforced where. |
<!-- wiki:backlinks:end -->
