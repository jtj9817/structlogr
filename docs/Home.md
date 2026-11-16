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
### Architecture

| Page | Summary |
| --- | --- |
| [Architecture](architecture/index.md) | How StructLogr's pieces fit together — runtime shape, request flow, data ownership, and the sharp edges. |
| [Architecture overview](architecture/overview.md) | The runtime shape of StructLogr — components, the format request flow, who owns what data, and how it deploys. |

### Archive

| Page | Summary |
| --- | --- |
| [Archive](archive/index.md) | Historical planning documents for the UI/UX overhaul and feature work, October 2025 — kept for reference, no longer maintained. |
| [Design System Planning](archive/Design_System_Planning.md) | Planning guidelines for the StructLogr design system, written before the UI/UX work began; the work is done. |
| [Keyboard Shortcuts Implementation Fix Plan](archive/Keyboard_Shortcuts_Fix_Plan.md) | Fix plan for the gaps found in the keyboard shortcuts implementation; plan executed. |
| [Keyboard Shortcuts Implementation Prompts](archive/Keyboard_Shortcuts_Implementation_Prompts.md) | Prompt scripts used to drive the keyboard shortcuts fix phases. |
| [Phase Dependencies and Implementation Prompts](archive/Phase_Dependencies_and_Prompts.md) | Phase dependency map and ready-to-use implementation prompts for the UI/UX overhaul. |
| [Development Plan: Log Formatting Web Application](archive/StructLogr_Implementation_Plan.md) | Original solo-developer build plan for StructLogr; all phases completed as of October 2025. |
| [Technical Constraints](archive/Technical_Constraints.md) | UI/UX implementation constraints and mandatory requirements recorded before the redesign. |
| [StructLogr UI/UX Implementation Plan](archive/UI_UX_Implementation_Plan.md) | Step-by-step implementation plan for the UI/UX overhaul; executed. |
| [UI/UX Improvement Suggestions for StructLogr](archive/UI_UX_Improvements.md) | Catalogue of UI/UX improvement suggestions for the formatter, history and settings surfaces. |
| [Architecture Overview](archive/architecture-overview.md) | Point-in-time architecture description from the initial build; contains outdated claims — superseded by ../architecture/overview.md. |
| [History Feature Documentation](archive/history-feature.md) | Build-time documentation of the history system as implemented in October 2025; superseded by ../backend/history.md. |
| [Implementation Plan: History Entry Title Field](archive/history-title-field-implementation.md) | Plan for adding the title column to history entries; completed 2025-10-23. |
| [Search Button Implementation Plan](archive/search-button-implementation-plan.md) | Phase 1 plan for the header search button; feature shipped. |
| [Search Button Phase 1 Specification](archive/search-feature-spec.md) | Phase 1 spec for the history search contract (query, scope, limit); feature shipped. |
| [Settings Backend Implementation Plan](archive/settings-backend-implementation-plan.md) | Plan for backend-persisted user preferences; completed 2025-10-27. |

### Backend

| Page | Summary |
| --- | --- |
| [Backend](backend/index.md) | The HTTP surface, services, persistence and debugging story of the Laravel backend. |
| [API surface](backend/api.md) | Every HTTP route in the app — who can call it, what it takes, what it returns. |
| [How formatting works](backend/formatter.md) | What happens between pasting a log and seeing structured JSON — schema, prompt, provider call, validation, retry, persistence. |
| [History](backend/history.md) | How formatted logs are stored, listed, searched, bookmarked, exported and cleared — and why search behaves the way it does. |
| [LLM providers](backend/llm-providers.md) | Which LLM providers StructLogr calls, how each is configured, and how to debug a provider failure. |
| [Logging and debugging](backend/logging.md) | How StructLogr logs the formatting pipeline — levels, lifecycle statements, where logs live, and how to debug a failing format request. |
| [Database schema](backend/schema.md) | Tables, columns, indexes and access patterns — what persists each request and what doesn't. |

### Domain

| Page | Summary |
| --- | --- |
| [Domain](domain/index.md) | The one business concept this project has — what a "formatted log" is. |
| [Log format](domain/log-format.md) | The structured-JSON contract between the LLM, the database, and the UI — and what is actually enforced where. |

### Frontend

| Page | Summary |
| --- | --- |
| [Frontend](frontend/index.md) | The React 19 + Inertia single-page UI — pages, hooks, shared data, and how it talks to the backend. |
| [Frontend overview](frontend/overview.md) | How the React/Inertia UI is organized — pages, data flow, hooks, keyboard shortcuts, and CSRF handling. |

[Ticket board](tickets/index.md) — 7 open of 7 tickets.
<!-- wiki:pages:end -->
