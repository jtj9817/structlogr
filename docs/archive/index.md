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
| [UI/UX Improvement Suggestions](UI_UX_Improvements.md) | Improvement catalogue for formatter, history and settings; most items never shipped |
| [UI/UX Implementation Plan](UI_UX_Implementation_Plan.md) | Execution plan for the UI/UX overhaul; only the subset of components that exists landed |
| [Keyboard Shortcuts Fix Plan](Keyboard_Shortcuts_Fix_Plan.md) | Fix plan for keyboard shortcut gaps; the planned behaviour ships, details differ |
| [Keyboard Shortcuts Implementation Prompts](Keyboard_Shortcuts_Implementation_Prompts.md) | Prompt scripts for the shortcut fix phases |

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
