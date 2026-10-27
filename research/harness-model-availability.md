# Harness model availability and per-role selection

Research date: 2026-10-27. Scope: Kimi Code, Claude Code, Cursor, Codex, Pi.

Question: how does each harness expose its available models, how can a caller choose a model for a subagent or a role, and what actually wins when a caller brief, a skill file, and the harness configuration disagree?

Method: the repo profiles in [`references/harnesses/`](../references/harnesses/) and the [adapter contract](../references/adapters/README.md) first; official documentation for every claim the profiles leave silent; the installed CLI's read-only `--help`, version, and catalog output where available. No model calls were made, and no configuration, skill, map, or ticket was modified. The Kimi `config.toml` was inspected structurally only; no credential, token, or auth value is reproduced here.

## Short answer

| Harness | How models are exposed | Per-spawn model parameter | Inheritance token | Native role → model map | If the model is unavailable |
| --- | --- | --- | --- | --- | --- |
| Kimi Code | `~/.kimi-code/config.toml` (`default_model`, `[models."<alias>"]`); `-m`/`/model`; `/provider` catalog; `kimi provider list` | `model` on `Agent` and `AgentSwarm`, only when `[secondary_model]` is configured | `primary` (caller's model and effort); omission = `default_model` when a pool exists, else caller's model | No arbitrary role map. `[secondary_model]` pool + default; Tower has worker/reviewer defaults | Invalid pool alias fails the spawn with the available choices; a broken pool entry fails session start |
| Claude Code | `~/.claude/settings.json` `model`; `--model`; `ANTHROPIC_MODEL`; `/model` picker; managed `availableModels` | `model` on the Agent tool (alias, full ID, or `inherit`) | `inherit` (also the default) | Yes — `model:` in agent Markdown frontmatter (user, project, or plugin agents) | Blocked override falls back to the inherited model or the newest permitted family; a skill/command override is ignored and the session model runs |
| Cursor | Model picker (account/plan); CLI `--model`; `--list-models` / `agent models`; BYOK | `model` on the `Task` tool; docs confirm the parent "can name a model" | `inherit` (default) | Yes — `model:` in custom subagent Markdown (`~/.cursor/agents/`, `.cursor/agents/`) | Plan/team/region block falls back to a compatible model; legacy request-based plans without Max Mode force Composer for subagents |
| Codex | `~/.codex/config.toml` `model`; `--model`/`-m`; `-c model=…`; `/model`; `codex debug models` | `model` (and `reasoning_effort`) on `spawn_agent`, gated by `[features.multi_agent_v2].expose_spawn_agent_model_overrides`; no published schema until the source is read | No `inherit` token; omission = parent model | Yes — `model` in custom agent TOML (`$CODEX_HOME/agents/`, `.codex/agents/`), plus `[agents].default_subagent_model` | No documented fallback; the model must be offered by the provider/account/workspace |
| Pi | `~/.pi/agent/settings.json` (`defaultProvider`, `defaultModel`, `enabledModels`); `models.json`; `/model`; `--model`; `--list-models` | None in the first-party `subagent` example extension | No token; omission = parent's `provider/modelId` | Only through an extension: `model:` in agent Markdown (`~/.pi/agent/agents/`, `.pi/agents/`) | A model without usable auth is absent from `/model`; no fallback documented |

The practical conclusion: only Claude, Cursor, Codex, and Pi-with-a-subagent-extension have a durable role → model binding (a file). Kimi has only a subagent-level pool plus a per-spawn argument; it has no arbitrary role map. No harness auto-loads `~/.agents/pstack-models.md`, so no start-dev brief should treat that file as the source of truth.

## Kimi Code

### 1. Exposing available models

- The configuration file is `~/.kimi-code/config.toml` (moved with `KIMI_CODE_HOME`). Top-level `default_model` is the default alias; each `[models."<alias>"]` entry declares `provider`, `model`, and `max_context_size`, with optional `capabilities`, `support_efforts`, `default_effort`, `max_output_size`, `display_name`, and `[models."<alias>".overrides]` for per-model overrides ([Configuration files](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md), [Providers and models](https://moonshotai.github.io/kimi-code/en/configuration/providers.md)).
- `/model` switches the current session; `kimi -m/--model <alias>` selects one invocation and defaults to `default_model` ([`kimi` command](https://moonshotai.github.io/kimi-code/en/reference/kimi-command.md)). `/provider` opens the provider manager and imports a catalog from models.dev or a custom registry; `kimi provider list` prints the configured providers and model counts ([Providers and models](https://moonshotai.github.io/kimi-code/en/configuration/providers.md)).
- The live 2.3.3 install inspected for this note has two providers (`managed:kimi-code`, `magpie`), 39 model aliases, top-level `default_model = "magpie/bi-dev/kimi-code-cn/k3.1-pro"`, and a `[secondary_model]` block whose `default_model` is `magpie/bi-dev/auto/GLM-5.3-Flash` with six pool aliases. `kimi doctor config` reports the file valid. The profile's version floor is 2.3.0 ([kimi.md](../references/harnesses/kimi.md)).

### 2. Selecting a model for a subagent

The `Agent` tool takes `description`, `prompt`, `subagent_type` (default `coder`), `resume`, `run_in_background` (default `false`), and `model`. `AgentSwarm` takes `prompt_template`, `items`, `subagent_type`, `model`, and `resume_agent_ids`; its `model` applies to every item-spawned subagent, and resumed subagents keep their own model ([Tools](https://moonshotai.github.io/kimi-code/en/reference/tools.md)).

The `model` parameter is offered only when a subagent pool exists — a `[secondary_model.models]` table or a lone `default_model`. Without a pool, the parameter is not advertised and subagents inherit the caller's model ([Subagent model pool](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md#subagent-model-pool)). Resolution is:

1. an explicit `model` passed in the tool call;
2. the pool's `default_model`.

`model` accepts any pool alias or the reserved `"primary"`, which means the model and effort the caller itself is running. A value that is neither a pool alias nor `"primary"` fails the spawn with an error listing the available choices. `force = true` removes the parameter entirely and rejects every explicit choice, including `"primary"`; it also cannot be combined with a `models` table ([Subagent model pool](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md#subagent-model-pool)).

Agent files are Markdown with `name`, `description`, `whenToUse`, `override`, `tools`, `disallowedTools`, and `subagents`; there is no `model` field. Unknown fields, including a Claude-style `model:`, are ignored ([Agents and Sub-Agents](https://moonshotai.github.io/kimi-code/en/customization/agents.md)). The profile states the same ([kimi.md](../references/harnesses/kimi.md)).

### 3. Native role → model mapping

There is no arbitrary role → model mapping and no per-agent model field. The native stores are:

- the global `default_model` for the main agent;
- `[secondary_model]` for subagents, with one `default_model`, an optional alias pool, optional `force`, and an optional section-wide `default_effort`;
- Tower, the only role-shaped surface: workers default to `[secondary_model].default_model` while reviewers stay on the primary model, unless `force = true` makes reviewers use `default_model` too. A Tower spawn can explicitly choose only `primary` or an alias in `[secondary_model.models]`; aliases that exist only in `[models]` are rejected ([Tower](https://moonshotai.github.io/kimi-code/en/guides/tower.md)).

Role intent such as "reviewer uses model X" otherwise lives only in prose or in a skill-read convention. The profile records `~/.agents/pstack-models.md` as such a convention: no harness auto-loads it, and it cannot make a model available ([kimi.md](../references/harnesses/kimi.md)).

### 4. Unavailable model, missing config, unresolvable alias

- An alias is usable only when it exists in `[models]` and its provider authenticates. A provider deleted or logged out, or a refreshed model list that no longer contains a pool alias, makes session creation, resume, and fork fail at startup with a configuration error naming the broken alias. The section is never rewritten automatically ([Subagent model pool](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md#subagent-model-pool)).
- Configuration errors fail loudly rather than falling back silently: a missing `default_model` when a `models` table exists, a default that is not a pool key, an unresolvable pool key, or `force` without `default_model` all fail at startup ([Subagent model pool](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md#subagent-model-pool)).
- A provider with no credential fails at startup with an error naming the missing credential; `api_key`/`api_key_env`, then the provider `env` sub-table, are the only sources ([Providers and models](https://moonshotai.github.io/kimi-code/en/configuration/providers.md), [Config overrides](https://moonshotai.github.io/kimi-code/en/configuration/overrides.md)).
- With no `config.toml`, there are no aliases to select. `/login` provisions the managed `kimi-code/*` aliases and credentials; `/provider` imports third-party catalogs ([Providers and models](https://moonshotai.github.io/kimi-code/en/configuration/providers.md)).

### 5. Can a skill override the model for its internal spawns?

Kimi skills are prompt text; they have no model frontmatter. A skill can *instruct* the main agent to pass `model: "<alias>"` to `Agent`/`AgentSwarm`, and that works because the harness honors the tool argument. It cannot make an alias available, and it cannot beat `force = true`: the forced model rejects an explicit model argument, `primary` included. Without a pool the parameter does not exist, so a skill's instruction has no structured effect ([Subagent model pool](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md#subagent-model-pool)). Agent files cannot carry the binding at all ([Agents and Sub-Agents](https://moonshotai.github.io/kimi-code/en/customization/agents.md)).

Precedence is therefore: harness config (pool membership, `force`, provider auth) > the actual `model` argument on the tool call > prose from the caller brief or the skill. The caller brief and the skill file have no harness-enforced ordering relative to each other; both are instructions to the same model, and the model reconciles them.

### 6. `~/.kimi-code/config.toml` schema, and what a user can choose per role today

The relevant schema, from [Configuration files](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md):

```toml
default_model = "<alias>"          # must be defined in [models]

[models."<alias>"]
provider = "<provider id>"         # required
model = "<server model id>"        # required
max_context_size = 1048576         # required
capabilities = ["thinking", "image_in", "video_in", "tool_use"]
support_efforts = ["low", "high", "max"]
default_effort = "high"

[models."<alias>".overrides]       # pin fields that managed refreshes would rewrite
default_effort = "max"

[secondary_model]
default_model = "<pool alias>"     # required when [secondary_model.models] exists; must be a pool key
default_effort = "high"            # optional, section-wide effort for every spawn

[secondary_model.models]           # optional pool; key = alias, value = selection hint
"<alias>" = "selection hint"

# Alternative to the pool, not combinable with it:
# [secondary_model]
# default_model = "<alias>"
# force = true                     # pin every subagent and remove the model parameter
```

`primary` is reserved and cannot be a pool key. The live install still carries `[experimental].secondary-model = true`, but the changelog says the pool is always on and the experimental flag was removed; that key is stale, not a gate ([Changelog](https://moonshotai.github.io/kimi-code/en/release-notes/changelog.md), [Subagent model pool](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md#subagent-model-pool)).

What a user can choose per role today:

- main agent: `default_model`, `-m`, or `/model`;
- all subagents: `[secondary_model].default_model`, or `force = true` to make it non-negotiable;
- an individual subagent: a pool alias or `"primary"` via the `Agent`/`AgentSwarm` `model` argument, chosen by the main agent at spawn time;
- Tower workers vs reviewers: the worker default is `default_model`; reviewers stay on primary unless forced; a new Tower spawn can name `primary` or a pool alias.

There is no file that says "role `reviewer` uses model `X`". A brief that needs that must supply the mapping itself and require the spawn call to pass it.

## Claude Code

### 1. Exposing available models

- `~/.claude/settings.json` has a `model` setting; `--model` selects a session model and `ANTHROPIC_MODEL` supplies one; `/model` opens the picker and writes the chosen default back to user settings ([Model configuration](https://code.claude.com/docs/en/model-config)).
- Aliases are `default`, `best`, `fable`, `sonnet`, `opus`, `haiku`, `opusplan`, and `sonnet[1m]`/`opus[1m]`; a full model ID or a provider-specific ID also works. `availableModels`, `enforceAvailableModels`, and `deniedModels` restrict what users and subagents may select ([Model configuration](https://code.claude.com/docs/en/model-config)).
- There is no `claude models` listing command in the installed 2.1.307 `--help`; the picker and the managed allowlist are the exposure surfaces. The profile records the same configuration points ([claude.md](../references/harnesses/claude.md)).

### 2. Selecting a model for a subagent

The Agent tool takes `description`, `prompt`, `subagent_type`, `model` (alias, full ID, or `inherit`), `effort`, and `isolation` ([claude.md](../references/harnesses/claude.md)). Official docs confirm that "when Claude invokes a subagent, it can also pass a `model` parameter for that specific invocation" ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)).

Resolution order ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)):

1. the per-invocation `model` parameter;
2. the subagent definition's `model` frontmatter (`inherit` selects the main conversation's model);
3. `CLAUDE_CODE_SUBAGENT_MODEL`, when set to an alias or model ID;
4. the main conversation's model.

`inherit` means the main conversation's model and is also the default. Setting `CLAUDE_CODE_SUBAGENT_MODEL=inherit` is the same as leaving it unset. A mod's `agent.spawn` hook model replaces the per-invocation parameter. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (v2.1.257+) ignores frontmatter and the per-invocation parameter and applies one model to every subagent, with the documented built-in Explore exception ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)).

### 3. Native role → model mapping

Yes. Custom subagents are Markdown files whose frontmatter accepts `model`: an alias, a full ID, or `inherit`. Locations are project `.claude/agents/`, user `~/.claude/agents/`, and plugin `agents/`; the role name is the `subagent_type` ([Create custom subagents](https://code.claude.com/docs/en/sub-agents), [claude.md](../references/harnesses/claude.md)). This is the durable role binding.

There is a second, narrower mapping: a skill or command may carry a `model` frontmatter field. It applies for the rest of the current turn, is not saved to settings, and with `context: fork` it sets the forked subagent's model; an excluded value is ignored and the session keeps its model ([Extend Claude with skills](https://code.claude.com/docs/en/skills)). That is a skill-level binding, not a role map.

### 4. Unavailable model, missing config, unresolvable alias

- The alias or full ID must resolve for the configured provider and account. A blocked subagent or teammate override runs on a fallback model rather than failing; a blocked family alias substitutes the newest permitted version of the family, otherwise the inherited model. Interactive sessions warn with both requested and substituted models ([Model configuration](https://code.claude.com/docs/en/model-config)).
- A blocked skill or command override is ignored, including a blocked family alias, and the skill/command runs on the session model; a skill that runs in a subagent follows the subagent fallback instead ([Model configuration](https://code.claude.com/docs/en/model-config)).
- A mistyped `--model`, `ANTHROPIC_MODEL`, or settings `model` is not checked up front and produces "There's an issue with the selected model" on the first request. A model selected through the Agent SDK or a switch validates locally or with the provider ([Model configuration](https://code.claude.com/docs/en/model-config)).
- With no settings file, there is no override: the Default option resolves to the account's runtime default, or the organization default when an admin set one ([Model configuration](https://code.claude.com/docs/en/model-config)).

### 5. Can a skill override the model for its internal spawns?

Yes, in two distinct ways:

- **Enforced:** the skill's `model` frontmatter changes the model for the turn; with `context: fork`, it sets the forked subagent's model. An excluded value is not used ([Extend Claude with skills](https://code.claude.com/docs/en/skills)).
- **Advisory:** prose in the skill can tell the agent to pass a `model` argument on an Agent call, but that is the same kind of instruction as the caller's brief.

Precedence for a spawn: a mod `agent.spawn` hook model (if installed) > per-invocation `model` argument > subagent frontmatter > `CLAUDE_CODE_SUBAGENT_MODEL` > session model (which a skill's `model` can change for its turn). `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` overrides frontmatter and the per-call argument. The caller brief and skill prose have no harness-enforced ordering; only the structured fields do.

### 6. What this means for role pinning

A role's `model:` frontmatter survives a skill that merely *mentions* another model, but it does not survive a skill that passes an explicit `model` argument on the Agent call. The only harness-level way to defeat such an argument is `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (one model for all subagents) or a plugin `agent.spawn` hook that rewrites the model by role ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)).

## Cursor

### 1. Exposing available models

- The Cursor model picker exposes the account and plan catalog; the CLI has `--model` and `--list-models`, and `agent models` lists the models for the account ([Cursor CLI parameters](https://cursor.com/docs/cli/reference/parameters), [cursor.md](../references/harnesses/cursor.md)).
- Third-party models require the plan/BYOK entitlement; the picker and `--list-models` are the runtime authority ([cursor.md](../references/harnesses/cursor.md), [Models & Pricing](https://cursor.com/docs/models)).

### 2. Selecting a model for a subagent

- The `Task` tool takes `description`, `prompt`, `subagent_type`, `environment` (`"cloud"` or `"local"`), `run_in_background`, `cloud_base_branch`, and `model` ([cursor.md](../references/harnesses/cursor.md)).
- Official docs confirm the capability but not a parameter table: "The parent agent can name a model when it launches a subagent" ([Subagents](https://cursor.com/docs/subagents)). Cursor's `subagentStart` hook input carries `subagent_model` — "Model the subagent will use" — which corroborates the resolved value but is not the tool schema ([Hooks](https://cursor.com/docs/hooks)).
- A custom subagent's frontmatter `model` is `inherit` (default) or a model ID, optionally with `[effort=…,context=…]`; built-in Explore and Browser choose their own model ([Subagents](https://cursor.com/docs/subagents)).

### 3. Native role → model mapping

Yes. Custom subagent Markdown files live in `.cursor/agents/` (project) and `~/.cursor/agents/` (user), with compatibility locations `.claude/agents/` and `.codex/agents/`; project files win on name collisions, and `.cursor/` wins over the compatibility directories. The role name is the subagent type; `model:` is the durable binding ([Subagents](https://cursor.com/docs/subagents)). Built-in subagents are not configurable through this mechanism.

### 4. Unavailable model, missing config, unresolvable alias

- The ID must be in the account catalog and allowed by plan, region, and team admin allowlist. A blocked or plan-limited ID falls back to a compatible model; a legacy request-based plan without Max Mode makes subagents run Composer regardless of the `model` setting, and if Composer is blocked, subagents run only with Max Mode ([Subagents](https://cursor.com/docs/subagents)).
- The profile records that `inherit` nominally runs the parent chat model but is reported to resolve incorrectly (a Grok parent returned GPT-5.5 Medium, forum.cursor.com 2026-07); verify the resolved model before relying on it ([cursor.md](../references/harnesses/cursor.md)). The official docs still describe `inherit` as "the same model as the parent agent" ([Subagents](https://cursor.com/docs/subagents)).
- Without a custom subagent file, the built-ins still work and default to `inherit`; there is no global subagent-model setting, so the per-file frontmatter is the control ([Subagents](https://cursor.com/docs/subagents)).

### 5. Can a skill override the model for its internal spawns?

Cursor skills are prose. They can instruct the parent to launch a Task with a `model`, or to use a custom subagent whose frontmatter carries one, but there is no skill frontmatter model binding documented. The frontmatter binding is the durable part; a parent Task `model` is a per-spawn override, and the docs do not state which wins when both are present. No force switch is documented. The caller brief and skill prose have no harness-enforced ordering.

## Codex

### 1. Exposing available models

- `~/.codex/config.toml` has `model` and `model_provider`; `--model`/`-m` and `-c model=…` select one run; `--profile` layers `$CODEX_HOME/<name>.config.toml`; the interactive `/model` switches models ([Config basics](https://developers.openai.com/codex/config-basic), [Models](https://developers.openai.com/codex/models), [codex.md](../references/harnesses/codex.md)).
- `codex debug models` renders the raw catalog as JSON; `--bundled` skips a refresh. A custom or gateway provider can supply a catalog with `model_catalog_json` (startup) or `model_providers.<id>.model_catalog_url` ([Configuration reference](https://developers.openai.com/codex/config-reference)). On the installed 0.163.0, `codex debug models` returned a catalog including the local `magpie` aliases.

### 2. Selecting a model for a subagent

- `[agents].default_subagent_model` and `default_subagent_reasoning_effort` set the default for spawned agents; an explicit spawn model takes precedence over that default ([Subagents](https://developers.openai.com/codex/subagents), [Configuration reference](https://developers.openai.com/codex/config-reference)).
- A custom agent TOML may set `model` and `model_reasoning_effort`; if it does, "the value in the file takes precedence." Before applying the file, Codex resolves each setting from an explicit spawn value, then the `[agents]` default, then the parent's value. A file that sets only `model` preserves the previously resolved effort ([Subagents](https://developers.openai.com/codex/subagents)).
- The `spawn_agent` tool schema on the current `main` branch has optional `model` and `reasoning_effort` properties. In the v2 tool they are removed unless `[features.multi_agent_v2].expose_spawn_agent_model_overrides` is true; the source constructor defaults it to `true`, and the schema description says "Model override for the new agent. Omit unless an explicit override is needed." The v1 namespace schema has the same properties ([multi_agents_spec.rs](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs), [config.schema.json](https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json)). The repo profile's "schema unverified on 0.163.0" caveat is consistent with the docs, but the current source does publish the field; verify it against the installed version before relying on it ([codex.md](../references/harnesses/codex.md)).
- There is no `inherit` token. An omitted model runs on the parent's model; an omitted reasoning effort inherits the parent's effort, unless an explicit or `[agents]` model was selected, in which case that model's default effort is used ([Subagents](https://developers.openai.com/codex/subagents)).

### 3. Native role → model mapping

Yes. Custom agents are standalone TOML files at `$CODEX_HOME/agents/*.toml` (user) or `.codex/agents/*.toml` (project), each requiring `name`, `description`, and `developer_instructions`, with optional `model`, `model_reasoning_effort`, `model_reasoning_summary`, and `model_verbosity`. The role name is the agent `name` ([Subagents](https://developers.openai.com/codex/subagents), [codex.md](../references/harnesses/codex.md)). `[agents].default_subagent_model` is the global fallback. A custom agent cannot override `model_provider`, `sandbox_mode`, or `mcp_servers` ([Subagents](https://developers.openai.com/codex/subagents)).

### 4. Unavailable model, missing config, unresolvable alias

- The model string must be offered by the selected provider, account, and workspace. Custom or gateway providers can supply a catalog through `model_catalog_json` or `model_catalog_url`; a profile can override `model_catalog_json`; project config cannot set `model_provider` ([Configuration reference](https://developers.openai.com/codex/config-reference), [codex.md](../references/harnesses/codex.md)).
- No automatic fallback is documented. The docs direct you to choose a model available to your account or workspace ([Subagents](https://developers.openai.com/codex/subagents), [Models](https://developers.openai.com/codex/models)).
- With no `model` key, Codex uses its configured default for the provider/account. `codex debug models` is the catalog authority ([Config basics](https://developers.openai.com/codex/config-basic), [Configuration reference](https://developers.openai.com/codex/config-reference)).

### 5. Can a skill override the model for its internal spawns?

Skill prose can request a model; the official docs say Codex delegates when applicable `AGENTS.md` or skill instructions request it, and "request a specific model or reasoning effort in your prompt" is one of the documented ways to choose ([Subagents](https://developers.openai.com/codex/subagents)). The structured `spawn_agent.model` field exists in the current source ([multi_agents_spec.rs](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)). But a custom agent file's `model` takes precedence over the spawn value per the docs, so a skill cannot override a pinned role file by passing a different model. `model_provider` is not overridable at spawn or in a custom agent file.

Precedence: harness config (`model_provider`, catalog, `[agents]` defaults) > custom agent file `model` > explicit spawn `model` > parent model. The caller brief and skill prose have no harness-enforced ordering; the structured fields do.

### 6. What this means for role pinning

A custom agent TOML with `model` is the strongest native per-role pin: the docs explicitly say the file's model wins over an explicit spawn value. The brief can name the agent and rely on the file. If the role must be able to vary per spawn, leave `model` out of the file and pass it on `spawn_agent`, or set `[agents].default_subagent_model`.

## Pi

### 1. Exposing available models

- `~/.pi/agent/settings.json` has `defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `modelThinkingLevels`, and `enabledModels` (model patterns for startup selection and Ctrl+P cycling). `~/.pi/agent/models.json` adds or overrides providers and models; `modelOverrides` changes metadata for existing models without replacing the provider list ([Settings](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md), [Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)).
- `/model` opens a searchable picker showing only models whose providers have usable authentication; `--model` selects per invocation (`provider/id`, optional `:<thinking>`), `--list-models [search]` lists, and `--models <patterns>` controls cycling ([Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md), `pi --help` 1.3.0).
- Credentials come from `/login`, `auth.json`, `models.json` `apiKey`, a runtime `--api-key`, or the provider's environment variable. The read-only `pi --list-models --offline` on this host printed "No models available. Use /login to log into a provider" ([Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)).

### 2. Selecting a model for a subagent

Pi core ships no subagent tool; its README says it "skips features like sub-agents" and tells users to install a package or build one ([Pi README](https://github.com/earendil-works/pi/blob/main/README.md)). The first-party `subagent` example extension spawns one `pi` process per agent and its tool parameters are `agent`, `task`, `tasks`, `chain`, `agentScope`, `confirmProjectAgents`, and `cwd` — there is no `model` parameter ([subagent/index.ts](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/index.ts)).

The child is launched with `--mode json -p --no-session`, plus `--model <agent.model>` when the agent file has one, plus `--tools` when the file declares tools. If the agent file has no `model`, the extension passes the parent's `provider/modelId`; the parent's thinking level is passed only when the agent does not set its own model. There is no `inherit` token; omission means the parent's active model and thinking level ([subagent/index.ts](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/index.ts), [pi.md](../references/harnesses/pi.md)).

### 3. Native role → model mapping

Only through an extension. The first-party example discovers agents as Markdown files under `getAgentDir()/agents` — `~/.pi/agent/agents/*.md` — and project `.pi/agents/*.md` when `agentScope` is `"project"` or `"both"`. Frontmatter is `name`, `description`, `tools`, and `model`; the body is the system prompt. The role name is the agent `name` ([agents.ts](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/agents.ts), [pi.md](../references/harnesses/pi.md)).

Pi core has no role map, and agents are not package resources: a package cannot declare `agents/`, so distributing roles needs a second install step into `~/.pi/agent/agents/` or a custom extension ([pi.md](../references/harnesses/pi.md)).

### 4. Unavailable model, missing config, unresolvable alias

- A model must be in Pi's bundled or custom catalog and its provider must have usable authentication. A model without a resolved credential does not appear in `/model`; custom models can load from `models.json` but stay unavailable until credentials resolve ([Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)).
- No fallback is documented. Pi has no documented substitution for an unknown model, and the extension passes the agent file's value straight to the child's `--model` ([Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md), [subagent/index.ts](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/index.ts)).
- With no settings, `defaultProvider`/`defaultModel` are "Automatic" and the picker is empty until authentication; `/login` is the setup path ([Settings](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md), [Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)).

### 5. Can a skill override the model for its internal spawns?

Not structurally. A skill is prose; the extension reads the model from the agent file and passes it as `--model`. There is no per-spawn `model` argument, so a skill cannot override the role file at spawn time. `--model` at process launch selects the parent's model; an agent file with `model` overrides it for that child, and an agent file without one makes the child use the parent's `provider/modelId` ([subagent/index.ts](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/index.ts)). A skill's prose can only persuade the parent to choose a different agent name or to launch a differently configured process.

## Precedence across harnesses

There are two different questions that are easy to conflate:

1. **Structured precedence** — what the harness enforces. This is real and documented.
2. **Prose precedence** — whether a caller brief or a skill file "wins". No harness ranks two natural-language instructions. The model reconciles them, so a skill can ignore a brief or vice versa unless the harness has a structured field.

Structured precedence, strongest first:

- **Kimi:** pool membership and `force` / provider auth → the `model` argument actually passed on the `Agent`/`AgentSwarm` call → `default_model` → caller's model. Agent-file `model:` is ignored.
- **Claude:** `agent.spawn` hook model (if installed) → per-invocation `model` → subagent frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → session model; `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` overrides frontmatter and per-invocation. A skill `model` sets the turn's session model, and with `context: fork` the forked subagent's model.
- **Cursor:** account/plan/team allowlist → custom subagent frontmatter (`model`) or a parent Task `model` (the docs do not state which of these two wins) → `inherit`/parent.
- **Codex:** provider/catalog → custom agent file `model` (docs say it wins over an explicit spawn) → explicit spawn `model` → `[agents].default_subagent_model` → parent.
- **Pi:** provider/credential catalog → agent file `model` → parent's `provider/modelId`; `--model` sets the parent, not the child override.

In every harness, a harness-level allowlist, plan restriction, or forced model wins over anything a brief or skill says. If the requested model is blocked, the harness either refuses the choice (Kimi; Pi has no documented fallback), falls back (Claude, Cursor), or leaves it to the provider (Codex).

## Recommended start-dev binding, per harness

The goal: a brief specifies a fixed per-role model, and a pstack skill's internal spawns honor it, without assuming a universal `~/.agents/pstack-models.md`. No harness auto-loads that file, so the brief must carry the mapping and point at a native store (or make the skill read the file explicitly).

### Kimi Code

1. Register each role alias in `[models."<alias>"]` and list it in `[secondary_model.models]` with a hint. This makes the alias both selectable and visible to the main agent's tool description.
2. In the brief, give an explicit `role → alias` table and require every `Agent`/`AgentSwarm` call to pass `model: "<alias>"`. This is the only per-role mechanism; a spawn that omits it gets `default_model`, not the role model.
3. If the skill cannot be edited to pass the argument, the only native fallback is `force = true` plus `default_model`, which pins *all* subagents to one model — not per-role. There is no native per-role pin. Do not put `model:` in agent files; it is ignored.
4. Verify with the `subagent.spawned` wire event, which records the model and effort ([kimi.md](../references/harnesses/kimi.md)).

A brief line that works: "For each spawn, pass `model` explicitly: implementer → `<implementer-alias>`, reviewer → `<reviewer-alias>`, explorer → `primary`. If the alias is not in `[secondary_model.models]`, stop and report the available choices; do not silently fall back."

### Claude Code

1. Create one agent Markdown file per role with `model:` in frontmatter (user `~/.claude/agents/<role>.md` or project `.claude/agents/<role>.md`). The brief names the role as `subagent_type`.
2. Warn that a per-invocation `model` argument in the skill overrides the file. If the skill is known to pass one and the role must stay fixed, use a plugin `agent.spawn` hook that rewrites by role, or `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` if one model for all subagents is acceptable.
3. Use `inherit` as the explicit "no preference" value; it is also the default. A blocked alias falls back and warns, so the brief should treat a warning as a verification failure if the role is meant to be fixed.

A brief line: "Spawn `reviewer` (agent file pins `model: opus`). Do not pass a per-call `model` for this role. If Claude reports a model substitution, stop and report it."

### Cursor

1. Create custom subagent Markdown in `~/.cursor/agents/<role>.md` (or project `.cursor/agents/`) with `model:` and, where useful, `[effort=…,context=…]`. The brief names the subagent type.
2. Do not pass a Task `model` from the skill when the role file is meant to win; the docs do not define that precedence, so the safest fixed-role design is "role file only, no per-call model."
3. Expect plan/team/region restrictions to substitute a compatible model; a legacy request-based plan without Max Mode forces Composer for subagents. Built-in Explore and Browser ignore role files.
4. Verify the model on the subagent task card (the docs say the card shows which model ran) ([Subagents](https://cursor.com/docs/subagents)).

A brief line: "Use the `reviewer` subagent; its file pins `model: claude-opus-5[effort=high]`. Do not name a model on the Task call. If the task card shows a different model, report the substitution."

### Codex

1. Create `$CODEX_HOME/agents/<role>.toml` (user) or `.codex/agents/<role>.toml` (project) with `name`, `description`, `developer_instructions`, and `model` / `model_reasoning_effort`. The docs say a file's model takes precedence over an explicit spawn value, which makes this the strongest native per-role pin.
2. Use `[agents].default_subagent_model` for a global fallback. Set `model_provider` in the parent config; a custom agent cannot override it.
3. If per-spawn flexibility is required, omit `model` from the file and pass it on `spawn_agent` (current source) or rely on `[agents]` defaults; on 0.163.0, verify the field is exposed before depending on it.

A brief line: "Spawn the `reviewer` agent defined in `$CODEX_HOME/agents/reviewer.toml`. Its TOML pins the model; do not override it. If the agent is missing, fall back to `[agents].default_subagent_model` and say so."

### Pi

1. Pi core has no subagents. Install a subagent extension (the first-party example or a third-party package) and create `~/.pi/agent/agents/<role>.md` with `name`, `description`, `tools`, and `model:`. The brief names the agent.
2. There is no per-spawn model argument in the first-party extension, so the role file is authoritative. Use `--model` only to set the parent; an agent file without `model` inherits the parent's `provider/modelId`.
3. If the extension is absent, the brief must say so; there is no fallback spawn mechanism in core.

A brief line: "Use the `subagent` extension with the `reviewer` agent from `~/.pi/agent/agents/reviewer.md`; its frontmatter pins the model. Do not expect a per-call model parameter. If the extension is not installed, stop and report that."

### Cross-harness brief shape

A portable brief should carry a table like:

| Role | Kimi | Claude | Cursor | Codex | Pi |
| --- | --- | --- | --- | --- | --- |
| implementer | pool alias + explicit `model` | agent `model:` | subagent `model:` | agent TOML `model` | agent `model:` |
| reviewer | pool alias + explicit `model` | agent `model:` | subagent `model:` | agent TOML `model` | agent `model:` |
| explorer | `primary` or fast alias | `haiku` or `inherit` | built-in Explore (own model) | `explorer` or custom | agent `model:` |

and a rule: "Use the harness-native binding above. If it is missing, do not invent a model; report which native store is absent. Do not rely on a shared `~/.agents/pstack-models.md` unless the skill is explicitly told to read it."

## Conflicts and gaps between the profiles and the official docs

- **Codex per-spawn schema.** The profile says the structured `spawn_agent` argument schema is "unverified on 0.163.0" and recommends a custom agent TOML or `[agents]` defaults ([codex.md](../references/harnesses/codex.md)). The current `main` source has `model` and `reasoning_effort` in both v1 and v2 schemas, with v2 gated by `[features.multi_agent_v2].expose_spawn_agent_model_overrides` ([multi_agents_spec.rs](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs), [config.schema.json](https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json)). This is a version gap, not necessarily a contradiction: verify on the installed binary.
- **Codex precedence wording.** The profile says "a custom agent TOML `model` ... overrides per agent; an explicit spawn request takes precedence" ([codex.md](../references/harnesses/codex.md)). The official docs say the custom agent file's `model` takes precedence, with the explicit spawn value resolved first and then overridden by the file ([Subagents](https://developers.openai.com/codex/subagents)). Treat the file as the stronger pin.
- **Cursor `inherit`.** The docs say `inherit` uses the same model as the parent ([Subagents](https://cursor.com/docs/subagents)); the profile records a 2026-07 forum report that a Grok parent returned GPT-5.5 Medium ([cursor.md](../references/harnesses/cursor.md)). The docs are the contract; the field report is a reason to verify the resolved model.
- **Cursor Task schema.** The official subagents page confirms that the parent can name a model but does not publish the Task parameter table; the profile names the parameter `model` ([cursor.md](../references/harnesses/cursor.md)). The `subagentStart` hook's `subagent_model` field confirms the resolved value but not the argument name ([Hooks](https://cursor.com/docs/hooks)).
- **Kimi experimental flag.** The docs and changelog say the subagent pool is always on and the experimental secondary-model flag was removed ([Changelog](https://moonshotai.github.io/kimi-code/en/release-notes/changelog.md)); the inspected `config.toml` still contains `[experimental].secondary-model = true`. The stale key does not gate the feature on 2.3.3.
- **Pi "no subagents".** The README says Pi skips sub-agents ([Pi README](https://github.com/earendil-works/pi/blob/main/README.md)); the profile describes a first-party `subagent` *example extension* ([pi.md](../references/harnesses/pi.md)). Both are true: core has none, and the example is a separate extension that is not installed by the Homebrew package used for this probe.

## Verification notes

Read-only checks performed on 2026-10-27:

- `kimi --version` → 2.3.3; `kimi --help`; `kimi provider list`; `kimi doctor config` → valid.
- `claude --version` → 2.1.307; `claude --help`; `claude agents --help`.
- `codex --version` → 0.163.0; `codex --help`; `codex debug models` (catalog returned).
- `pi --version` → 1.3.0; `pi --help`; `pi --list-models --offline` (no providers authenticated, so no model list).
- Kimi `config.toml` was read structurally: table and key names, plus non-secret model aliases and the top-level/pool defaults. Credential values, tokens, and auth data were not printed.

Not run: any model call, any skill invocation, any Cursor CLI command (Cursor CLI is not installed), and any change to configs, skills, the map, or the ticket.

## Sources

- Repo profiles: [kimi.md](../references/harnesses/kimi.md), [claude.md](../references/harnesses/claude.md), [cursor.md](../references/harnesses/cursor.md), [codex.md](../references/harnesses/codex.md), [pi.md](../references/harnesses/pi.md); [adapter contract](../references/adapters/README.md).
- Kimi: [Providers and models](https://moonshotai.github.io/kimi-code/en/configuration/providers.md), [Configuration files](https://moonshotai.github.io/kimi-code/en/configuration/config-files.md), [Agents and Sub-Agents](https://moonshotai.github.io/kimi-code/en/customization/agents.md), [Tools](https://moonshotai.github.io/kimi-code/en/reference/tools.md), [Slash commands](https://moonshotai.github.io/kimi-code/en/reference/slash-commands.md), [Tower](https://moonshotai.github.io/kimi-code/en/guides/tower.md), [Changelog](https://moonshotai.github.io/kimi-code/en/release-notes/changelog.md), [`kimi` command](https://moonshotai.github.io/kimi-code/en/reference/kimi-command.md).
- Claude: [Model configuration](https://code.claude.com/docs/en/model-config), [Create custom subagents](https://code.claude.com/docs/en/sub-agents), [Extend Claude with skills](https://code.claude.com/docs/en/skills).
- Cursor: [Subagents](https://cursor.com/docs/subagents), [CLI parameters](https://cursor.com/docs/cli/reference/parameters), [Hooks](https://cursor.com/docs/hooks), [Models & Pricing](https://cursor.com/docs/models).
- Codex: [Subagents](https://developers.openai.com/codex/subagents), [Configuration reference](https://developers.openai.com/codex/config-reference), [Config basics](https://developers.openai.com/codex/config-basic), [Models](https://developers.openai.com/codex/models), [multi_agents_spec.rs](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs), [config.schema.json](https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json).
- Pi: [README](https://github.com/earendil-works/pi/blob/main/README.md), [Choose a Model](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md), [Settings](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md), [subagent extension](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/index.ts), [agent discovery](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/agents.ts).
