# Harness: codex

Codex CLI, plugin-native through the portable root manifest; subagents as TOML files outside the plugin; no built-in scheduler.

## Subagents

Custom agents are standalone TOML files, one agent per file, at `$CODEX_HOME/agents/*.toml` (user) or `.codex/agents/*.toml` (project); built-ins are `default`, `worker`, and `explorer`. Spawning is the harness's subagent mechanism (`spawn_agent`), enabled by default. Model resolution order: the explicit spawn value, then `[agents]` defaults (`default_subagent_model`, `default_subagent_reasoning_effort`), then the parent's; a TOML `model` plus optional `model_reasoning_effort` overrides per agent. Agents inherit the parent's permissions, provider, and MCP servers. Agents are NOT plugin-packaged — the plugin manifest has no agents component — so installing the pack's role agents needs the install step ticket 07 designs (one TOML per role into `$CODEX_HOME/agents/`). Fallback until then: the built-in `worker` and `explorer` agents, or run the steps yourself.

## Models

The port of the kimi role table lands as one TOML file per role in `$CODEX_HOME/agents/` (the ticket-07 install step): each role binds two fields, `model` + `model_reasoning_effort`. Stock 0.163.0 slugs, from `codex debug models` against an empty `CODEX_HOME` (availability depends on account): `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-luna`, `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`. Proposed defaults, edit freely:

```text
# proposed defaults, edit freely. Per-role TOML fields: model + model_reasoning_effort.
feature, refactoring: model = "gpt-6.1-sol", model_reasoning_effort = "medium"
bug-fix: model = "gpt-6.1-sol", model_reasoning_effort = "medium"
hardest tasks: omit model (spawn falls through [agents] defaults to the parent's — the port of kimi's `primary`)
judgment and prose: model = "gpt-6.1-sol", model_reasoning_effort = "high"
swarm workers: model = "gpt-6-luna", model_reasoning_effort = "low"
audit and second opinion: model = "gpt-6-sol", model_reasoning_effort = "high"   # deliberately not the implementation slug
```

Local magpie note: this machine's codex is magpie-configured (`model_provider = "magpie"`, `model = "bi-dev/group/auto-kimi-k3"` in `~/.codex/config.toml`), so magpie aliases resolve locally against `~/.codex/magpie-models.json` (29 `bi-dev/...` slugs: `bi-dev/kimi-code-cn/k3-256k`, `bi-dev/uco/gpt-6.1-sol`, …) and real local sessions record the resolved id (e.g. `bi-dev/kimi-code-cn/k3`) — never commit that config. Set `model_reasoning_effort` explicitly when the chosen model does not support the inherited effort (docs).

## Transcripts

`$CODEX_HOME/sessions/YYYY/MM/DD/rollout-<timestamp>-<uuid>.jsonl` — append-only envelope `{timestamp, ordinal, type, payload}`; `ordinal` plus the payload ids are the correlation keys. Record vocabulary (observed 0.163.0): `session_meta` (session id, cwd, CLI version, provider, git metadata — one per file), `turn_context` (turn id, `model`, reasoning effort, approval/sandbox policy), `world_state` (the loaded `AGENTS.md` text — reconstruct which instructions were active), `response_item` (the conversation: `message`, `reasoning`, `function_call` / `function_call_output` — pair a call with its output by position/`call_id` and count tool calls by `function_call.name`), `event_msg` (turn boundaries `task_started`/`task_complete`, per-item `item_completed`, `token_count`), and `token_usage_record`. Sessions are not grouped by project, so filter rollouts by the `cwd` in `session_meta` — or resolve a session id to its file through `state_5.sqlite` `threads.rollout_path` (columns also carry cwd, model, `reasoning_effort`). `thread_history_*.sqlite` is a paged projection with rollout byte offsets, not the source of truth. Subagent trails: hook input exposes `agent_transcript_path` alongside `transcript_path`, but no local rollout with subagent activity exists to confirm the on-disk layout — verify in the rig before auditing one. `codex exec --json` is the stable headless event stream for new captures (`item.*` events); `codex exec --ephemeral` writes no rollout. The hook-facing transcript format is explicitly not stable — version-tolerant parsers, same rule as Claude.

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
