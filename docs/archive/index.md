# Archive

[Home](../Home.md) › Archive

> Historical planning documents for the UI/UX overhaul and feature work, October 2025 — kept for reference, no longer maintained.

These pages describe plans and specs whose work has shipped. They are records of decisions
made at a point in time, not descriptions of the current system — for the current state see
the [Architecture overview](../architecture/overview.md) and the [Backend](../backend/index.md)
and [Frontend](../frontend/index.md) spaces. Where a claim here contradicts the code, the code
wins (one known example: the "full-text search using `MATCH ... AGAINST`" claim in the archived
search docs and in `docs/CHANGELOG.md`; the implementation has always used `LIKE` substring
matching — see [History](../backend/history.md)).

Do not add new documents here; this space exists so the wiki's link checker can keep the
historical pages honest.

| Document | What it was |
| --- | --- |
| [Development Plan: Log Formatting Web Application](StructLogr_Implementation_Plan.md) | Original build plan; all phases completed 2025-10-15 |
| [Phase Dependencies and Implementation Prompts](Phase_Dependencies_and_Prompts.md) | Dependency map and prompts for the UI/UX overhaul phases |
| [Architecture Overview](architecture-overview.md) | Point-in-time architecture; superseded by [architecture/overview.md](../architecture/overview.md) |
| [Technical Constraints](Technical_Constraints.md) | Mandatory UI/UX implementation constraints |
| [Design System Planning](Design_System_Planning.md) | Design system fundamentals; implemented |
| [UI/UX Improvement Suggestions](UI_UX_Improvements.md) | Improvement catalogue for formatter, history and settings |
| [UI/UX Implementation Plan](UI_UX_Implementation_Plan.md) | Step-by-step UI/UX execution plan; executed |
| [Keyboard Shortcuts Fix Plan](Keyboard_Shortcuts_Fix_Plan.md) | Fix plan for keyboard shortcut gaps; executed |
| [Keyboard Shortcuts Implementation Prompts](Keyboard_Shortcuts_Implementation_Prompts.md) | Prompt scripts for the shortcut fix phases |
| [Search Button Implementation Plan](search-button-implementation-plan.md) | Phase 1 plan for the header search button |
| [Search Feature Specification](search-feature-spec.md) | Phase 1 spec for the history search contract |
| [History Feature Documentation](history-feature.md) | Build-time history system documentation; superseded by [backend/history.md](../backend/history.md) |
| [History Entry Title Field](history-title-field-implementation.md) | Plan for the history title column; completed 2025-10-23 |
| [Settings Backend Implementation Plan](settings-backend-implementation-plan.md) | Plan for backend-persisted preferences; completed 2025-10-27 |

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
