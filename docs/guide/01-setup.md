# Set up a workspace

Use this guide to onboard a repository for the gfunc pack's Wayfinder and pstack workflows. [`/setup-workspace`](../../skills/setup-workspace/SKILL.md) discovers existing configuration, previews changes, completes approved phases, and reports what remains.

## Use the loaded pack or a plain clone

Reuse an already-loaded gfunc plugin. Repository setup does not require another install. A plain clone also works without installation.

Examples use short skill names. Use the spelling shown by your host's skill menu. Kimi requires qualified plugin names, such as `/gfunc-skills:setup-workspace`, as the [Kimi profile](../../references/harnesses/kimi.md) explains.

For a plain clone, select the harness from the pack checkout at session start:

```bash
scripts/resolve-harness --harness <name>
```

Replace `<name>` with your harness name from the [adapter contract](../../references/adapters/README.md). Give the agent the returned pointer and the consuming repository's path. If the host has not loaded clone skills, ask the agent to read and follow `<pack-root>/skills/setup-workspace/SKILL.md`. The contract owns profile selection and native-host delivery. A missing or mismatched profile stops only the actions that need it.

## Run workspace setup

In the target repository, invoke:

```text
/setup-workspace
```

The flow inspects tracker instructions, repository guidance, domain documents, check commands, model preferences, plugin state, and verification skills before proposing writes. Review each concrete preview before approving its effects. Selecting a phase alone does not approve its writes or execution.

For repository wiring, expect these limits:

- Local Markdown under `.scratch/` is the tracker default, even when a Git remote exists. Setup does not create `docs/issue-tracker.md` just to restate that default.
- Existing custom tracker instructions remain authoritative. Legacy migration gets a preview and a compatibility pointer. Conflicting tracker documents require your choice.
- Setup updates one existing guidance owner. If neither `AGENTS.md` nor `CLAUDE.md` exists, it proposes `AGENTS.md`. It preserves custom and nested instructions and does not create empty glossaries, ADRs, or context maps.
- A selected remote tracker permits only approved local instructions and read-only capability checks. Setup does not create labels, issues, maps, or PRs.

The [repository wiring guide](../../skills/setup-workspace/references/repository-wiring.md) owns the exact file and migration rules.

If `~/.agents/pstack-models.md` exists, setup validates the effective choices and preserves the file unless you select reconfiguration. If preferences are missing, setup offers configuration once. Accepting the phase runs [`/setup-pstack`](../../skills/setup-pstack/SKILL.md) within the same conversation. It completes selection, availability checks, and any separately approved preference write, then returns to workspace setup. You do not need to invoke another command.

A recorded model preference does not provision that model. Setup reports unavailable or unconfirmed roles without changing native provider settings or credentials. Declining model configuration does not block repository wiring.

## Choose optional verification work

When no project-local verification skill exists, workspace setup offers generation once. An existing harness does not suppress the offer. The new skill wraps that harness instead of duplicating it. For a usable stale or incomplete skill, setup offers maintenance once. If several candidates exist, choose the target explicitly. An unusable skill is a reported gap, not permission to replace it.

Before accepted work runs, review the proposed files, launch and doctor commands, real journey, isolated data, evidence location, and cleanup. This approval covers only the previewed local work. It does not authorize dependency installation, native repairs, paid calls, shared or production resources, product-code fixes, commits, or PRs.

