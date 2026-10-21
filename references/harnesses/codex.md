# Harness: codex

Codex CLI, plugin-native through the portable root manifest; subagents as TOML files outside the plugin; no built-in scheduler.

## Subagents

Custom agents are standalone TOML files, one agent per file, at `$CODEX_HOME/agents/*.toml` (user) or `.codex/agents/*.toml` (project); built-ins are `default`, `worker`, and `explorer`. Spawning is the harness's subagent mechanism (`spawn_agent`), enabled by default. Model resolution order: the explicit spawn value, then `[agents]` defaults (`default_subagent_model`, `default_subagent_reasoning_effort`), then the parent's; a TOML `model` plus optional `model_reasoning_effort` overrides per agent. Agents inherit the parent's permissions, provider, and MCP servers. Agents are NOT plugin-packaged — the plugin manifest has no agents component — so installing the pack's role agents needs the install step ticket 07 designs (one TOML per role into `$CODEX_HOME/agents/`). Fallback until then: the built-in `worker` and `explorer` agents, or run the steps yourself.

## Models

Pending ticket 09. Known mechanism: per-agent `model` and `model_reasoning_effort` in the TOML, `[agents]` table defaults, and stock slugs from `codex debug models` (`gpt-6.1-sol` and siblings; the local magpie catalog overrides them — never commit that config).

## Transcripts

`$CODEX_HOME/sessions/YYYY/MM/DD/rollout-<timestamp>-<uuid>.jsonl` — append-only envelope `{timestamp, ordinal, type, payload}`; audit `response_item` records (messages, `function_call` / `function_call_output`) and `event_msg` (turn boundaries, token counts). Sessions are not grouped by project, so filter rollouts by the `cwd` in `session_meta` / `turn_context`. `state_5.sqlite` `threads.rollout_path` maps a session id to its file; `thread_history_*.sqlite` is a paged projection, not the source of truth. `codex exec --json` is the stable headless event stream for new captures.

## Scheduler

None built in. Arm the audit tick with an external cron job or a timed shell wait that re-invokes the harness with the tick prompt.

## Forge

gh default; glab when the remote is GitLab.

## UI driver

playwright-cli (skills/playwright-cli).

## Store

`.scratch/<feature-slug>/` in the target repo.

## Capabilities

- HAS: a real plugin system (root portable `plugin.json` with the agent-plugins `$schema`, or `.codex-plugin/plugin.json` as the compatibility fallback; skills listed as `plugin:skill`); plugin hooks via `hooks/hooks.json` with a Claude-compatible event schema; `codex exec` headless mode; symlinked skill folders are followed for a skills-only install.
- LACKS: plugin-packaged subagents (an install step is required, ticket 07); a built-in scheduler (external cron); project-grouped transcripts (filter rollouts by `cwd`); automatic hook trust (non-managed hooks need a per-hash `/hooks` review before they run); a plugin-writable `AGENTS.md` channel — it is operator-owned and the installer must not write it.
