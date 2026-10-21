# Harness: pi

pi-coding-agent, package-native install with no manifest required; no built-in subagents (extension-spawned child processes instead); no built-in scheduler.

## Subagents

None built in. The first-party route is the shipped `subagent` example extension, which spawns a separate `pi` process per agent (`pi --mode json -p --no-session --model <agent.model> --thinking <level>`). Agent definitions are Markdown with YAML frontmatter (`name`, `description`, `tools`, `model:`) at `~/.pi/agent/agents/*.md` (user, always loaded) or `.pi/agents/*.md` (project, needs `agentScope`). Agents are NOT package resources — a package cannot declare `agents/` — so distributing the pack's agents needs a second install step into `~/.pi/agent/agents/` or a small custom extension. Fallback, and the pack's default for its subagent-coupled skills: run the delegated steps yourself, one after another.

## Models

Expressed as capability tiers, not ids — pi is provider-agnostic and the registry is per-machine: built-ins plus `models.json` custom providers, enumerated by `pi --list-models` (on this host that prints "No models available" — no provider key configured; `models-store.json` is a provider-catalog cache, not the registry). Bind exact ids at setup time: run `pi --list-models` on the target machine and replace each tier with a chosen id (`provider/id`, optional `:<thinking>` suffix — the agent frontmatter `model:` passes straight to the child CLI's `--model`). Proposed defaults, edit freely:

```text
# proposed defaults, edit freely. Capability tiers — bind exact ids from `pi --list-models` at setup time.
feature, refactoring: standard
bug-fix: standard
hardest tasks: frontier
judgment and prose: frontier
swarm workers: fast          # many parallel children; cheap and quick beats smart
audit and second opinion: frontier   # pick a different provider than the implementation tier's
```

To inherit the dispatcher's model for a role, omit `model:` from that agent file — the child then runs the session's active model and thinking level.

## Transcripts

`~/.pi/agent/sessions/--<cwd>--/<timestamp>_<session-id>.jsonl` — JSONL trees keyed by `id` / `parentId` (format version 3, first line a `session` header). The file is a tree, not an append-only log: walk from the active leaf toward the root and honor the latest `compaction` entry, or abandoned branches inflate the audit. For a live per-run event trail closer to wire.jsonl, run with `pi --mode json` (`agent_start`, `turn_*`, `message_*`, `tool_execution_*`). Inside a pi-run bash tool, `PI_SESSION_FILE` holds the active JSONL path.

## Scheduler

None built in. Arm the audit tick with an external cron job or a timed shell wait.

## Forge

gh default; glab when the remote is GitLab.

## UI driver

playwright-cli (skills/playwright-cli).

## Store

`.scratch/<feature-slug>/` in the target repo.

## Capabilities

- HAS: native package install (`pi install <path>` or `pi install git:github.com/<owner>/<repo>@<ref>`; root `skills/` is discovered by convention, an optional `package.json` `pi.skills` pins it); all 61 pack skills load and validate; headless `pi -p` and `--mode json`; `PI_CODING_AGENT_DIR` relocates the agent dir for containers.
- LACKS: built-in subagents — the pack's 12 subagent-coupled skills degrade to their pi fallbacks (run the steps yourself, one after another); skill namespacing (names are global and first-loaded wins, so a same-named user or project skill shadows the pack's — collision checks belong in the validation rig); a `hooks.json` convention (hooks are TypeScript extension events); a built-in scheduler; packageable agents.
