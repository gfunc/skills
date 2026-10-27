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
- **Model smoke:** no stock spawn; an alias probe records `not-run`.

## Transcripts

- **Transcript root:** `~/.pi/agent/sessions/--<cwd>--/<timestamp>_<session-id>.jsonl` — JSONL trees keyed by `id`/`parentId`, format version 3, first line a `session` header.
- **Relocation variable:** `PI_CODING_AGENT_DIR` relocates the agent directory (default `~/.pi/agent`) for containers; inside a Pi-run bash tool, `PI_SESSION_FILE` holds the active JSONL path.

The file is a tree, not an append-only log: walk from the active leaf toward the root and honor the latest `compaction` entry, or abandoned branches inflate the audit. For a live per-run event trail, run with `pi --mode json` (`agent_start`, `turn_*`, `message_*`, `tool_execution_*`).

## Scheduler

- **Scheduler:** none built in. Arm a timed prompt with an external cron job or a timed shell wait.
- **Goal mode:** none documented or installed. The installed 1.3.0 docs and package contain no `/goal`, `/loop`, or cron command; a third-party extension is out of scope. Use external cron or a timed shell wait for continuation.

## Plan mode

- No native plan mode is documented. The pack's plan gate is a checked plan (`emit-plan` plus `check-plan`), not a harness mode.

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

## Role mapping

start-dev resolves roles through this mapping. Pi has no stock subagents, so this is the degraded mapping and the disclosure is mandatory in the ledger.

- **PR owner (`dev-owner`):** collapses to the main agent, which runs the PR-owner role prompt directly. With the first-party subagent extension installed, a separate `pi` process per agent is possible; agents are not package resources, so the pack ships no installable agent for Pi.
- **Dev, critical-dev, reviewer, fixer, merge worker, research:** without the extension, the main agent does the work sequentially. With it, the extension's `tasks` (parallel, capped 8/4) or `chain` (sequential) modes carry the role prompts.
- **Plan lead:** the main agent.
- **Review lead:** the main agent in a fresh read, with the reduced independence disclosed; the operator is the independent review.
- **Nested spawn:** none stock; recursion is extension-defined and unverified (the example child reloads extensions and has no depth guard).
- **Parallel spawn:** only through the example extension, capped at 8 tasks and 4 concurrent.
- **Continuation:** none built in; use external cron or a timed shell wait. The installed docs and package contain no goal command.
- **Frontmatter (example loader):** `background` no, `is_background` no, `subagents` no, `tools` yes, `model` yes.
- **Fallback:** the main agent executes the plan and review hats itself, sequentially, disclosed in the ledger as reduced independence.

### Role model table

start-dev carries one `Model: <role>=<model>` line per role in each brief; the pstack design skills read it before `~/.agents/pstack-models.md`. Pi has no per-spawn model parameter — the example extension's tool schema carries none — so the brief's line cannot be honored directly; it selects which model the run records as intended.

| Role line | Meaning |
|---|---|
| `Model: dev=<model>` | dev, critical-dev, reviewer, fixer, merge worker, research — intended model; recorded and disclosed |
| `Model: plan-lead=<model>` | plan lead (always the main agent on Pi) — no effect |
| `Model: review-lead=<model>` | review lead (the main agent in a fresh read) — intended model, recorded and disclosed |
| `Model: how explorer=<model>` / `how explainer=<model>` / `why investigators=<model>` / `why synthesizer=<model>` / `architect runners=<model>` / `arena runners=<model>` / `arena cross-judge pool=<model>` / `swarm workers=<model>` | the pstack skill role lines, consumed by that skill |

**Per-harness limit.** With the subagent extension installed, the per-agent `model:` frontmatter (`~/.pi/agent/agents/*.md`, `.pi/agents/*.md`) is the only child model control; an agent file without `model` runs the parent's active `provider/modelId`. To honor a line, write it into that agent file before the run. Otherwise use the skill's stated default or the parent's model, record the model each role actually ran on, and disclose the mismatch with the brief's line in the reply and ledger. Without the extension there is no spawn mechanism at all; the degraded Role mapping applies and every line is recorded as unmet.
