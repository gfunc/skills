# Harness: claude

Claude Code, plugin-native install with namespaced skills; subagents as Markdown profiles with sonnet/opus/haiku model aliases; `/loop` scheduler.

## Subagents

The `Agent` tool spawns subagents defined as Markdown files with YAML frontmatter; plugin `agents/` at the plugin root loads and is namespaced under the plugin name at the lowest precedence (project `.claude/agents/` and user `~/.claude/agents/` override it). The `model` frontmatter field is the role→model mechanism: `sonnet`, `opus`, `haiku`, or `inherit` (the default). Subagents cannot spawn other subagents, and a subagent does not inherit the parent's skills unless the spawn injects them. Fallback: the pack's `agents/*.md` frontmatter is not Claude-shaped (`is_background` should be `background`, `generalPurpose` should be `general-purpose` — ticket 09 rewrites these); unknown keys are ignored, so the agents still load and run in the foreground.

## Models

Pending ticket 09. Known mechanism: the three aliases `sonnet` / `opus` / `haiku` plus `inherit` (run on the parent model, omit the subagent `model`). Full model IDs pass `claude plugin validate` but runtime resolution is unproven; write the table in aliases until the Docker rig proves otherwise.

## Transcripts

`~/.claude/projects/<project>/<session-id>.jsonl`, one line per message, tool use, or metadata entry; subagent transcripts at `~/.claude/projects/<project>/<sessionId>/subagents/agent-<agentId>.jsonl`. `<project>` is the workspace path with every non-alphanumeric character replaced by `-`. The entry schema is internal and changes between versions — audits must tolerate drift (key off `type`, the `uuid`/`parentUuid` chain, and `message.content[]` blocks; `attachment` entries carry hook and skill-listing events). Treat `~/.claude/transcripts/ses_*.jsonl` as a legacy store, not the current format. `CLAUDE_CONFIG_DIR` relocates the whole tree.

## Scheduler

`/loop`, built into Claude Code; it carries the `/loop 1h` audit tick natively.

## Forge

gh default; glab when the remote is GitLab.

## UI driver

playwright-cli (skills/playwright-cli).

## Store

`.scratch/<feature-slug>/` in the target repo.

## Capabilities

- HAS: a real plugin system (`.claude-plugin/plugin.json`, optional `marketplace.json`; zero-install via `--plugin-dir`); skills namespaced `/gfunc-skills:<skill>`; Markdown subagents with model aliases; plugin hooks via `hooks/hooks.json`; headless `claude -p --output-format stream-json`.
- LACKS: a stable transcript schema (write version-tolerant audit parsers); per-agent full model IDs (aliases only, pending the rig); subagent-of-subagent spawning (deep orchestration nests at one level — the root spawns verifiers); the pack's `agents/*.md` frontmatter as shipped (ticket 09).
