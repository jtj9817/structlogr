---
key: SLOG-005
title: raw_log_preview written to application logs at INFO
type: Bug
status: Open
priority: Medium
component: backend
labels: [privacy, security]
assignee: Unassigned
reporter: Claude
created: 2026-11-16
updated: 2026-11-16
parent:
blocks: []
blocked_by: []
relates_to: [SLOG-004]
---

# SLOG-005: raw_log_preview written to application logs at INFO

[Home](../Home.md) › [Tickets](index.md) › SLOG-005

## Summary

Every format request logs the first 200 characters of the user's raw log to the default log channel at `INFO`. User logs routinely contain credentials, tokens, IPs and other personal data, so this replicates sensitive content into `storage/logs/laravel.log` on every call — including for guests.

## Description

`app/Services/LogFormatterService.php:24-30`:

```php
\Log::info('=== LogFormatterService::format() START ===', [
    'llm_model' => $llmModel,
    'preferences' => $preferences,
    'max_retries' => $maxRetries,
    'raw_log_length' => strlen($rawLog),
    'raw_log_preview' => substr($rawLog, 0, 200),
]);
```

Default channel is `stack` → `single` (`config/logging.php`), so the preview lands unredacted in `storage/logs/laravel.log`. The same request also sends the raw log to an external LLM provider — that part is a documented product decision — but logging it locally is an additional, unconsented copy with none of the "avoid sensitive storage" controls the preferences UI offers (`avoidSensitiveStorage` is stored but never enforced anywhere; see [Schema](../backend/schema.md#userspreferences)).

## Findings

### 1. Sensitive content duplicated into local logs at INFO

- **Severity:** P2
- **Files:**
  - `app/Services/LogFormatterService.php:24-30`

#### Expected Behavior

Logs include metadata only (model, length, attempt) — no raw input content — or content is truncated/redacted and gated behind `config('app.debug')`.

## Acceptance Criteria

- [ ] `raw_log_preview` is removed from the `INFO` log (or replaced by a hash/length), or only emitted at `debug` when `app.debug` is true
- [ ] `storage/logs/laravel.log` no longer contains raw log content after a formatting request
- [ ] Existing logging docs (`docs/backend/logging.md`) updated to match

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
