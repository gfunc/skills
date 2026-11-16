---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
license: MIT
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/engineering/research
  revision: 49dd158d1076134a641b33efb035946536778336
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Before creating the findings branch or any worktree, have it verify the repo's real mainline (a tracker's configured default branch can be a placeholder) and record the actual baseline commit it finds in the report header.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it. When the question is an enumeration ("which systems consume X"), bound the study set with an independent sweep of the workspace and treat the caller's list as supplemental, not the census.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