[`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md) owns generation and its proof requirements. It must execute at least one mapped real consumer journey and preserve evidence after cleanup. [`/maintain-verification-skill`](../../skills/maintain-verification-skill/SKILL.md) owns maintenance and must exercise every mapped feature. Any additional effects those workflows request still need separate approval.

Libraries, docs sites, and skill packs use their actual consumer paths, not an invented application UI. A build, unit tests, a discovered harness, or newly written instructions do not replace real journey evidence. Unexecuted or failed generated work remains an unverified draft or blocked result. Declining or blocking verification does not stop unrelated onboarding. Formal verification is a separate capability, not a workspace setup offer.

## Review the result and resume safely

Setup reports workspace, user and harness, and verification results separately. Each result uses `ready`, `needs-action`, `blocked`, `declined`, or `not-applicable`, with reasons and next actions. Model preferences, native availability, and plugin state remain separate items. Configured or discovered state is not verified execution.

The secret-free report goes in the target repository's gitignored `.scratch/setup-workspace/<run-id>/report.md`. A needed ignore-rule change requires approval. If the report cannot be saved, setup returns it in the conversation and names the limitation. The [run report guide](../../skills/setup-workspace/references/run-report.md) defines its contents.

An already-correct rerun changes no maintained files, though it can create a new report. After interruption, setup keeps successful changes and evidence, cleans up only run-owned resources, and re-inspects actual state before previewing remaining changes. It does not reset unrelated work or replay stale writes.

## Install or update only when requested

Installation is separate from repository onboarding and model configuration. Review the source, destinations, registry effects, and native trust requirements before approving an install or update.

### Use Kimi's native GitHub installation

In Kimi Code, install the latest published release with:

```text
/plugins install https://github.com/gfunc/skills
/reload
```

The unpinned repository URL follows GitHub's latest release, falling back to the default branch when no release exists. To pin a release, install `https://github.com/gfunc/skills/releases/tag/v0.2.0` instead.

Inspect the installation with `/plugins info gfunc-skills`. In `/plugins`, select the plugin on the Installed tab and press Enter when an update is available. After installation, use `/reload` or start a new session. Reloading refreshes installed content. It does not download an update.

Kimi 2.3.0 separates display metadata from update detection:

- The installed `kimi.plugin.json` supplies the displayed version.
- An unpinned GitHub install compares the saved ref and installed commit SHA with the latest release, or HEAD fallback.
- An explicit branch tracks its commit. Explicit tags and commits stay pinned.
- Local-path installs are outside the GitHub update checker.

These rules come from Kimi's [plugin manager](https://github.com/MoonshotAI/kimi-code/blob/b5e28fd6beac752a2cdcc0ff2f5fdf40e6494fbb/packages/agent-core-v2/src/app/plugin/manager.ts) and [GitHub resolver](https://github.com/MoonshotAI/kimi-code/blob/b5e28fd6beac752a2cdcc0ff2f5fdf40e6494fbb/packages/agent-core-v2/src/app/plugin/github-resolver.ts). The [official plugin guide](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html) owns the current native commands. Official-marketplace background update notices do not establish equivalent notification behavior for a custom plugin. Unattended third-party updates are not promised here.

### Use the non-interactive installer

For scripted delivery or another host, use the existing [installer](../../scripts/install) from a separate gfunc source checkout:

```bash
scripts/install --harness <name>
```

The installer uses the selected host's native delivery or prints guidance where installation is not automated. Follow the [adapter contract](../../references/adapters/README.md) for host requirements. Do not substitute upstream pstack installation commands for this pack.

For a new Kimi record, the shell installer registers the managed copy with a local-path source. An unchanged existing record may be retained. This path does not establish GitHub update tracking. Prefer the native GitHub URL flow when that tracking is wanted.

Before replacing a Kimi managed copy, the installer resolves the source and destination. If both resolve to the same directory, including through a symlink, it refuses before deletion or copying. Use a separate source checkout. Do not stage a self-copy workaround or bypass native hook trust. Successful plugin delivery does not establish model availability or consumer-path proof.

## Configure models without onboarding a repository

Use [`/setup-pstack`](../../skills/setup-pstack/SKILL.md) for focused model and reasoning-budget configuration. It uses the same capability as the workspace flow and writes only approved preference changes. Existing preferences remain unchanged unless you select reconfiguration.

That owner defines role defaults, budget choices, inheritance values, availability validation, and optional native delivery copies. `~/.agents/pstack-models.md` is the sole preference authority. The active profile owns native availability. `/setup-pstack` does not install or update plugins, repair native settings, or offer verification work.

To reduce cost, request a smaller budget, cheaper available models, or shorter panel lists. Use the owner's supported inheritance values when roles should use the parent model.

## Start a task separately

Setup returns its report without starting implementation. Use `/wayfinder` for a large unclear goal. For a clear task, give `/poteto-mode` a goal and a check:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Next, read [Route work through `/poteto-mode`](./02-poteto-mode.md).
