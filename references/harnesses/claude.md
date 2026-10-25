# Harness: claude

Claude Code: plugin-native install with namespaced skills, Markdown subagents with model aliases, and the `/loop` scheduler.

## Subagents

- **Spawn tool and arguments:** `Agent` takes `description`, `prompt`, `subagent_type` (`general-purpose`, `Explore`, or a plugin agent name), `model` (alias, full ID, or `inherit`), `effort`, and `isolation: "worktree"` for a worktree child. Subagents run in the background by default and notify on completion. Cursor-only parameters (`environment`, `cloud_base_branch`, `readonly`) are not accepted.
- **Parallel spawn:** yes. Independent `Agent` calls run concurrently.
- **Fresh child inherits parent context:** no. A subagent does not inherit the parent's conversation or loaded skills; the parent passes the profile path, role-prompt path, and inputs explicitly. Subagents cannot spawn other subagents.

Plugin `agents/` at the plugin root loads and is namespaced under the plugin name at the lowest precedence; project `.claude/agents/` and user `~/.claude/agents/` override it. The pack's `agents/*.md` carry `background: true`.

## Models

- **Main-model configuration:** `~/.claude/settings.json` `model`; `--model`; `ANTHROPIC_MODEL`; `/model` writes the chosen default back to user settings. Provider routing uses `ANTHROPIC_BASE_URL` plus auth.
- **Availability gate:** an alias (`sonnet`, `opus`, `haiku`, `fable`, `best`, `default`) or a full model ID must resolve for the configured provider and account. Managed `availableModels` and org restrictions can block a selection; a blocked value runs a family substitute or the inherited model rather than failing.
- **Subagent model mechanism:** resolution order is the per-invocation `model` parameter, then the agent's `model` frontmatter (alias, full ID, or `inherit`), then `CLAUDE_CODE_SUBAGENT_MODEL`, then the inherited parent model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` ignores frontmatter and the per-invocation parameter and applies one model to every subagent (documented built-in Explore exception).
- **Per-spawn model parameter:** yes.
- **Inheritance token:** `inherit` — also the default and the meaning of an unset `CLAUDE_CODE_SUBAGENT_MODEL`.
- **Operator binding:** role intent lives in `~/.agents/pstack-models.md`, a skill-read convention that no harness auto-loads and that cannot make a model available. Native binding: `~/.claude/settings.json` (`model`, `modelPicker`, `env`); user agents in `~/.claude/agents/`. User rules under `~/.claude/rules/` auto-load in every session, so that directory is a delivery surface, not a second preference store.
- **Model smoke:** verify a chosen alias with one `Agent` call passing the alias or the full model ID as `model`.

## Transcripts

- **Transcript root:** `~/.claude/projects/<project>/<session-id>.jsonl`, one line per message, tool use, or metadata entry; subagent trails at `~/.claude/projects/<project>/<sessionId>/subagents/agent-<agentId>.jsonl`, one file per subagent.
- **Relocation variable:** `CLAUDE_CONFIG_DIR` relocates the whole tree; `CLAUDE_CODE_PROJECT_DIR_NAME` names the project directory and is set with it.

`<project>` is the workspace path with every non-alphanumeric character replaced by `-` (over 200 characters: truncated plus a path hash). The entry schema is internal and changes between versions, so audits must tolerate unknown entry types: key off `type` and the `uuid`/`parentUuid` chain. Observed vocabulary (2.1.x): `user` and `assistant` messages (`message.content[]` blocks: `thinking`/`text`/`tool_use`; a tool result is a `user` entry whose `content[]` carries `{type:"tool_result", tool_use_id}` — correlate `tool_use.id` ↔ `tool_result.tool_use_id`); `attachment` (hook output `hook_success`/`hook_additional_context`, `skill_listing`, model/environment/budget metadata); `queue-operation`; `system` (e.g. `compact_boundary`); `last-prompt` (`leafUuid` points at the current leaf); `cost-state` (`modelUsage`, `hasUnknownModelCost`). The resolved model is `assistant.message.model`; per-message tokens are `assistant.message.usage`. `attachment.skill_listing` is the audit surface for "did the pack's skills load". Retention: `cleanupPeriodDays` (default 30), `claude purge`, `--no-session-persistence` for `-p` runs; `-p` sessions are excluded from the picker but resumable by id, and `--resume` accepts an absolute transcript path. `~/.claude/transcripts/ses_*.jsonl` is a legacy store — real sessions, but the flat `{type: user|tool_use|tool_result, timestamp, content/tool_name/tool_input/tool_output}` schema records no model, no uuid chain, and no session grouping by project; audit it only when no current-format file exists.

## Scheduler

- **Scheduler:** `/loop`, built in; it can carry a timed prompt such as an hourly audit tick.
- **No native goal mode.** For work that must continue across turns, carry the predicate in `/loop` or in a checked plan; subagents already notify on completion from either default mode.

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

- **Active harness:** `claude`
- **Version floor:** Claude Code 2.1.307; older installs reinstall.
- **Structured question:** `AskUserQuestion`; it is absent in `-p` mode, so ask in plain text there.
- **Skill folders:** project `.claude/skills/`; user `~/.claude/skills/`.
- **HAS:** a plugin system (`.claude-plugin/plugin.json`, optional `marketplace.json`, `--plugin-dir` zero-install); namespaced skills `/gfunc-skills:<skill>`; Markdown subagents with model aliases and full IDs; plugin hooks (`hooks/claude-hooks.json`); headless `claude -p --output-format stream-json`; version-tolerant projects/JSONL audits.
- **LACKS:** a stable transcript schema (write version-tolerant parsers); subagent-of-subagent spawning (deep orchestration nests at one level).
