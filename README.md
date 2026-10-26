# gfunc-skills

gfunc's agent skill pack combines vendored, modified [pstack](https://github.com/backnotprop/pstack) with planning and writing skills from [Matt Pocock](https://github.com/mattpocock/skills). It supports Kimi Code, Claude Code, Codex, Pi, and Cursor through host-specific profiles.

[Latest release](https://github.com/gfunc/skills/releases/latest) · [Setup guide](docs/guide/01-setup.md) · [Full guide](docs/guide/README.md)

## Quick start

If the pack is already loaded, run `/setup-workspace` in the repository you want to work on. It discovers existing configuration and completes only the phases and effects you approve. Kimi uses qualified plugin names, such as `/gfunc-skills:setup-workspace`. Use your host's displayed skill spelling.

For a pinned source checkout without installation:

```bash
git clone --branch v0.2.0 --depth 1 https://github.com/gfunc/skills.git gfunc-skills
cd gfunc-skills
scripts/resolve-harness --harness kimi
```

Checking out a release tag leaves Git in detached HEAD state. That is expected for a pinned copy.

Replace `kimi` with `claude`, `codex`, `pi`, or `cursor` when appropriate. Give the agent the returned profile pointer and your target repository's path. If clone skills are not loaded, ask it to read and follow `<pack-root>/skills/setup-workspace/SKILL.md`. This selects the active host; it does not install the pack.

For a GitHub-tracked Kimi plugin, use the native installation flow:

```text
/plugins install https://github.com/gfunc/skills
/reload
```

Use `/plugins` to inspect available updates. The repository URL follows the latest release, while a release-tag URL stays pinned. The [installation guide](docs/guide/01-setup.md#install-or-update-only-when-requested) explains detection and update behavior and the separate scripted installer. Workspace setup, installation, and model preferences are separate operations.

## Choose a workflow

- [`/poteto-mode`](skills/poteto-mode/SKILL.md) takes a goal and a check, selects a playbook, and runs it. Large unclear goals route to Wayfinder.
- [`/wayfinder`](skills/wayfinder/SKILL.md) discusses a loose idea with you and maps the decisions, resolved one per session. It also works standalone.
- [`/writing-for-agents`](skills/writing-for-agents/SKILL.md) guides skills, `AGENTS.md`, `CLAUDE.md`, and context pointers. Its companion covers host-dependent skill mechanics.
- [`/poteto-help`](skills/poteto-help/SKILL.md) helps you pick a skill or recover a run without starting setup or implementation.

Both task entry points use pstack's autopilot-stack executor. The planning chain starts with `/wayfinder` discussion, then `/to-spec` synthesizes the agreed spec for your confirmation. The multi-phase-plan playbook decomposes it into units and checks the execution plan before your approval. Other effects still need their workflow's scoped approvals. Work tickets are an optional artifact, written on request.

Contributors should read [`AGENTS.md`](AGENTS.md) for repository-specific writing, upstream, scratch, verification, and release guidance.

## Layout

One flat `skills/` root — every skill a peer:

- pstack's skills (poteto-mode, swarm, show-me-your-work, the principle-*, and the rest), vendored from the mirror and modified in place.
- `skills/wayfinder`, `skills/to-spec` — the planning chain, ported from the mattpocock pack.
- `skills/grilling`, `skills/domain-modeling`, `skills/research`, `skills/prototype` — the discussion skills the chain invokes, absorbed from the mattpocock pack.
- [`skills/writing-for-agents`](skills/writing-for-agents/SKILL.md) is Matt Pocock's reference for agent-facing writing, with host-neutral skill mechanics. Root [`AGENTS.md`](AGENTS.md) uses its task-specific context pointers.
- `references/trackers/` — the tracker-doc indirection: `local-markdown.md` (default), `github.md`, `gitlab.md`.
- `vendor-manifest.txt` + `scripts/sync-upstream` — the drift discipline for the vendored paths: the manifest lists every pstack-origin path and its base SHA; the script diffs mirror@base→HEAD per path and reports what needs a three-way merge.
- `GLOSSARY.md` — the dual vocabulary: planning terms, execution terms, and the seam between them.
- `references/harnesses/` holds one profile per supported harness. The host's adapter or `scripts/resolve-harness` names the active profile without copying it to a separate selection file.
- `references/adapters/` — the thin per-host adapters and the clone/Codex selection contract.
- [`docs/harness/wire-audit.md`](docs/harness/wire-audit.md) — usage for `scripts/wire-audit`, which reads one Kimi wire trail and reports parent polling, parent authoring, and background children or cron adds under a goal.

`/to-tickets` and `/implement-spec` are retired doors: decomposition lives in the multi-phase-plan playbook, and the plan emitter lives inside poteto-mode.

## Harnesses

Use the [adapter contract](references/adapters/README.md) for supported hosts, native delivery, and clone selection. Each host's profile under `references/harnesses/` owns its version floor, runtime mechanics, and capability limits.

A native adapter or an explicit clone selection supplies the active profile. Skills read that profile before harness-dependent work and pass its absolute path to children. Missing or ambiguous identity stops the affected action. Selection is per session and writes no configuration.

## Set up a workspace

Start repository onboarding with [`/setup-workspace`](skills/setup-workspace/SKILL.md). This local gfunc skill works with a loaded native plugin or a plain clone. It discovers existing configuration, previews scoped changes, and completes the phases you approve. The [setup guide](docs/guide/01-setup.md) covers invocation and permissions.

- Repository wiring preserves custom tracker and agent guidance. `docs/issue-tracker.md` is the canonical tracker document when configuration is needed. Without explicit configuration, local Markdown under `.scratch/` remains the default, even with a Git remote. Setup does not create empty domain documents or write to remote trackers.
- Model preferences belong to `~/.agents/pstack-models.md`. Existing preferences stay unchanged unless you select reconfiguration. If you accept missing model setup, the workspace flow completes it through [`/setup-pstack`](skills/setup-pstack/SKILL.md) and resumes onboarding. That skill owns role defaults, budgets, and availability checks. Preferences do not provision native models.
- Installation or update requires a separate explicit request and approval. Reuse an installed plugin or use a clone without installing. The [installer](scripts/install) owns native delivery. A Kimi replacement install refuses a source that resolves to its managed destination before deletion or copying. Use a separate source checkout for an update.
- Verification work is optional. Setup offers generation once when a project-local verification skill is absent, even if a harness exists. It offers maintenance for a usable stale skill. Only accepted work runs the owner's required real journeys and retains evidence. Discovered tests or a harness are not verified execution.

Each run reports workspace, user and harness, and verification results separately in `.scratch/setup-workspace/<run-id>/report.md`, when ignored reporting is available. Declined or blocked optional work stays visible and does not stop unrelated onboarding. Correct reruns leave maintained files unchanged.

Use `/setup-pstack` directly for model preferences only. It neither installs the plugin nor offers verification work. Harness selection follows the [adapter contract](references/adapters/README.md), not another setup configuration file.

## Store convention

`.scratch/` in a consuming repo is the artifact root for all stack activity there: planning artifacts (spec, optional work tickets), execution state (plan, decision trail, agent registry, logs, lane worktrees), and scratch outputs (arena and eval candidates, throwaway prototypes, screenshots, resume notes) live side by side under `.scratch/<feature-slug>/`. Keep `.scratch/` gitignored. This is the local stand-in for Cursor's injected per-agent store.

## Syncing upstream

`~/projects/pstack` stays a pure mirror of upstream pstack. When it fetches new upstream, run `scripts/sync-upstream` here: it reports per vendored path whether upstream changed, whether we modified it, and which rows need a human three-way merge. Local modifications are intended — they are what makes this stack ours — but they stay visible per path through the manifest and git history.

## Releases

The pack uses Semantic Versioning and tags named `vMAJOR.MINOR.PATCH`. Keep the same version in [`plugin.json`](plugin.json), [`kimi.plugin.json`](kimi.plugin.json), [the Claude manifest](.claude-plugin/plugin.json), and [the Cursor manifest](.cursor-plugin/plugin.json). The private poteto tooling package is versioned separately. During `0.x` development, describe compatibility changes in the release notes.

Use [`scripts/version`](scripts/version) to inspect or change the four manifests together:

```bash
scripts/version read
scripts/version check
scripts/version set 0.3.0 --dry-run
scripts/version set 0.3.0
```

The `set` examples prepare a future version. They do not commit, tag, push, or publish it.

To prepare a release without editing the manifests by hand, run the **Bump pack version** workflow from Actions with the target version. It sets the four manifests on a `release/v<version>` branch and opens a PR. It does not tag or publish. Review and merge it after validation, then tag the verified SHA as below.

To publish a release:

1. Select a version, update it with `scripts/version set`, and review the manifest, skill, reference, and attribution changes.
2. Commit the candidate and merge it into `main` after the [validation workflow](.github/workflows/validate.yml) passes. It checks the pack and runs the existing five-harness rig on committed source.
3. Create an annotated `vMAJOR.MINOR.PATCH` tag on the verified full SHA and push only that named tag. Published tags remain fixed. Never move or reuse them.
4. The [release Action](.github/workflows/release.yml) checks tag/version agreement, validates the exact source commit, then publishes generated notes with the actual verification limits. A manual run validates only and cannot publish.
5. Read back the published release and remote tag. Confirm the tag resolves to the verified SHA and the four manifests match its version.

For a nonpublishing check of an existing release:

```bash
gh workflow run release.yml --ref main -f tag=v0.2.0
```

A version with a prerelease suffix is published as a prerelease. A stable `0.x` version remains a normal release. Older releases do not replace the latest stable release. Matching published releases remain unchanged on retries.

GitHub Releases hold the release notes and provide tag source archives. Workflow logs stay in artifacts, with `MANUAL` and `SKIPPED` results disclosed as limits. A release does not install the pack into a live harness or change user settings.

## Dependencies

- `node`, for `check-plan.mjs` (the plan linter) and `emit-plan`.
- Python 3.11 or later, for version and pack checks without additional packages.
- Docker, for the existing five-harness validation rig.
- A forge CLI for execution: `gh` (GitHub) or `glab` (GitLab remotes).
- Playwright, for UI-surface live lanes.

## Stances

- The pstack mirror stays pure; the vendored copy here is modified — that divergence is deliberate and manifest-tracked.
- Ported and absorbed skills keep their upstream names and attribution. The gfunc installer does not overwrite separately installed Matt Pocock skills.
- No triage labels. Type markers route ticket resolution. The plan file plus the operator's plan confirmation is the handoff to execution.
- `skills/setup-workspace/` is local gfunc work, not a pstack-origin path. The vendor manifest keeps its pstack-only scope.

## Validation limits

The existing [harness rig](scripts/validate-harnesses) separates automated assertions from manual gates. Model-backed child-agent behavior and authenticated Cursor delivery need their own evidence. Inventory or mock results do not establish either. Live installs into real harness configuration remain held by the operator.

The Kimi profile has a content contract: `validate-pack` requires its `Waiting and notifications`, `Goal mode`, `Plan mode`, and `Cost and context` sections, and the Kimi rig stage greps the managed copy for the two sections that change runtime behavior. Both are content checks, not behavior proofs.

Derived in part from MIT-licensed work by Matt Pocock (the skills pack) and Lauren Tan (pstack). See LICENSE.
