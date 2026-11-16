# Backend

[Home](../Home.md) › Backend

> The HTTP surface, services, persistence and debugging story of the Laravel backend.

Covers everything PHP: routes and controllers, the database schema, the formatting pipeline,
history storage and search, and operational logging. Business rules for what a *formatted log*
is live in [Domain](../domain/index.md); the UI that consumes these endpoints lives in
[Frontend](../frontend/index.md).

<!-- wiki:pages:start -->
| Page | Summary |
| --- | --- |
| [API surface](api.md) | Every HTTP route in the app — who can call it, what it takes, what it returns. |
| [How formatting works](formatter.md) | What happens between pasting a log and seeing structured JSON — schema, prompt, provider call, validation, retry, persistence. |
| [History](history.md) | How formatted logs are stored, listed, searched, bookmarked, exported and cleared — and why search behaves the way it does. |
| [LLM providers](llm-providers.md) | Which LLM providers StructLogr calls, how each is configured, and how to debug a provider failure. |
| [Logging and debugging](logging.md) | How StructLogr logs the formatting pipeline — levels, lifecycle statements, where logs live, and how to debug a failing format request. |
| [Database schema](schema.md) | Tables, columns, indexes and access patterns — what persists each request and what doesn't. |
<!-- wiki:pages:end -->

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [StructLogr wiki](../Home.md) | StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken. |
| [Architecture](../architecture/index.md) | How StructLogr's pieces fit together — runtime shape, request flow, data ownership, and the sharp edges. |
| [Architecture overview](../architecture/overview.md) | The runtime shape of StructLogr — components, the format request flow, who owns what data, and how it deploys. |
| [Archive](../archive/index.md) | Historical planning documents for the UI/UX overhaul and feature work, October 2025 — kept for reference, no longer maintained. |
| [API surface](api.md) | Every HTTP route in the app — who can call it, what it takes, what it returns. |
| [How formatting works](formatter.md) | What happens between pasting a log and seeing structured JSON — schema, prompt, provider call, validation, retry, persistence. |
| [History](history.md) | How formatted logs are stored, listed, searched, bookmarked, exported and cleared — and why search behaves the way it does. |
| [LLM providers](llm-providers.md) | Which LLM providers StructLogr calls, how each is configured, and how to debug a provider failure. |
| [Logging and debugging](logging.md) | How StructLogr logs the formatting pipeline — levels, lifecycle statements, where logs live, and how to debug a failing format request. |
| [Database schema](schema.md) | Tables, columns, indexes and access patterns — what persists each request and what doesn't. |
<!-- wiki:backlinks:end -->
