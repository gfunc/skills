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

## Transcripts

- **Transcript root:** `~/.cursor/projects/<path-slug>/agent-transcripts/<session-id>/<session-id>.jsonl` — one JSON object per line carrying that session's messages and tool calls, nested in a per-session `<session-id>/` directory.
- **Relocation variable:** none documented; `<path-slug>` derives from the workspace path (drop the leading slash, turn each `/` into `-`). Cloud and local runs land in the same per-project tree.

Read only the active workspace's `agent-transcripts/` tree; the system prompt names it. The layout is corroborated by forum reports and third-party transcript tools but is web-verified only; confirm it against a real install before scripting an audit. Transcript lines carry messages and tool calls but no token usage (`usageData` stays empty), so cost audits use the dashboard. The Agents-sidebar list lives in globalStorage, not this directory. The headless `cursor-agent` writes under the same `~/.cursor` tree.

## Scheduler

- **Scheduler:** `/loop`, built in; it can carry a timed prompt such as an hourly audit tick.

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
- **HAS:** cloud agents (`environment: "cloud"`), local agents, the dashboard and Origin as liveness surfaces, `/loop`, the cursor-team-kit skills (`deslop`, `control-ui`, `control-cli`), `AskQuestion`, `/visualize`, and the `.cursor-plugin/` manifest.
- **LACKS:** a pinned version floor (rolling release); token usage in transcripts (`usageData` empty); a documented user-level rules file path (User Rules are UI-managed).
