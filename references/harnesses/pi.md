# Harness: pi

pi-coding-agent: package-native install with no manifest required, no stock subagents, and no built-in scheduler.

## Subagents

- **Spawn tool and arguments:** none stock. The first-party `subagent` example extension spawns a separate `pi` process per agent: `pi --mode json -p --no-session --model <agent.model> --thinking <level>`. Agent definitions are Markdown with YAML frontmatter (`name`, `description`, `tools`, `model`) at `~/.pi/agent/agents/*.md` (user, always loaded) or `.pi/agents/*.md` (project, needs `agentScope`). The extension's tool schema has no `model` parameter.
- **Parallel spawn:** extension-dependent. With the example extension, one child process runs per tool call; with no extension, there is no spawn mechanism.
- **Fresh child inherits parent context:** no. Each child is a separate `pi` process with its own session (`--no-session`); the parent passes the profile path, role-prompt path, and inputs explicitly.

Agents are not package resources — a package cannot declare `agents/` — so distributing role agents needs a second install step into `~/.pi/agent/agents/` or a custom extension.

## Models

- **Main-model configuration:** `~/.pi/agent/settings.json` (`defaultProvider`, `defaultModel`, `enabledModels`); `~/.pi/agent/models.json` for custom endpoints and model overrides; `--model` per invocation; `/model` per session; `/login` or the provider's environment variable supplies credentials.
- **Availability gate:** the model must be in Pi's bundled or custom catalog and its provider must have usable authentication. A model without a resolved credential does not appear in `/model`; `enabledModels` patterns restrict startup selection and `Ctrl+P` cycling.
- **Subagent model mechanism:** the agent frontmatter `model` is passed as the child's `--model`; without it the example extension dispatches the parent's `provider/modelId`. There is no per-call model parameter.
- **Per-spawn model parameter:** no.
- **Inheritance token:** omitted — no `inherit` or `primary` token is documented; omitting `model` runs the child on the parent's active `provider/modelId` and thinking level.
- **Operator binding:** role intent lives in `~/.agents/pstack-models.md`, a skill-read convention that no harness auto-loads and that cannot make a model available. Native binding: `~/.pi/agent/settings.json`, `~/.pi/agent/models.json`, and `~/.pi/agent/agents/*.md`; credentials live only in `auth.json`.

## Transcripts

- **Transcript root:** `~/.pi/agent/sessions/--<cwd>--/<timestamp>_<session-id>.jsonl` — JSONL trees keyed by `id`/`parentId`, format version 3, first line a `session` header.
- **Relocation variable:** `PI_CODING_AGENT_DIR` relocates the agent directory (default `~/.pi/agent`) for containers; inside a Pi-run bash tool, `PI_SESSION_FILE` holds the active JSONL path.

The file is a tree, not an append-only log: walk from the active leaf toward the root and honor the latest `compaction` entry, or abandoned branches inflate the audit. For a live per-run event trail, run with `pi --mode json` (`agent_start`, `turn_*`, `message_*`, `tool_execution_*`).

## Scheduler

- **Scheduler:** none built in. Arm a timed prompt with an external cron job or a timed shell wait.

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

- **Active harness:** `pi`
- **Version floor:** pi-coding-agent 1.3.0; older installs reinstall.
- **Structured question:** none documented; ask in chat with numbered options.
- **Skill folders:** project `.pi/skills/` and `.agents/skills/`; user `~/.pi/agent/skills/` and `~/.agents/skills/`.
- **HAS:** native package install (`pi install <path>` or `pi install git:github.com/<owner>/<repo>@<ref>`; root `skills/` is discovered by convention, an optional `package.json` `pi.skills` pins it); headless `pi -p` and `--mode json`; `PI_CODING_AGENT_DIR` relocation for containers.
- **LACKS:** built-in subagents (the first-party subagent route is an extension); skill namespacing (names are global and first-loaded wins, so a same-named user or project skill shadows the pack's); a `hooks.json` convention (hooks are TypeScript extension events); a built-in scheduler; packageable agents.
