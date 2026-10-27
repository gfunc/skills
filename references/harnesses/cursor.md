# Harness: cursor

Cursor: cloud and local agents through the `Task` tool, the `/loop` scheduler, and cursor-team-kit skills native.

## Subagents

- **Spawn tool and arguments:** `Task` takes `description`, `prompt`, `subagent_type` (`generalPurpose` selects the general agent), `environment` (`"cloud"` or `"local"`), `run_in_background: true` for parallel workers, `cloud_base_branch` for a non-default pushed branch, and `model` for a per-spawn choice.
- **Parallel spawn:** yes. Background `Task` calls run concurrently.
- **Fresh child inherits parent context:** no. Cloud and local children start fresh; the parent passes the profile line, role-prompt path, and inputs explicitly. A cloud child cannot read a local absolute path, so pass content or a repo-relative reference.

The dashboard and Origin are the liveness surface for cloud agents. The pack's `agents/*.md` personas register as named subagent types where the pack's agents directory is installed; elsewhere spawn a general subagent whose prompt starts by reading the persona file. Custom subagent frontmatter also supports `readonly` and `is_background`.

## Models

- **Main-model configuration:** the Cursor model picker (account and plan entitlement) or the CLI `--model`; `--list-models` / `agent models` lists the account catalog.
- **Availability gate:** the model ID must be in the account catalog and allowed by plan, region, and team admin allowlist. Third-party models require Premium+ or BYOK; the picker and `--list-models` are the runtime authority. A blocked or plan-limited ID falls back to a compatible model.
- **Subagent model mechanism:** the `Task` `model` parameter per spawn, or a custom subagent's frontmatter `model` — `inherit` or a specific ID, optionally with `[effort=...,context=...]`. Built-in Explore and Browser agents choose their own.
- **Per-spawn model parameter:** yes.
- **Inheritance token:** `inherit` (default). It nominally runs the parent chat model but is reported to resolve incorrectly (a Grok parent returned GPT-5.5 Medium, forum.cursor.com 2026-07); verify the resolved model before relying on it.
- **Operator binding:** role intent lives in `~/.agents/pstack-models.md`, a skill-read convention that no harness auto-loads and that cannot make a model available. Native binding: the Cursor Settings model picker and BYOK in Settings → Models; user subagents in `~/.cursor/agents/*.md`. User Rules are UI-managed under Customize → Rules, not a documented filesystem path; project rules are `.cursor/rules/*.mdc`. `~/.cursor/rules/*.mdc` is not documented as a user-level auto-loaded rule path.
- **Model smoke:** verify a chosen model with one foreground local `Task` carrying the `model` parameter; a cloud probe is optional and spends cloud quota.

## Transcripts

- **Transcript root:** `~/.cursor/projects/<path-slug>/agent-transcripts/<session-id>/<session-id>.jsonl` — one JSON object per line carrying that session's messages and tool calls, nested in a per-session `<session-id>/` directory.
- **Relocation variable:** none documented; `<path-slug>` derives from the workspace path (drop the leading slash, turn each `/` into `-`). Cloud and local runs land in the same per-project tree.

Read only the active workspace's `agent-transcripts/` tree; the system prompt names it. The layout is corroborated by forum reports and third-party transcript tools but is web-verified only; confirm it against a real install before scripting an audit. Transcript lines carry messages and tool calls but no token usage (`usageData` stays empty), so cost audits use the dashboard. The Agents-sidebar list lives in globalStorage, not this directory. The headless `cursor-agent` writes under the same `~/.cursor` tree.

## Scheduler

- **Scheduler:** `/loop`, built in; it can carry a timed prompt such as an hourly audit tick.
- **Goal mode:** `/goal <objective>` is native. `/loop` is a built-in skill, and cloud agents support timer subscriptions.

## Plan mode

- Cursor ships Plan Mode, entered with Shift+Tab or the mode dropdown. The agent researches, asks clarifying questions, and presents a plan the operator approves before it edits.

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

- **Active harness:** `cursor`
- **Version floor:** none pinned — Cursor ships rolling IDE and `cursor-agent` releases; use the current release.
- **Structured question:** `AskQuestion`; with no such tool, ask in chat with numbered options.
- **Skill folders:** project `.cursor/skills/`; user `~/.cursor/skills/`.
- **HAS:** cloud agents (`environment: "cloud"`), local agents, the dashboard and Origin as liveness surfaces, `/loop`, the cursor-team-kit skills (`deslop`, `control-ui`, `control-cli`), `AskQuestion`, `/visualize`, and the `.cursor-plugin/` manifest.
- **LACKS:** a pinned version floor (rolling release); token usage in transcripts (`usageData` empty); a documented user-level rules file path (User Rules are UI-managed).

## Role mapping

start-dev resolves roles through this mapping. Resolution order: a named plugin agent, then the profile's general type, then the main-agent fallback, then sequential/degraded with disclosure. Every Cursor row is documented only; `cursor-agent` was not installed for the research.

- **PR owner (`dev-owner`):** the plugin agent from the `.cursor-plugin/plugin.json` `agents` path, selected as a `Task` type. Nesting reaches one extra level since Cursor 2.5, so `dev-owner` spawns its devs as grandchildren; the grandchildren are leaves.
- **Dev, critical-dev, reviewer, fixer, merge worker, research:** `Task` subagents with the role prompts; the first-party subagent extension for parallel research work.
- **Plan lead:** the main agent, or a `Task` subagent with the plan-lead prompt.
- **Review lead:** a fresh `Task` subagent on a different model family with the review-lead prompt.
- **Nested spawn:** one extra level (main -> child -> grandchild-leaf). The documented fallback at the limit is the leaf doing the work or the main agent making more direct `Task` calls; treat that as inference, not a documented contract.
- **Parallel spawn:** yes.
- **Continuation:** `/goal` is native. `/loop` is a built-in skill; cloud timer subscriptions exist.
- **Frontmatter:** `background` no, `is_background` yes, `subagents` no, `tools` no (subagents inherit the parent's tools), `model` yes (`inherit` default).
- **Fallback:** when a grandchild would need to spawn, the main orchestrator runs the PR-owner role prompt itself and spawns devs directly, disclosed in the ledger.

### Role model table

start-dev carries one `Model: <role>=<model>` line per role in each brief; the pstack design skills read it before `~/.agents/pstack-models.md`. On Cursor the value is a catalog model ID, passed as the `Task` `model` argument; it may carry `[effort=...,context=...]`.

| Role line | Meaning |
|---|---|
| `Model: dev=<id>` | dev, critical-dev, reviewer, fixer, merge worker, research — pass as `model` on each spawn |
| `Model: plan-lead=<id>` | plan lead when it is a child; the main agent ignores it |
| `Model: review-lead=<id>` | review lead — a different model family from the parent's |
| `Model: how explorer=<id>` / `how explainer=<id>` / `why investigators=<id>` / `why synthesizer=<id>` / `architect runners=<id>` / `arena runners=<id>` / `arena cross-judge pool=<id>` / `swarm workers=<id>` | the pstack skill role lines, consumed by that skill |

**Per-harness limit.** Precedence between a Task `model` argument and a subagent file's `model:` is undocumented; the docs do not state which wins. So: prefer the brief line by passing `model` on the Task and not relying on a role file, record the model the run actually used (the subagent task card shows it), and disclose any mismatch with the brief's line in the reply and ledger. Plan, team, or region restrictions substitute a compatible model; report the substitution rather than accepting it silently.
