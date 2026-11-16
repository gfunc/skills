---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Have it verify the repo's real mainline before starting the investigation. A tracker's configured default branch can be a placeholder. If the caller uses a findings branch or worktree, create it only after that check. Put the actual baseline commit in the report header when writing the report.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it. When the question is an enumeration ("which systems consume X"), bound the study set with an independent sweep of the workspace and treat the caller's list as supplemental, not the census.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
