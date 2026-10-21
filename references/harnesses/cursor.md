# Harness: cursor

Cursor, the harness the pack body was written for: cloud agents through the `Task` tool, `/loop` scheduler, cursor-team-kit skills native.

## Subagents

The `Task` tool spawns subagents. `subagent_type: generalPurpose` selects the general agent, `environment: "cloud"` runs a Cursor cloud agent (use `environment: "local"` when the worker needs the user's machine), `run_in_background: true` for parallel workers, and `cloud_base_branch` starts a cloud worker from a non-default pushed branch. The Cursor dashboard and Origin are the liveness surface for cloud agents. The model is the Task `model:` parameter, read per role from `~/.cursor/rules/pstack-models.mdc`, the always-applied rule /setup-pstack writes. The pack's `agents/*.md` personas (`poteto-agent`, `comment-sicko`) register as named subagent types where the pack's agents directory is installed; elsewhere spawn a general subagent whose prompt starts by reading the persona file. Fallback: a worker that cannot run in the cloud runs `environment: "local"` in its own worktree.

## Models

Per-role slugs in `~/.cursor/rules/pstack-models.mdc`, written by /setup-pstack (skill defaults `grok-4.7-xhigh-fast` for code, `claude-opus-5-5-xhigh` for prose and judgment). Both cloud and local agents take the model through the Task `model` parameter or the agent file's frontmatter `model:` (Cursor docs + 2026 forum reports); `subagent_type` only names the agent — it does not route models. Cursor puts the reasoning level and speed in the slug itself (`-xhigh`, `-fast`), so the table needs no separate effort field. `auto` routes through Cursor Router (Teams-and-up plans); `inherit` nominally runs the parent chat model but is forum-verified buggy (a Grok parent came back GPT-5.5 Medium, forum.cursor.com 2026-07) — the pack pins an explicit slug per role and treats `inherit` as a fallback, not a port of kimi's `primary`. Models outside Cursor's catalog need a custom API key in settings, then the same slug shape works per role.

## Transcripts

`~/.cursor/projects/<path-slug>/agent-transcripts/<session-id>/<session-id>.jsonl` — one JSON object per line carrying that session's messages and tool calls, nested in a per-session `<session-id>/` subdirectory. Layout corroborated by Cursor forum reports and third-party transcript tools (2026); this machine has no `~/.cursor`, so it is web-verified, not locally verified. `<path-slug>` derives from the workspace path (pack convention, per worktree-audit.sh: drop the leading slash, turn each `/` into `-`); the system prompt names the active workspace's `agent-transcripts/` directory — read only that one, never other projects'. Cloud and local agent runs land in the same per-project tree; the dashboard and Origin stay the liveness surface for cloud agents, but this jsonl is the audit trail. Gotchas: transcript lines carry messages and tool calls but no token usage (`usageData` stays empty per Cursor forum, 2026-10), so cost audits need the dashboard; the Agents-sidebar list lives in globalStorage state, not this directory — an empty sidebar does not mean missing transcripts; the headless `cursor-agent` CLI writes under the same `~/.cursor` tree, separate from the IDE's `state.vscdb`.

## Scheduler

`/loop`, built into Cursor; it carries the `/loop 1h` audit tick natively.

## Forge

gh default; glab when the remote is GitLab.

## UI driver

playwright-cli (skills/playwright-cli).

## Store

`.scratch/<feature-slug>/` in the target repo.

## Capabilities

- HAS: everything the playbooks name natively — cloud agents (`environment: "cloud"`), the dashboard and Origin, `/loop`, the cursor-team-kit skills (`deslop`, `control-ui`, `control-cli`), `AskQuestion`, `/visualize`, and the `.cursor-plugin/` manifest.
- LACKS: nothing material for this pack; it is the reference harness the Cursor-era body prose targets. (The bun-based `scripts/orch` and `scripts/watch-pr` still need bun, an OS/runtime gap rather than a harness one.) The agent-transcripts layout above is web-verified only — no `~/.cursor` exists on the authoring machine; confirm it against a real install before scripting an audit (ticket 09).
