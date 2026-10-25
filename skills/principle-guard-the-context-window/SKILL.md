---
name: principle-guard-the-context-window
description: "Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads."
disable-model-invocation: true
---

# Guard the Context Window

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern:**
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.
- **Count the resend.** Every step resends the full context, so input tokens dominate a long run. A poll is a step; at a 600K context, 100 polls is roughly 60M input tokens.
- **Keep the model and effort stable for a run.** Switching either invalidates the prompt cache and repays the whole context at full price.
- **Route bulk to children.** Bulk reads and diff review go to subagents; decision-relevant reads stay in the parent.
