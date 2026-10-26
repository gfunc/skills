# Work in this repository

- Agent-facing writing. Before creating or editing skills, agent instructions, or context-pointer documents, read [writing-for-agents](skills/writing-for-agents/SKILL.md). Keep shared rules with their existing owner and link to them by task.
- Harness work. Read the [adapter contract](references/adapters/README.md) and resolved active profile before using host-specific tools. Distinguish the source checkout from an installed plugin. Installation and user configuration are separate explicitly authorized effects.
- Domain terms. Read [GLOSSARY.md](GLOSSARY.md) before changing terminology or recording a domain decision.
- Upstream changes. Follow [the sync discipline](README.md#syncing-upstream) and retain attribution. Vendored pstack paths keep upstream content; harness-adapter hunks and the `.scratch` store convention are the only allowed local diffs. gfunc workflow content lives in `skills/start-dev/`. `vendor-manifest.txt` inventories pstack paths only. Keep Matt Pocock ports' provenance with the skill and leave the upstream pstack mirror unchanged.
- Scratch work. Put all temporary files, logs, fixtures, plans, and worktrees under ignored `.scratch/<task>/`. Keep local runtime state and user settings out of source changes and release archives.
- Distribution checks. For installer, packaging, or harness changes, use [scripts/validate-harnesses](scripts/validate-harnesses). It tests committed HEAD, not uncommitted edits. Report `MANUAL` and `SKIPPED` outcomes as verification limits, not passes.
- Releases. Follow [the release procedure](README.md#releases) for synchronized versions, verification, tags, and GitHub publication.
