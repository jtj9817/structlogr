# Database schema

[Home](../Home.md) › [Backend](index.md) › Database schema

> Tables, columns, indexes and access patterns — what persists each request and what doesn't.

| | |
| --- | --- |
| **Source** | `database/migrations/*.php`, `app/Models/User.php`, `app/Models/FormattedLog.php` |
| **Owner** | backend |
| **Last verified** | 2026-11-16 against `e89b491` |

Default connection is `DB_CONNECTION` (`config/database.php:19`), which `.env.example` sets to MySQL 8; tests use SQLite `:memory:` (`phpunit.xml`, `.env.testing`).

## Application tables

### `users`

Stock Laravel users (`id`, `name`, `email` unique, hashed `password`, `email_verified_at`, `remember_token`, timestamps) plus:

| Column | Type | From |
| --- | --- | --- |
| `two_factor_secret` / `two_factor_recovery_codes` / `two_factor_confirmed_at` | text/text/datetime, nullable | `2025_08_26_100418_add_two_factor_columns_to_users_table.php` |
| `preferences` | `json` nullable | `2025_10_23_201613_add_preferences_to_users_table.php` |

`users.preferences` (`#userspreferences`) is a JSON blob read through the model accessor, which merges stored values over defaults (`app/Models/User.php:61-85`). Defaults:

```json
{ "outputFormat": "json", "jsonIndentation": 2, "autoCopyResults": false,
  "showLineNumbers": true, "saveToHistory": true, "anonymousAnalytics": true,
  "avoidSensitiveStorage": false, "fontSize": "medium", "reduceAnimations": false,
  "customApiEndpoint": "", "apiKey": "", "timeoutSeconds": 30 }
```

Empty string/null in the column → all defaults; partial blobs are merged key-by-key. Writes go through `setPreferencesAttribute()`, which re-encodes arrays.

The `avoidSensitiveStorage` / `saveToHistory` preferences are **not enforced** by the formatter path — `POST /format` saves whenever the user is authenticated (`LogFormatterService.php:211-236`).

### `formatted_logs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint pk | |
| `user_id` | FK → `users`, nullable, `cascadeOnDelete` | added `2025_10_20`; rows exist only for authed users in practice |
| `raw_log` | `text` | the input, verbatim |
| `formatted_log` | `json` | the structured output (cast to array), minus the internal `title` key |
| `title` | `varchar(255)` nullable, **indexed** | added `2025_10_22`; LLM-generated or fallback `"{Type} - {STATUS}"`, truncated to 47 chars + `...` (`LogFormatterService.php:109-130`) |
| `summary` | `varchar(255)` nullable | `results_summary.test_suite`, or `ucfirst(detected_log_type).' - '.results_summary.status` |
| `detected_log_type` | `varchar(128)` nullable | e.g. `test_runner`, `application_error`, `http_access` |
| `field_count` | `unsignedInteger` default 0 | top-level key count of the structured output |
| `is_saved` | `boolean` default false | bookmark flag for history |
| `deleted_at` | `timestamp` nullable | `SoftDeletes` — rows persist after "clear" |
| `created_at` / `updated_at` | timestamps | |

Indexes: `(user_id, created_at)` named `formatted_logs_user_created_at_index`, plus the single-column `title` index. No full-text index exists — search is `LIKE %term%` (`HistoryService.php:88-103`).

Relationships: `FormattedLog::belongsTo(User)`, `User::hasMany(FormattedLog)`. Queries that must respect the owner use the `forUser` scope.

## Laravel infrastructure tables

`sessions` (id, user_id, ip_address, …), `password_reset_tokens`, `cache` / `cache_locks`, `jobs` / `job_batches` / `failed_jobs` — created by the stock migrations. Nothing in `app/` dispatches jobs or reads the cache tables; they exist for Laravel's defaults (`SESSION_DRIVER` falls back to `database` in `config/session.php`, and this migration set is what that driver needs).

## Related

- [API surface](api.md) — endpoints that read/write these tables
- [History](history.md) — how history queries these columns
- [Domain: log format](../domain/log-format.md) — the shape of `formatted_log`

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
