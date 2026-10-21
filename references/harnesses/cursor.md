# Harness: cursor

Cursor, the harness the pack body was written for: cloud agents through the `Task` tool, `/loop` scheduler, cursor-team-kit skills native.

## Subagents

The `Task` tool spawns subagents. `subagent_type: generalPurpose` selects the general agent, `environment: "cloud"` runs a Cursor cloud agent (use `environment: "local"` when the worker needs the user's machine), `run_in_background: true` for parallel workers, and `cloud_base_branch` starts a cloud worker from a non-default pushed branch. The Cursor dashboard and Origin are the liveness surface for cloud agents. The model is the Task `model:` parameter, read per role from `~/.cursor/rules/pstack-models.mdc`, the always-applied rule /setup-pstack writes. The pack's `agents/*.md` personas (`poteto-agent`, `comment-sicko`) register as named subagent types where the pack's agents directory is installed; elsewhere spawn a general subagent whose prompt starts by reading the persona file. Fallback: a worker that cannot run in the cloud runs `environment: "local"` in its own worktree.

## Models

Per-role slugs in `~/.cursor/rules/pstack-models.mdc`, written by /setup-pstack (skill defaults `grok-4.7-xhigh-fast` for code, `claude-opus-5-5-xhigh` for prose and judgment); `inherit-parent` / `auto` run the role on the parent chat model (omit the Task `model`). Cursor puts the reasoning level and speed in the slug itself (`-xhigh`, `-fast`). Pending ticket 09 for anything beyond the skill defaults.

## Transcripts

`~/.cursor/projects/<path-slug>/agent-transcripts/` per worktree-audit.sh, where `<path-slug>` is the workspace path with the leading slash dropped and each `/` turned into `-`; the system prompt names the active workspace's `agent-transcripts/` directory. Read only the active workspace's sessions, never other projects'.

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
- LACKS: nothing material for this pack; it is the reference harness the Cursor-era body prose targets. (The bun-based `scripts/orch` and `scripts/watch-pr` still need bun, an OS/runtime gap rather than a harness one.)
