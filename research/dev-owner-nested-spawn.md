# Nested spawn and agent registration across five hosts

Research ticket: `.scratch/dev-owner/issues/11-nested-spawn-research.md`.
Access date for every source below: **2026-10-26**.
Question: for Claude, Cursor, Codex, Kimi, and Pi, can a subagent spawn another
subagent, how is a named plugin or project agent registered/installed/selected,
what is the fallback when nested spawn is unavailable, what continuation or tick
mechanism exists, and what do the docs/CLI say about `background`,
`is_background`, `subagents`, `tools`, and `model`?

Evidence grades:

- **measured**: a local command, installed binary/package, or local doc file was
  inspected on the access date. The source is the installed path plus version.
- **documented**: a first-party docs page was fetched on the access date.
- **unverified**: no first-party confirmation found, or the point is outside the
  docs and could not be run.

Installed hosts measured: Claude Code `2.1.307`, Codex `codex-cli 0.163.0`,
Kimi Code `2.3.2`, Pi `1.3.0`. `cursor-agent` is **not installed** on this
machine, so every Cursor finding is documented only.

## Summary

| Host | Can a subagent spawn another? | Plugin-packaged agents | Continuation / tick |
| --- | --- | --- | --- |
| Claude | Yes, by default, up to 3 layers below main | Yes: `agents/` or manifest `agents`, namespaced `plugin:agent` | `/loop`, `CronCreate`/`CronList`/`CronDelete`, cloud and Desktop schedules, `/goal` |
| Cursor | Yes, one extra level since 2.5; a grandchild cannot spawn | Yes: Cursor plugin `agents` paths or `agents/` | `/goal`, built-in `/loop` skill; cloud timer subscriptions |
| Codex | Yes: the spawn tool tells the child it can spawn its own subagents | No agent component in the documented plugin manifest | `/goal`; no CLI scheduler found |
| Kimi | Only with an explicit `subagents` allowlist on a custom agent | Yes: manifest `agents` or `agents/` | `CronCreate` family, `/goal`; no `/loop` |
| Pi | No stock subagents; recursion is extension-defined and unverified | No: agents are not package resources | None; external cron or shell wait |

## Claude Code 2.1.307

