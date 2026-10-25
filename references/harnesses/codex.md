# Harness: codex

Codex CLI: plugin-native through the portable root manifest, subagents as standalone TOML agents, and no built-in scheduler.

## Subagents

- **Spawn tool and arguments:** `spawn_agent`, with multi-agent tools enabled by default. A spawn takes the task prompt and an agent selection; built-ins are `default`, `worker`, and `explorer`. An explicit per-spawn model is documented as the highest-precedence input, but its structured argument schema is unverified on 0.163.0, so pass a model choice through a custom agent TOML or the `[agents]` defaults.
- **Parallel spawn:** yes. Independent `spawn_agent` calls run concurrently under the multi-agent tools.
- **Fresh child inherits parent context:** no. A child starts from its task prompt; the parent passes the profile path, role-prompt path, and inputs explicitly. Children inherit the parent's provider, permissions, MCP servers, and sandbox, and cannot override `model_provider`, `sandbox_mode`, or `mcp_servers`.

Custom agents are standalone TOML files, one per file, at `$CODEX_HOME/agents/*.toml` (user) or `.codex/agents/*.toml` (project), and require `name`, `description`, and `developer_instructions`. The pack does not plugin-package agents; the installer copies `codex-agents/*.toml` into `$CODEX_HOME/agents/`.

## Models

- **Main-model configuration:** `~/.codex/config.toml` (`model`, `model_provider`, optional `model_catalog_json`); `--model` or `-c model=...` for one run; profiles `~/.codex/<name>.config.toml` via `--profile`.
- **Availability gate:** the model string must be offered by the selected provider, account, and workspace. Custom or gateway providers can supply a catalog through `model_catalog_json` at startup or `model_catalog_url` at the provider level; a profile can override `model_catalog_json`. Project config cannot set `model_provider`.
- **Subagent model mechanism:** `[agents].default_subagent_model` and `default_subagent_reasoning_effort` set the default; a custom agent TOML `model` plus optional `model_reasoning_effort` overrides per agent; an explicit spawn request takes precedence. Otherwise the child inherits the parent's model.
- **Per-spawn model parameter:** partial. The docs describe an explicit spawn request as the highest-precedence input but do not publish the `spawn_agent` schema on 0.163.0; a skill can request a model in prose, not pass a verified structured argument.
- **Inheritance token:** omitted — no `inherit` or `primary` token is documented; an absent model runs on the parent's.
- **Operator binding:** role intent lives in `~/.agents/pstack-models.md`, a skill-read convention that no harness auto-loads and that cannot make a model available. Native binding: `~/.codex/config.toml`, `~/.codex/<name>.config.toml` profiles, and `~/.codex/agents/*.toml`.

## Transcripts

- **Transcript root:** `$CODEX_HOME/sessions/YYYY/MM/DD/rollout-<timestamp>-<uuid>.jsonl`; sessions are not grouped by project, so filter rollouts by the `cwd` in `session_meta` or resolve a session id through `state_5.sqlite` `threads.rollout_path`.
- **Relocation variable:** `CODEX_HOME` relocates the config and session tree (default `~/.codex`).

Append-only envelope `{timestamp, ordinal, type, payload}`; `ordinal` plus the payload ids are the correlation keys. Record vocabulary (observed 0.163.0): `session_meta` (session id, cwd, CLI version, provider, git metadata — one per file), `turn_context` (turn id, `model`, reasoning effort, approval/sandbox policy), `world_state` (the loaded `AGENTS.md` text — reconstruct which instructions were active), `response_item` (the conversation: `message`, `reasoning`, `function_call` / `function_call_output` — pair a call with its output by position/`call_id` and count tool calls by `function_call.name`), `event_msg` (turn boundaries `task_started`/`task_complete`, per-item `item_completed`, `token_count`), and `token_usage_record`. The `state_5.sqlite` `threads` table also carries cwd, model, and `reasoning_effort`; `thread_history_*.sqlite` is a paged projection with rollout byte offsets, not the source of truth. The on-disk subagent trail layout is unconfirmed; verify it before auditing one. `codex exec --json` is the stable headless event stream for new captures (`item.*` events); `codex exec --ephemeral` writes no rollout. The hook-facing transcript format is explicitly not stable — version-tolerant parsers, same rule as Claude.

## Scheduler

- **Scheduler:** none built in. Arm a timed prompt with an external cron job or a timed shell wait that re-invokes the harness.
- **No native goal mode.** `spawn_agent` calls run concurrently, but nothing carries a predicate across turns; use an external cron or a checked plan for that.

## Forge

- **Forge CLI:** `gh` by default; `glab` when the remote is GitLab.

## UI Driver

- **UI driver:** `playwright-cli` (`skills/playwright-cli`).

## Store

- **Store path:** `.scratch/<feature-slug>/` in the target repo.

## Optional Runtimes

- **Optional runtimes:** bun (the `poteto-mode` skill's bundled `scripts/orch` bookkeeping; `scripts/watch-pr` is intentionally unused), Playwright (`skills/playwright-cli`), tmux or a PTY for driving CLIs, and any MCP server a workflow names.

None is required by the pack. A missing runtime stops only the step or lane that needs it, with the reason disclosed; harness-neutral work continues. The installer warns when a known optional runtime is absent.

## Capabilities

- **Active harness:** `codex`
- **Version floor:** Codex 0.163.0; older installs reinstall.
- **Structured question:** none documented on 0.163.0; ask in chat with numbered options.
- **Skill folders:** project `.agents/skills/` (scanned from the working directory up to the repo root); user `~/.codex/skills/` and `~/.agents/skills/`.
- **HAS:** a plugin system (root portable `plugin.json` with the agent-plugins `$schema`, or `.codex-plugin/plugin.json` as the compatibility fallback; skills listed as `plugin:skill`); plugin hooks via `hooks/hooks.json` with a Claude-compatible event schema; `codex exec` headless mode (`--json`, `--ephemeral`); symlinked skill folders for a skills-only install; multi-agent tools enabled by default; custom agents installed as TOMLs by the installer.
- **LACKS:** plugin-packaged subagents (the installer copies the TOMLs instead); a built-in scheduler (external cron); project-grouped transcripts (filter rollouts by `cwd`); automatic hook trust (non-managed hooks need a per-hash `/hooks` review); a plugin-writable `AGENTS.md` channel — it is operator-owned and the installer must not write it.
