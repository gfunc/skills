# Harness: kimi

Kimi Code CLI: local subagents, CronCreate scheduled prompts, and wire.jsonl trails.

## Subagents

- **Spawn tool and arguments:** `Agent` spawns one child with `description`, `prompt`, `subagent_type`, `model`, and `run_in_background`, which defaults to **false**. `AgentSwarm` runs one prompt template over an item list at one model; the `{{item}}` placeholder varies each brief. In swarm mode (`/swarm on`, or `/swarm <task>` for one turn) `AgentSwarm` is auto-approved; outside it, manual permission mode asks. Cursor-only parameters (`environment`, `cloud_base_branch`) are rejected.
- **Choose foreground when the next step needs the result.** A foreground child returns inline in the spawning turn. Foreground is not serial; independent foreground `Agent` calls in one message run concurrently. Use one message for independent probes, reads, or judges.
- **Choose background only to detach.** A background child returns immediately and completes later. Use it only when the parent has other work and does not need the result now. Never launch a background child and then poll `TaskOutput` or `git status`; see Waiting and notifications.
- **Parallel spawn:** yes. Independent foreground `Agent` calls in one message run concurrently; `AgentSwarm` fans one template out over its item list. Heterogeneous briefs need separate `Agent` calls.
- **Fresh child inherits parent context:** no. A child starts from its spawn prompt; the parent passes the profile path, role-prompt path, and inputs explicitly. Agent definitions are Markdown frontmatter (`name`, `description`, `whenToUse`, `override`, `tools`, `disallowedTools`, `subagents`) and cannot set a model.

## Waiting and notifications

- A background completion is delivered automatically as a notification; do not poll for it. A foreground result comes inline in the spawning turn.
- `TaskOutput` is a non-blocking snapshot of a task's current state, not a wait.
- `WaitFor` is experimental, gated behind `wait_for`; it suspends the turn with a 90-second cap and consumes the completion notification it waits on.
- Neither result path needs a status loop. If the next step cannot proceed without a result, spawn that child in the foreground.

## Progress updates

- `NotifyUser` sends a progress update without ending the turn. Use it for the early approach, phase conclusions, long waits, and blockers.
- It does not ask questions. A subagent's update does not reach the parent, so a child reports in its final message.
- Completion notifications are automatic; progress updates do not replace them.

## Models

- **Main-model configuration:** `~/.kimi-code/config.toml` — top-level `default_model`, `[models."<alias>"]` entries, and provider auth; `-m` or `/model` selects per session; `/provider` imports a provider catalog into `[models]`.
- **Availability gate:** an alias is usable only when it exists in `[models]` and its provider authenticates. Every `[secondary_model]` alias must resolve to a `[models]` entry.
- **Subagent model mechanism:** the `model` parameter on `Agent`/`AgentSwarm`, offered only when `[secondary_model]` is configured. The pool is a `models` table of aliases, an optional `default_model`, and `force = true`, which pins every spawn and removes the parameter. Agent files cannot set a model; a Claude-style `model:` frontmatter field is ignored. The pre-0.42.0 experimental secondary-model flag no longer exists — the configured pool is the only gate.
- **Per-spawn model parameter:** yes, while a pool is configured; without one, subagents inherit the caller's model and the parameter is not offered.
- **Inheritance token:** `primary` — the caller's model and effort. Omitting the parameter inherits the caller's model.
- **Operator binding:** role intent lives in `~/.agents/pstack-models.md`, a skill-read convention that no harness auto-loads and that cannot make a model available. Native binding: `~/.kimi-code/config.toml` (`default_model`, `[secondary_model]`); project `local.toml` carries no model keys.
- **Model smoke:** verify a chosen alias with one foreground `Agent` per distinct alias, launched in one message; confirm the alias against that spawn's `subagent.spawned` wire event, which records the model and effort.

## Transcripts

- **Transcript root:** `~/.kimi-code/sessions/wd_<slug>_<hash>/session_*/agents/*/wire.jsonl` — one trail per agent (`agents/main/`, older sessions `agents/agent-<n>/`). `~/.kimi-code/session_index.jsonl` maps a session to its directory.
- **Relocation variable:** `KIMI_CODE_HOME` relocates the config and session root (default `~/.kimi-code`).

Append-only JSONL, protocol 1.5, first line `metadata`. Correlate across trails by `turnId`, `toolCallId`, `subagentId`, and `taskId`; `subagent.spawned` records the model and effort chosen per spawn.

## Scheduler

- **Scheduler:** CronCreate — a timed job that injects a stored prompt. Jobs persist under the session directory's `cron/`.

## Goal mode