Sources: [subagents](https://code.claude.com/docs/en/sub-agents),
[plugin reference](https://code.claude.com/docs/en/plugins-reference),
[scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks),
[goal](https://code.claude.com/docs/en/goal). Measured: `claude --version`,
`claude --help`, `claude plugin --help`, `claude plugin list` on 2026-10-26.

### 1. Nested spawn

**Yes, by default, up to three layers below the main conversation.**
`documented` (subagents page, "Let subagents spawn their own subagents").

- At the depth limit, Claude Code withholds the `Agent` tool from every subagent
  except a fork; a fork at the limit keeps the tool but receives an error.
- `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` changes the limit. `1` turns nesting
  off. The docs record earlier defaults: five layers in 2.1.172-2.1.216, one in
  2.1.217-2.1.218, and three from 2.1.219.
- A subagent can only spawn if its `tools` list includes `Agent`. Omitting
  `Agent`, or listing it in `disallowedTools`, stops that definition from
  spawning. In a subagent definition, `Agent(type)` parentheses are ignored; the
  allowlist syntax applies only when the agent runs as the main thread.

This contradicts the current pack profile, which says "Subagents cannot spawn
other subagents" (`references/harnesses/claude.md:9`) and lists
subagent-of-subagent spawning under `LACKS` (`references/harnesses/claude.md:64`).

### 2. Registration, install, and selection

**Project and user agents** `documented`. Project `.claude/agents/*.md`
(scanned upward from cwd; closest definition wins on a name collision) and user
`~/.claude/agents/*.md`. Both are scanned recursively; identity is the `name`
frontmatter field. CLI-defined agents can be passed as JSON with `--agents`.

**Plugin agents** `documented` and `measured` (the CLI exposes
`claude plugin install`, `claude plugin list`, and `--plugin-dir`).
The plugin `agents/` directory loads by default, or the manifest `agents` field
points at specific `.md` files or directories. A subfolder inside a plugin's
`agents/` directory becomes part of the scoped identifier:
`agents/review/security.md` in plugin `my-plugin` registers as
`my-plugin:review:security`. Plugin agents are the lowest-precedence source;
project `.claude/agents/`, user `~/.claude/agents/`, and CLI-defined agents
override them. `--plugin-dir` loads a plugin without installing it.

**Selection** `documented`. The `Agent` tool's `subagent_type` takes a built-in
name (`general-purpose`, `Explore`, `Plan`) or a plugin agent name. Users can
also type `@agent-<name>` for a local agent or
`@agent-<plugin>:<name>` for a plugin agent. `--agent <name>` runs the whole
session as that agent; `--agents` defines session-only agents.

### 3. Fallback when nesting is unavailable

`documented`. At the depth limit the subagent does the delegated work itself and
returns one summary; the parent does not retry through a new child. If nesting is
disabled with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`, the main conversation
must orchestrate the work or split it across separate sessions. The page also
documents `--append-subagent-system-prompt`, which reaches nested subagents
except a fork.

### 4. Continuation and ticks

All `documented`:

- `/loop` is a bundled skill. It accepts a fixed interval (`/loop 5m ...`) or a
  prompt only, in which case Claude chooses a 1-minute to 1-hour delay each
  iteration. Bare `/loop` uses a built-in maintenance prompt or
  `.claude/loop.md` / `~/.claude/loop.md`.
- Underlying tools: `CronCreate`, `CronList`, `CronDelete` (5-field cron, local
  timezone, 50 tasks per session, jitter, 7-day expiry).
- Cloud scheduled tasks and Desktop scheduled tasks run outside an open session.
- `/goal <condition>` is a native goal mode: after each turn a model evaluates
  the condition and starts another turn if it is not met. It is a wrapper around
  a session-scoped prompt-based Stop hook.

This contradicts the pack profile's "No native goal mode"
(`references/harnesses/claude.md:33`).

### 5. Agent frontmatter fields

`documented` (subagents page field table):

| Field | Supported | Notes |
| --- | --- | --- |
| `background` | Yes | `true` keeps the subagent in the background even when Claude asks to wait. Spawned subagents already start in the background by default. |
| `is_background` | No | Not in Claude's field list. |
| `subagents` | No | Claude restricts spawning through `tools`/`disallowedTools` (`Agent`, `Agent(type)`), not a `subagents` allowlist. |
| `tools` | Yes | Allowlist; also `disallowedTools`. |
| `model` | Yes | Alias, full model ID, or `inherit`. Resolution is per-invocation `model`, then frontmatter, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the parent model. |

Other fields documented on the same table: `description`, `permissionMode`,
`mcpServers`, `hooks`, `maxTurns`, `autoCompactWindow`, `skills`,
`initialPrompt`, `memory`, `effort`, `omitClaudeMd`, `isolation`.

## Cursor

Sources: [subagents](https://cursor.com/docs/agent/subagents),
[plugins](https://cursor.com/docs/plugins),
[plugin reference](https://cursor.com/docs/reference/plugins),
[agent overview](https://cursor.com/docs/agent/overview),
[cloud agent capabilities](https://cursor.com/docs/cloud-agent/capabilities).
No Cursor CLI is installed, so every finding here is `documented` only; none is
measured.

### 1. Nested spawn

**Yes, one extra level since Cursor 2.5.** `documented` (subagents FAQ).

The main agent and its direct subagents can launch subagents, but a subagent
launched by another subagent cannot launch further ones. Nested launches also
need Task tool access in the current mode; hooks or tool policies can block
spawning. The practical tree is main -> child -> grandchild, with the grandchild
as a leaf.

### 2. Registration, install, and selection

**Project and user agents** `documented`. Project `.cursor/agents/` and user
`~/.cursor/agents/`. Cursor also reads `.claude/agents/` and `.codex/agents/`
for compatibility. Project agents take precedence when names conflict; within
the same scope `.cursor/` wins over `.claude/` and `.codex/`.

**Plugin agents** `documented`. A Cursor Plugin uses
`.cursor-plugin/plugin.json`; the manifest's `agents` field takes a path or array
of paths, and `agents/` is the default discovery folder. Agent files may be
`.md`, `.mdc`, or `.markdown`. Plugin installation is through Customize
(project or user scope) or a local folder at `~/.cursor/plugins/local`; plugin
agents are part of the plugin's components. Cursor's plugin reference documents
the `agents` manifest field and the `agents/` default folder.

**Selection** `documented`. Custom subagents appear in the Task tool's available
types. Users invoke one explicitly with `/name` or by naming it in natural
language; otherwise the parent delegates based on the `description` field. There
is no documented plugin namespace prefix for agent names in the subagent page.

### 3. Fallback when nesting is unavailable

`documented` for the limit, `unverified` for a named fallback. The FAQ only says
a subagent launched by another subagent cannot launch further. It does not
prescribe a fallback. The observable pattern is that the leaf subagent does the
work itself, or the main agent launches additional direct Task calls. Treat that
as an inference, not a documented contract.

### 4. Continuation and ticks

All `documented`:

- `/goal <objective>` gives the agent a long-lived objective until it is fully
  complete. In the CLI, Ctrl+C pauses the goal.
- `/loop` is a built-in skill that runs a prompt or skill on a recurring or
  variable interval. With no fixed interval, the agent chooses when to wake.
- Cloud agents additionally support timer subscriptions: a one-off reminder after
  a delay or a recurring cron schedule.

This contradicts the pack profile's "No native goal mode"
(`references/harnesses/cursor.md:33`).

### 5. Agent frontmatter fields

`documented` (subagent configuration table and plugin reference):

| Field | Supported | Notes |
| --- | --- | --- |
| `background` | No | Not a Cursor subagent field. |
| `is_background` | Yes | `true` runs the subagent in the background without blocking the parent. Default `false`. |
| `subagents` | No | Not documented. Nesting is controlled by the platform limit, not a field. |
| `tools` | No | No per-agent tools field. Subagents inherit all tools from the parent, including MCP tools; cloud subagents use the team's MCP configuration. |
| `model` | Yes | `inherit` (default) or a specific model ID, optionally with `[effort=...,context=...]`. |

Other documented fields: `name` (defaults to filename), `description`,
`readonly` (no file edits or state-changing shell commands).

## Codex 0.163.0

Sources: [subagents](https://developers.openai.com/codex/subagents),
[plugins](https://developers.openai.com/codex/plugins),
[build plugins](https://developers.openai.com/codex/plugins/build),
[config reference](https://developers.openai.com/codex/config-reference),
[slash commands](https://developers.openai.com/codex/reference/slash-commands).
Measured: `codex --version` (`codex-cli 0.163.0`), `codex --help`,
`codex plugin --help`, `codex features list`, and the installed binary's
`spawn_agent` tool text on 2026-10-26.

### 1. Nested spawn

**Yes.** `measured` and `documented`.

- The installed binary's `spawn_agent` tool description says: "The spawned agent
  will have the same tools as you and the ability to spawn its own subagents."
  It also documents `fork_turns` and canonical task names such as
  `/root/task1/task_3`.
- The subagents page says Codex handles orchestration "including spawning new
  subagents", and that a child inherits the parent's provider, permissions, MCP
  servers, and sandbox.
- The config reference documents `[agents].default_subagent_model`,
  `default_subagent_reasoning_effort`, `max_concurrent_threads_per_session`, and
  `agents.enabled`. It does **not** document a depth setting.

**Unverified:** the default nesting depth. The installed binary contains a
`max_depth` key in the same config struct as
`max_concurrent_threads_per_session` and the `[agents]` defaults, but no
first-party page documents its default or accepted values.

### 2. Registration, install, and selection

**Custom agents** `documented`. Standalone TOML files at
`$CODEX_HOME/agents/*.toml` (user, default `~/.codex/agents/`) or
`.codex/agents/*.toml` (project). Each file must define `name`, `description`,
and `developer_instructions`; optional fields include `model`,
`model_reasoning_effort`, `model_reasoning_summary`, `model_verbosity`,
`features.*`, and `skills.config`. The pack's installer copies
`codex-agents/*.toml` into `$CODEX_HOME/agents/`; that is an install convention,
not a Codex feature.

**Plugin agents** `documented`: none. The plugin manifest at
`.codex-plugin/plugin.json` documents `skills`, `mcpServers`, `apps`, `hooks`,
and `assets`. There is no `agents` or `subagents` component in the manifest
reference or the plugin structure. Plugins are installed from a marketplace with
`codex plugin add` / `codex plugin marketplace add`, and enabled or disabled
with `plugins.<plugin>.enabled` in `config.toml`. The pack does not
plugin-package agents for Codex.

**Unverified caveat:** the installed binary contains a `subagents` key in an
internal plugin/config summary next to `mcpServers` and `plugins`. That may be a
newer or internal field that the public manifest docs have not caught up with.
Do not rely on plugin-packaged Codex agents until the manifest docs document
them.

**Selection** `documented` and `measured`. Built-ins are `default`, `worker`, and
`explorer`. A custom agent is chosen by its `name` in a spawn request; matching
the filename to the name is only a convention. `codex --help` has no `--agent`
flag (its `agents` subcommand browses sessions, not agent definitions).

### 3. Fallback when nesting is unavailable

`documented` for disabling multi-agent tools, `unverified` for a depth fallback.
`agents.enabled = false` (or the `multi_agent` feature flag) disables the
multi-agent tools, leaving the main agent to do the work. No first-party page
states what a Codex subagent does at a nesting limit; the `max_depth` key is
undocumented. Treat depth-limit behavior as unverified.

### 4. Continuation and ticks

- `/goal` is a persistent goal mode. `documented` (slash commands page) and
  `measured` (the installed binary contains
  `/goal [<objective>|clear|edit|pause|resume]`). `features.goals` is listed as
  stable and on by default in the config reference.
- No built-in cron or loop scheduler was found in `codex --help`, the config
  reference, or the slash-command list. Timed ticks need an external cron job or
  a timed shell wait. `documented` absence for the CLI; the Codex app's separate
  automation surface was not investigated.

This contradicts the pack profile's "No native goal mode"
(`references/harnesses/codex.md:33`).

### 5. Agent frontmatter fields

Codex agents are TOML, not Markdown frontmatter. `documented`:

| Field | Supported | Notes |
| --- | --- | --- |
| `background` | No | Not a custom-agent field. |
| `is_background` | No | Not a custom-agent field. |
| `subagents` | No | Not a custom-agent field. Multi-agent enablement is global under `[agents]`. |
| `tools` | No | No tools list. Capabilities are reduced with `features.shell_tool`, `features.apps`, `features.plugins`, `features.memories`, `features.request_permissions_tool`, and `skills.config`. |
| `model` | Yes | Takes precedence over `[agents].default_subagent_model`; an explicit spawn value takes precedence over the file. |

Required fields: `name`, `description`, `developer_instructions`.

## Kimi Code 2.3.2

Sources:
[agents and sub-agents](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/agents.html),
[plugins](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html),
[goals](https://www.kimi.com/code/docs/en/kimi-code-cli/guides/goals.html),
[built-in tools](https://www.kimi.com/code/docs/en/kimi-code-cli/reference/tools.html).
Measured: `kimi --version` (`2.3.2`), `kimi --help` on 2026-10-26.

### 1. Nested spawn

**No by default; yes only with an explicit `subagents` allowlist.**
`documented`.

- Built-in `coder`, `explore`, and `plan` cannot dispatch further subagents.
- A custom agent inherits the built-in delegation allowlist (`coder`, `explore`,
  `plan`) by default, so it also cannot dispatch further.
- A custom agent opts into deeper chains by declaring `subagents` in its
  frontmatter. `*` allows every type. The main agent's effective list also
  includes every discovered custom agent.
- The docs say delegation chains always terminate and unbounded recursive
  spawning is impossible without that explicit opt-in. No maximum depth is
  stated for an opted-in chain.

### 2. Registration, install, and selection

**Registration** `documented`. Agent files are Markdown with YAML frontmatter.
Discovery scopes, highest to lowest: explicit `--agent-file` > project > extra
(`extra_agent_dirs`) > user > plugin > built-in. User directories are
`$KIMI_CODE_HOME/agents/` and `~/.agents/agents/`; project directories are
`.kimi-code/agents/` and `.agents/agents/`. A same-name higher scope wins. A
directory file needs `override: true` to replace a same-name built-in.

**Plugins** `documented`. A plugin declares `agents` in `kimi.plugin.json` (one
or more `./` paths) or simply ships an `agents/` directory. Plugin agents are
discovered while the plugin is enabled and can be delegated to by the main
agent. Plugin agents rank below every other file source; replacing a built-in
still needs `override: true`. Install/enable with `/plugins install <path-or-url>`,
`/plugins enable <id>`, `/plugins reload` in the TUI. Installation is per-user;
project-level plugin install scope is not supported.

**Selection** `documented` and `measured` (the CLI exposes `--agent <name>` and
`--agent-file <path>`). The main agent delegates automatically. To make an agent
the main agent, use `--agent <name>` or `--agent-file <path>`; an unknown name
fails with a list of available agents. Both flags only apply to a new session and
cannot be combined with `--session`/`--continue`.

### 3. Fallback when nesting is unavailable

`documented` for the termination rule, inference for the named fallback. The
default custom agent cannot dispatch further, so the chain ends at that agent:
it does the work itself and returns its result to the caller. If more delegation
is needed, the main agent must spawn the next agent or the custom agent must opt
in with `subagents`. The docs state the termination property explicitly.

### 4. Continuation and ticks

`documented`:

- `CronCreate` / `CronList` / `CronDelete` schedule a prompt in the current
  session. Five-field cron in local time, 8 KB prompt cap, 50 active tasks per
  session, deterministic jitter, coalescing on missed fires, and a 7-day stale
  final fire. `KIMI_DISABLE_CRON=1` disables the scheduler.
- `/goal <objective>` is a persistent objective across automatically continuing
  turns. It stops as `complete`, `paused`, or `blocked`; `/goal status`,
  `pause`, `resume`, `cancel`, `replace`, and `next` manage it. The objective is
  capped at 4,000 characters.
- No `/loop` command is documented. Cron is the timed tick; goal is the
  continuation.

### 5. Agent frontmatter fields

`documented`:

| Field | Supported | Notes |
| --- | --- | --- |
| `background` | No | Not an agent-file field. Use the `Agent` tool's `run_in_background` parameter (default `false`). |
| `is_background` | No | Not documented. |
| `subagents` | Yes | Sub-agent allowlist, same syntax as `tools`. Omit to inherit `coder`, `explore`, `plan`; `*` allows every type. |
| `tools` | Yes | Tool allowlist; MCP globs such as `mcp__github__*`; `tools: []` disables all tools. `disallowedTools` is the denylist. |
| `model` | Ignored | Agent files cannot set a model. A Claude-style `model:` field is explicitly ignored. Model choice is the `Agent`/`AgentSwarm` parameter when a `[secondary_model]` pool is configured, otherwise the caller's model. |

Other fields: `name` (optional, defaults to filename, must be kebab-case or the
file is skipped), `description` (required), `whenToUse`, `override`.

## Pi 1.3.0

Sources: installed package docs and example extension at
`/home/linuxbrew/.linuxbrew/Cellar/pi-coding-agent/1.3.0/libexec/lib/node_modules/@earendil-works/pi-coding-agent/`
on 2026-10-26: `docs/packages.md`, `docs/slash-commands.md`,
`examples/extensions/subagent/README.md`, `examples/extensions/subagent/agents.ts`,
`examples/extensions/subagent/index.ts`. Upstream repository:
<https://github.com/earendil-works/pi> (package.json
`repository.directory = packages/coding-agent`). Measured: `pi --version`
(`1.3.0`), `pi --help`, the installed docs and example source.

### 1. Nested spawn

**No stock subagents.** `documented` and `measured`. Pi has no built-in
`subagent` tool. The first-party route is the `subagent` example extension,
which spawns a separate `pi` process per agent:

```
pi --mode json -p --no-session --model <agent.model> --thinking <level> --tools <tools>
```

**Unverified:** whether a child can spawn its own subagent. The example extension
does not pass `--no-extensions` (measured in `index.ts`), so a child loads the
same extension set and could expose the subagent tool again. The example has no
depth guard. The host enforces no subagent depth because it has no native
subagent feature. Treat recursion as extension-dependent and unproven.

### 2. Registration, install, and selection

**Registration** `documented` and `measured`. Agent definitions are Markdown
with YAML frontmatter (`name`, `description`, `tools`, `model`) at
`~/.pi/agent/agents/*.md` (user, always loaded) or `.pi/agents/*.md` (project,
only with `agentScope: "project"` or `"both"`). Project agents override user
agents with the same name when scope is `both`.

**Install** `documented`. Agents are **not** package resources. `docs/packages.md`
lists package resources as extensions, skills, prompt templates, and themes; an
agent directory is not among them. The example README installs agents by
symlinking or copying into `~/.pi/agent/agents/`. `pi install <source>` installs
extensions/packages, not agents.

**Selection** `documented`. The extension's tool takes an `agent` name plus a
`task`, or a `tasks` list for parallel work, or a `chain` list for sequential
work. Users can also invoke the example's workflow prompts (`/implement`,
`/scout-and-plan`, `/implement-and-review`).

### 3. Fallback when nesting is unavailable

`documented` for "no stock spawn", inference for the operational fallback. With
no extension there is no spawn mechanism, so the main agent does the work. With
the example extension, the fallback for a leaf agent is the chain mode
(sequential handoff with `{previous}`) or a separate `pi` process launched by the
parent. The example caps parallel work at 8 tasks and 4 concurrent.

### 4. Continuation and ticks

**None built in.** `documented` and `measured`. The installed
`docs/slash-commands.md` lists no `/goal`, `/loop`, or cron command. The package
contains no goal extension. Use an external cron job or a timed shell wait that
re-invokes `pi`.

The pack profile already marks Pi goal mode `unverified`. The installed docs and
package support a stronger statement: no goal command is documented or present.
That is still not proof that no third-party extension could add one.

### 5. Agent frontmatter fields

`measured` from `examples/extensions/subagent/agents.ts` and `index.ts`;
`documented` in the example README:

| Field | Supported | Notes |
| --- | --- | --- |
| `background` | No | Not read by the example loader. |
| `is_background` | No | Not read by the example loader. |
| `subagents` | No | Not read by the example loader. |
| `tools` | Yes | String (`read, bash`) or YAML list; flattened and passed as `--tools`. |
| `model` | Yes | Passed as the child's `--model`. Omitted means the child inherits the parent's active provider/model and thinking level. |

`name` and `description` are required strings; a file missing either is skipped.
The extension's tool schema has no per-call `model` parameter.

## Frontmatter field matrix

| Field | Claude | Cursor | Codex (TOML) | Kimi | Pi (example) |
| --- | --- | --- | --- | --- | --- |
| `background` | Yes | No | No | No | No |
| `is_background` | No | Yes | No | No | No |
| `subagents` | No | No | No | Yes | No |
| `tools` | Yes | No | No | Yes | Yes |
| `model` | Yes | Yes | Yes | Ignored | Yes |

Notes: Claude uses `Agent` in `tools`/`disallowedTools` instead of a `subagents`
field. Cursor has no per-agent tools field because subagents inherit the
parent's tools. Codex uses `features.*` and `skills.config` instead of a tools
list. Kimi explicitly ignores a `model:` field. Pi's row describes the
first-party example extension, not a host schema.

## Discrepancies with the current pack profiles

1. `references/harnesses/claude.md:9` says "Subagents cannot spawn other
   subagents", and `:64` lists subagent-of-subagent spawning under `LACKS`.
   Current first-party docs say nesting is on by default to three layers. The
   profile needs a rewrite, not a caveat.
2. `references/harnesses/claude.md:33` says "No native goal mode." Claude has
   `/goal`; the scheduled-tasks page links to it as the condition-driven
   alternative to `/loop`.
3. `references/harnesses/cursor.md:33` says "No native goal mode." Cursor's
   agent overview documents `/goal`.
4. `references/harnesses/codex.md:33` says "No native goal mode." Codex
   documents `/goal` in its slash-command reference and lists `features.goals`
   as stable and on by default.
5. `references/harnesses/codex.md:7-8` says the per-spawn model schema is
   unverified on 0.163.0 while an explicit spawn model has the highest
   precedence. The precedence is documented; the schema remains unpublished, so
   the "no verified structured argument" conclusion still holds. Consider
   splitting the two claims.
6. `references/harnesses/pi.md:33` treats goal mode as `unverified`. The
   installed docs and package contain no goal command, so "no documented or
   installed goal mode" is the stronger supported statement.

## Could not verify

- **Cursor runtime.** `cursor-agent` is not installed. All Cursor rows are
  documented only; no spawn, `/goal`, `/loop`, or plugin-agent load was
  exercised.
- **Codex nesting depth.** The binary carries a `max_depth` key beside the
  `[agents]` settings, but no public page documents its default or range.
- **Codex plugin-packaged subagents.** Public plugin docs list no agents
  component, while the binary contains a `subagents` key in an internal
  plugin/config summary. Docs and binary do not agree; treat plugin agents as
  unsupported until documented.
- **Pi recursion.** The example child process reloads extensions and has no
  depth guard, but no end-to-end nested spawn was run.
- **Pi goal mode.** No `/goal`, `/loop`, or cron appears in the installed docs
  or package. Third-party extensions were not audited.
- **End-to-end Claude and Kimi spawns.** Behavior is documented and the
  installed versions support it, but no nested spawn was executed in this
  research run. Kimi plugin installation was also not performed.
- **Codex app automations.** The CLI has no scheduler; the desktop/app
  automation surface was out of scope and was not checked.
