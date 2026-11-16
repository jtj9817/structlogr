# Domain

[Home](../Home.md) › Domain

> The one business concept this project has — what a "formatted log" is.

StructLogr has no domain logic beyond the log-format contract: one JSON document describing a
log, produced by an LLM under schema enforcement. That contract is documented in
[Log format](log-format.md).

<!-- wiki:pages:start -->
| Page | Summary |
| --- | --- |
| [Log format](log-format.md) | The structured-JSON contract between the LLM, the database, and the UI — and what is actually enforced where. |
<!-- wiki:pages:end -->

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [StructLogr wiki](../Home.md) | StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken. |
| [Architecture](../architecture/index.md) | How StructLogr's pieces fit together — runtime shape, request flow, data ownership, and the sharp edges. |
| [Backend](../backend/index.md) | The HTTP surface, services, persistence and debugging story of the Laravel backend. |
| [Log format](log-format.md) | The structured-JSON contract between the LLM, the database, and the UI — and what is actually enforced where. |
<!-- wiki:backlinks:end -->