- `/goal <objective>` starts a persistent objective the session pursues across automatically continuing turns. State the finish line and the stop condition; the objective runs up to 4000 characters.
- A goal stops as `complete`, `paused`, or `blocked`. `/goal status`, `pause`, `resume`, `cancel`, `replace`, and `next` manage it.
- Budgets exist for time, turns, and tokens; `/goal status` reports progress. `SetGoalBudget` is the main-agent tool where it is exposed.
- Use `/goal` for autonomous-run predicates. Use CronCreate for timed audit ticks. There is no `/loop`.
- Under a goal, spawn every child in the foreground. Foreground calls in one message still run concurrently. A goal continues the turn as soon as one ends, so a background child leaves the next turn with nothing to do but poll.
- Outside a goal, a background child covers work the parent does not need now. After dispatch, end the turn; the completion notification is the wakeup. `TaskOutput`, `TaskList`, `WaitFor`, and repeated `git status` are not.
- A timed audit tick and a goal are mutually exclusive. The goal is the continuation. Delete an armed tick on pause, completion, or cancel.

## Plan mode

- Plan mode entry varies by build. Do not rely on programmatic entry; handle the active state.
- `ExitPlanMode` presents the plan for approval; a rejection keeps plan mode active.
- While plan mode is active, writes outside the plan file, `TaskStop`, `CronCreate`, and `CronDelete` are blocked.
- Ask all scope questions in the same approval summary as the plan handback, so one approval settles the plan and the open calls together.

## Cost and context

- The wire carries `usage.record` and `token_counting.measured` events; there is no model-visible cost API.
- Switching model or effort invalidates the prompt cache. Each child consumes tokens.
- `/goal` and `SetGoalBudget` bound a long run; goal continuation checkpoints across turns instead of holding one giant turn open.

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

## Role mapping

start-dev resolves roles through this mapping. Resolution order: a named plugin agent, then the built-in types, then the main-agent fallback, then sequential/degraded with disclosure.

- **PR owner (`dev-owner`):** the plugin agent from `agents/dev-owner.md`, registered through `kimi.plugin.json` `agents`. Its `subagents` allowlist (`coder, explore`) is the nesting opt-in and matches the execution-only boundary: devs, critical-dev, reviewer, fixer, and the merge worker spawn on `coder`, research on `explore`. Without the allowlist the agent is a leaf; the main orchestrator spawns the devs.
- **Dev, critical-dev, reviewer, fixer, merge worker, research:** `Agent` on the built-in `coder` (or `explore` for research) with the role prompts.
- **Plan lead:** the main agent, or an `Agent` child on `coder` with the plan-lead prompt.
- **Review lead:** a fresh `Agent` child on a different model family with the review-lead prompt.
- **Nested spawn:** only with an explicit `subagents` allowlist on the custom agent. Chains always terminate; no depth number is documented.
- **Parallel spawn:** yes; independent foreground `Agent` calls in one message run concurrently, and `AgentSwarm` fans out a template.
- **Continuation:** `/goal` is native; CronCreate is the timed tick. There is no `/loop`. Under a goal, spawn children in the foreground and arm no audit tick.
- **Frontmatter:** `background` no, `is_background` no, `subagents` yes, `tools` yes, `model` ignored (agent files cannot set a model).
- **Fallback:** without the `subagents` allowlist, `dev-owner` is a leaf; the main orchestrator spawns the devs itself or runs the PR-owner role prompt directly, disclosed in the ledger.

### Role model table

start-dev carries one `Model: <role>=<model>` line per role in each brief; the pstack design skills read it before `~/.agents/pstack-models.md`. On Kimi the value must be a `[secondary_model.models]` alias, and the spawn passes it as `Agent`/`AgentSwarm` `model: "<alias>"`. `setup-workspace` owns the model phase and writes the aliases into `[secondary_model.models]`.

| Role line | Meaning |
|---|---|
| `Model: dev=<alias>` | dev, critical-dev, reviewer, fixer, merge worker, research — pass as `model` on each spawn |
| `Model: plan-lead=<alias>` | plan lead when it is a child; the main agent ignores it |
| `Model: review-lead=<alias>` | review lead — a different model family from the parent's |
| `Model: how explorer=<alias>` / `how explainer=<alias>` / `why investigators=<alias>` / `why synthesizer=<alias>` / `architect runners=<alias>` / `arena runners=<alias>` / `arena cross-judge pool=<alias>` / `swarm workers=<alias>` | the pstack skill role lines, consumed by that skill |

**Per-harness limit.** A configured `[secondary_model]` pool is required before any per-role line can be honored; without one the `model` parameter is not offered and every spawn inherits the caller's model. `force = true` removes the parameter and pins every spawn to `default_model`, so it is reserved for single-model runs and cannot express a per-role table. An alias missing from `[secondary_model.models]` stops that spawn with the available aliases named; do not silently fall back. Confirm each alias against the spawn's `subagent.spawned` wire event.
