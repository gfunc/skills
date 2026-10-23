# Harness: kimi

Kimi Code CLI: local subagents, CronCreate scheduled prompts, and wire.jsonl trails.

## Subagents

- **Spawn tool and arguments:** `Agent` spawns one child with `description`, `prompt`, `subagent_type`, `model`, and `run_in_background: true`. `AgentSwarm` runs one prompt template over an item list at one model; the `{{item}}` placeholder varies each brief. In swarm mode (`/swarm on`, or `/swarm <task>` for one turn) `AgentSwarm` is auto-approved; outside it, manual permission mode asks. Cursor-only parameters (`environment`, `cloud_base_branch`) are rejected.
- **Parallel spawn:** yes. Background `Agent` calls run concurrently; `AgentSwarm` fans one template out over its item list. Heterogeneous briefs need separate `Agent` calls.
- **Fresh child inherits parent context:** no. A child starts from its spawn prompt; the parent passes the profile path, role-prompt path, and inputs explicitly. Agent definitions are Markdown frontmatter (`name`, `description`, `whenToUse`, `override`, `tools`, `disallowedTools`, `subagents`) and cannot set a model.

## Models

- **Main-model configuration:** `~/.kimi-code/config.toml` — top-level `default_model`, `[models."<alias>"]` entries, and provider auth; `-m` or `/model` selects per session; `/provider` imports a provider catalog into `[models]`.
- **Availability gate:** an alias is usable only when it exists in `[models]` and its provider authenticates. Every `[secondary_model]` alias must resolve to a `[models]` entry.
- **Subagent model mechanism:** the `model` parameter on `Agent`/`AgentSwarm`, offered only when `[secondary_model]` is configured. The pool is a `models` table of aliases, an optional `default_model`, and `force = true`, which pins every spawn and removes the parameter. Agent files cannot set a model; a Claude-style `model:` frontmatter field is ignored. The pre-0.42.0 experimental secondary-model flag no longer exists — the configured pool is the only gate.
- **Per-spawn model parameter:** yes, while a pool is configured; without one, subagents inherit the caller's model and the parameter is not offered.
- **Inheritance token:** `primary` — the caller's model and effort. Omitting the parameter inherits the caller's model.
- **Operator binding:** role intent lives in `~/.agents/pstack-models.md`, a skill-read convention that no harness auto-loads and that cannot make a model available. Native binding: `~/.kimi-code/config.toml` (`default_model`, `[secondary_model]`); project `local.toml` carries no model keys.

## Transcripts

- **Transcript root:** `~/.kimi-code/sessions/wd_<slug>_<hash>/session_*/agents/*/wire.jsonl` — one trail per agent (`agents/main/`, older sessions `agents/agent-<n>/`). `~/.kimi-code/session_index.jsonl` maps a session to its directory.
- **Relocation variable:** `KIMI_CODE_HOME` relocates the config and session root (default `~/.kimi-code`).

Append-only JSONL, protocol 1.5, first line `metadata`. Correlate across trails by `turnId`, `toolCallId`, `subagentId`, and `taskId`; `subagent.spawned` records the model and effort chosen per spawn.

## Scheduler

- **Scheduler:** CronCreate — a timed job that injects a stored prompt. Jobs persist under the session directory's `cron/`.

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

- **Active harness:** `kimi`
- **Version floor:** Kimi Code 2.3.0; older installs reinstall. 2.3.0 requires qualified plugin skill names; the 2.2 bare-skill-name behavior is dropped.
- **Structured question:** `AskUserQuestion`; with no such tool, ask in chat with numbered options.
- **Skill folders:** project `.kimi-code/skills/` and `.agents/skills/`; user `$KIMI_CODE_HOME/skills/` (default `~/.kimi-code/skills/`) and `~/.agents/skills/`.
- **HAS:** local subagents with background runs and a per-spawn model parameter when a pool is configured; `AgentSwarm` template fan-out with swarm-mode auto-approval; tower mode (`/tower on`); CronCreate; the wire.jsonl trail format; a plugin manifest (`kimi.plugin.json`) carrying skills, agents, hooks, and commands.
- **LACKS:** per-agent `model:` frontmatter; `deslop` and the cursor-team-kit control skills; a built-in PR tool.
