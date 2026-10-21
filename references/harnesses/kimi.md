# Harness: kimi

Kimi Code CLI, the harness this pack is authored and verified on: local subagents, CronCreate scheduled prompts, wire.jsonl trails.

## Subagents

The `Agent` tool (`AgentSwarm` for waves) spawns local subagents; pass `run_in_background: true` for parallel workers the parent drains. Give each spawn its own git worktree, and drop Cursor-only parameters (`environment`, `subagent_type`). Model selection is the `model:` parameter on the `Agent` tool, resolved against the `[secondary_model]` pool in `~/.kimi-code/config.toml`: a `models` table mapping existing `[models]` aliases to role hints, a `default_model`, `force = true` to pin every subagent, or the reserved `primary` (the caller's model and effort). Agent files are Markdown (`name`, `description`, `tools` frontmatter) with no per-agent model field, so each agent prompt names its recommended pool alias. Fallback: with no pool configured, subagents inherit the caller's model and `model:` is not offered.

## Models

Pointer. The kimi role→model table stays in place at `skills/poteto-mode/references/pstack-models.md` (magpie aliases such as `magpie/bi-dev/group/auto-glm-5-3-flash`, `primary` for the hardest tasks); /setup-pstack installs the operator's copy at `~/.agents/pstack-models.md`, and emit-plan reads the shipped default. Do not move the table.

## Transcripts

`~/.kimi-code/sessions/wd_<slug>_<hash>/session_*/agents/*/wire.jsonl` — append-only JSONL, protocol 1.5, first line `metadata`, one trail per agent (`agents/main/`, older sessions `agents/agent-<n>/`). Correlate across trails by `turnId`, `toolCallId`, `subagentId`, `taskId`; `subagent.spawned` records the model and effort chosen per spawn, which is what a role→model audit checks. `~/.kimi-code/session_index.jsonl` maps session to directory.

## Scheduler

CronCreate, the harness's scheduled-prompt mechanism: a timed job that injects a stored prompt. Arm the `/loop 1h` audit tick as an hourly CronCreate job holding the verbatim tick prompt at Arm the program; delete it at Close the program. Jobs persist under the session directory's `cron/`.

## Forge

gh default; glab when the remote is GitLab.

## UI driver

playwright-cli (skills/playwright-cli).

## Store

`.scratch/<feature-slug>/` in the target repo.

## Capabilities

- HAS: local subagents with background runs and a per-spawn model parameter; CronCreate scheduled prompts; the reference trail format (wire.jsonl) every other harness maps to; a plugin manifest (`kimi.plugin.json`) that carries skills, agents, hooks, and commands.
- LACKS: the bun runtime (`scripts/orch` and `scripts/watch-pr` are intentionally unused; poll the forge CLI instead); per-agent `model:` frontmatter (the model choice lives in `[secondary_model]`, not the agent file); `deslop` and the cursor-team-kit control skills (reread the diff and cut AI slop yourself, drive UI with playwright-cli and CLIs with tmux or a PTY); a built-in PR tool (every PR operation goes through the forge CLI).
