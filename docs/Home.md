# StructLogr wiki

> StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken.

StructLogr is a Laravel 12 + React 19 (Inertia 2.0) app: paste a log, an LLM parses it into a typed JSON document, and (optionally) the result is kept in your per-user history. The main moving parts are the [formatter pipeline](backend/formatter.md), the [history system](backend/history.md), and the [log-format contract](domain/log-format.md) — every page links to the code that backs its claims. Work that is known-broken or missing is tracked in [Tickets](tickets/index.md).

## Spaces

| Space | What is in it |
| --- | --- |
| [Architecture](architecture/index.md) | Runtime shape, request flow, data ownership, sharp edges |
| [Backend](backend/index.md) | API surface, schema, the LLM pipeline, history, logging |
| [Frontend](frontend/index.md) | Pages, hooks, shared Inertia data, keyboard/CSRF handling |
| [Domain](domain/index.md) | The structured-log JSON contract |
| [Archive](archive/index.md) | Historical plans and specs (point-in-time records, not maintained) |
| [Tickets](tickets/index.md) | Open bugs and tasks, evidence attached |

## I want to…

| I want to… | Go to |
| --- | --- |
| run the app locally | [README](../README.md#installation) |
| understand how the system fits together | [Architecture overview](architecture/overview.md) |
| trace what happens when I hit "Format Log" | [How formatting works](backend/formatter.md) |
| find every HTTP route and who can call it | [API surface](backend/api.md) |
| add an endpoint | [API surface › Adding an endpoint](backend/api.md#adding-an-endpoint) |
| configure LLM providers / pick a model | [LLM providers](backend/llm-providers.md) |
| debug a failed format request | [Logging and debugging](backend/logging.md) |
| understand what the formatter output JSON means | [Log format](domain/log-format.md) |
| look up the database tables | [Database schema](backend/schema.md) |
| see everything known-broken | [Ticket board](tickets/index.md) |
| read context behind an old decision | [Archive index](archive/index.md) |
| see what changed recently | [CHANGELOG](CHANGELOG.md) |

## All pages

<!-- wiki:pages:start -->
<!-- wiki:pages:end -->
