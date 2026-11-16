# Log format

[Home](../Home.md) › [Domain](index.md) › Log format

> The structured-JSON contract between the LLM, the database, and the UI — and what is actually enforced where.

| | |
| --- | --- |
| **Source** | `app/Services/LogFormatterService.php` (`getSchema()`, `validateStructuredOutput()`), `app/Models/FormattedLog.php` |
| **Owner** | domain |
| **Last verified** | 2026-11-16 against `e89b491` |

## The contract (as enforced by `getSchema()`, `LogFormatterService.php:609`)

Root object `formatted_log` — required: `detected_log_type`, `title`, `results_summary`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `detected_log_type` | enum | ✔ | `test_runner` · `application_error` · `http_access` · `build_pipeline` · `database` · `security_event` · `system_metrics` · `general` |
| `title` | string 5–50 chars | ✔ | Concise title; **extracted to the `formatted_logs.title` column and removed from the stored JSON** |
| `results_summary` | object | ✔ | `status` (enum `PASS`·`FAIL`·`ERROR`·`WARN`·`INFO`, required), plus nullable `test_suite`, `total`, `passed`, `failed`, `assertions`, `duration`, `timestamp` |
| `failed_tests[]` | object[] | — | `test_case` + `status` required; nullable `duration`; embedded `failure_details` object (`failure_type`, `message` required; nullable `location`, `test_file_location`) |
| `passed_tests[]` | object[] | — | `test_case` + `status` required; nullable `duration` |
| `errors[]` | object[] | — | `error_type` + `message` required; nullable `file`, `line`, `stack_trace`, `timestamp` |
| `http_requests[]` | object[] | — | `method`, `path`, `status_code` required; nullable `duration`, `timestamp`, `ip` |
| `build_steps[]` | object[] | — | `step_name`, `status` required; nullable `duration`, `error_message` |

## What is actually enforced

- **Schema** is sent to Gemini, Kimi (JSON Schema, not strict), and both GLM models (`strict: true`). **DeepSeek receives no schema** — prompt discipline only.
- **Post-response validation** checks exactly three things (`validateStructuredOutput()`): `detected_log_type` present; `results_summary` an array; `results_summary.status` present. Everything else in the contract is advisory — consumers must tolerate partial output.
- **Storage**: `formatted_log` column stores the JSON minus `title`; `title`, `summary` (from `results_summary.test_suite` or `{Type} - {STATUS}`), `detected_log_type` and `field_count` are denormalized onto the row (`saveLog()`). `field_count` = top-level key count.
- **Preferences** that reshape the document at format time: `parseTimestamps` (+`dateFormat` ISO8601/Unix/Custom, `timezone` UTC/Local) rewrites `results_summary.timestamp`, `errors[].timestamp`, `http_requests[].timestamp`; `normalizeLogLevels` uppercases level strings. Both are off unless sent with the request.

## Consumption

The output pane in `FormatterPage.tsx` renders the JSON verbatim (a `<pre>` block); there is no dedicated tree renderer or download-as-file button yet. History cards show `title`, `summary`, `preview` (120-char squished prefix of `raw_log`), `detectedLogType`, `fieldCount`, `isSaved`.

## Common misconception

Old example output in the README showing top-level `summary` / `entities` / `metrics` / `sections` arrays **does not match the schema above** — those keys are not produced by `getSchema()`. The README example has been corrected to this contract.

## Related

- [How formatting works](../backend/formatter.md) — where the contract is built and validated
- [Database schema](../backend/schema.md#formatted_logs) — where the document is stored
- [LLM providers](../backend/llm-providers.md) — who receives the schema and how

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
