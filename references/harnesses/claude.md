# Harness: claude

Claude Code, plugin-native install with namespaced skills; subagents as Markdown profiles with sonnet/opus/haiku model aliases; `/loop` scheduler.

## Subagents

The `Agent` tool spawns subagents defined as Markdown files with YAML frontmatter; plugin `agents/` at the plugin root loads and is namespaced under the plugin name at the lowest precedence (project `.claude/agents/` and user `~/.claude/agents/` override it). The `model` frontmatter field is the role→model mechanism: `sonnet`, `opus`, `haiku`, or `inherit` (the default). Subagents cannot spawn other subagents, and a subagent does not inherit the parent's skills unless the spawn injects them. Fallback: the pack's `agents/*.md` frontmatter is not Claude-shaped (`is_background` should be `background`, `generalPurpose` should be `general-purpose` — ticket 09 rewrites these); unknown keys are ignored, so the agents still load and run in the foreground.

## Models

The port of the kimi role table, written for the subagent `model` frontmatter in aliases only — full IDs pass `claude plugin validate` but runtime resolution is unproven until the Docker rig says otherwise (research 01). One line per role; proposed defaults, edit freely:

```text
# proposed defaults, edit freely. Values are the subagent `model` frontmatter alias.
# `inherit` = run on the parent model (omit the field) — the port of kimi's `primary`.
feature, refactoring: sonnet
bug-fix: sonnet
hardest tasks: inherit
judgment and prose: opus
swarm workers: haiku
audit and second opinion: opus   # deliberately not the implementation model — a second opinion must differ
```

Host caveat: this machine's `~/.claude/settings.json` pins a gateway model (`bi-dev/group/auto-kimi-k3[1m]`) that reports `[claude-code:unrecognized_model]` and unknown-cost budgets headlessly, so validate the table in Docker against standard Anthropic auth before trusting a local run.

## Transcripts

`~/.claude/projects/<project>/<session-id>.jsonl`, one line per message, tool use, or metadata entry; subagent transcripts at `~/.claude/projects/<project>/<sessionId>/subagents/agent-<agentId>.jsonl` — one file per subagent, independent of the main conversation and unaffected by its compaction. `<project>` is the workspace path with every non-alphanumeric character replaced by `-` (over 200 chars: truncated plus a path hash). The entry schema is internal and changes between versions, so audits must tolerate unknown entry types: key off `type` and the `uuid`/`parentUuid` chain. Observed vocabulary in 2.1.296: `user` and `assistant` messages (`message.content[]` blocks: `thinking`/`text`/`tool_use`; a tool result is a `user` entry whose `content[]` carries `{type:"tool_result", tool_use_id}` — correlate `tool_use.id` ↔ `tool_result.tool_use_id`); `attachment` (hook output `hook_success`/`hook_additional_context`, `skill_listing`, model/environment/budget metadata); `queue-operation`; `system` (e.g. `compact_boundary`); `last-prompt` (`leafUuid` points at the current leaf); `cost-state` (`modelUsage`, `hasUnknownModelCost`). The resolved model is `assistant.message.model`; per-message tokens are `assistant.message.usage`. `attachment.skill_listing` is the audit surface for "did the pack's skills load". Retention: `cleanupPeriodDays` (default 30), `claude purge`, `--no-session-persistence` for `-p` runs; `-p` sessions are excluded from the picker but resumable by id, and `--resume` accepts an absolute transcript path. `CLAUDE_CONFIG_DIR` relocates the whole tree; `CLAUDE_CODE_PROJECT_DIR_NAME` names the project dir (set with it). `~/.claude/transcripts/ses_*.jsonl` is a legacy store — real sessions, but the flat `{type: user|tool_use|tool_result, timestamp, content/tool_name/tool_input/tool_output}` schema records no model, no uuid chain, and no session grouping by project; audit it only when no current-format file exists.

## Scheduler

`/loop`, built into Claude Code; it carries the `/loop 1h` audit tick natively.

## Forge

gh default; glab when the remote is GitLab.

## UI driver

playwright-cli (skills/playwright-cli).

## Store

`.scratch/<feature-slug>/` in the target repo.

## Capabilities

- HAS: a real plugin system (`.claude-plugin/plugin.json`, optional `marketplace.json`; zero-install via `--plugin-dir`); skills namespaced `/gfunc-skills:<skill>`; Markdown subagents with model aliases; plugin hooks via `hooks/hooks.json`; headless `claude -p --output-format stream-json`; documented trail-audit mechanics for the projects/ JSONL (uuid/parentUuid correlation, subagent trails at `<sessionId>/subagents/`, observed entry vocabulary, ticket 09).
- LACKS: a stable transcript schema (write version-tolerant audit parsers); per-agent full model IDs (aliases only, pending the rig); subagent-of-subagent spawning (deep orchestration nests at one level — the root spawns verifiers); the pack's `agents/*.md` frontmatter as shipped (ticket 09).
