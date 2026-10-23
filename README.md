# gfunc-skills

gfunc's agent stack combines vendored, modified [pstack](https://github.com/backnotprop/pstack) with the Wayfinder planning chain. After workspace setup, use either task entry point:

- `/poteto-mode` takes a goal and a check, selects a playbook, and runs it. Large unclear goals route to Wayfinder.
- `/wayfinder` discusses a loose idea with you and maps the decisions, resolved one per session. It also works standalone.

Both task workflows use pstack's autopilot-stack executor.

The planning chain starts with `/wayfinder` discussion. `/to-spec` synthesizes the agreed spec for your confirmation. The multi-phase-plan playbook then decomposes it into units, emits a plan, and checks it with `check-plan.mjs`. Confirm the execution plan before implementation. Other effects still need their workflow's scoped approvals. A tracker-visible work-ticket set is an optional artifact, written on request.

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

To publish a release:

1. Update the four manifest versions together and review the skill, reference, and attribution changes.
2. Commit the candidate, then run [`scripts/validate-harnesses`](scripts/validate-harnesses) on that exact commit. Preserve manual gates and skipped checks in the release notes.
3. Integrate the verified commit into `main` and push normally. If integration changes the tree, rerun the relevant checks before tagging.
4. Create an annotated `vMAJOR.MINOR.PATCH` tag on the verified full SHA. Push only that named tag. Published tags remain fixed. Never move or reuse them.
5. Publish through `gh release create <tag> --repo gfunc/skills --verify-tag --title <tag> --notes-file <notes> --latest`. Keep note drafts and logs under `.scratch/`. GitHub provides source archives for the tag.
6. Read back the published release and remote tag. Confirm the tag resolves to the verified SHA and its four manifests match the release version.

GitHub Releases hold the release notes. A release does not install the pack into a live harness or change user settings.

## Dependencies

- `node`, for `check-plan.mjs` (the plan linter) and `emit-plan`.
- A forge CLI for execution: `gh` (GitHub) or `glab` (GitLab remotes).
- Playwright, for UI-surface live lanes.

## Stances

- The pstack mirror stays pure; the vendored copy here is modified — that divergence is deliberate and manifest-tracked.
- Ported and absorbed skills keep their upstream names and attribution. The gfunc installer does not overwrite separately installed Matt Pocock skills.
- No triage labels. Type markers route ticket resolution. The plan file plus the operator's plan confirmation is the handoff to execution.
- `skills/setup-workspace/` is local gfunc work, not a pstack-origin path. The vendor manifest keeps its pstack-only scope.

## Validation limits

The existing [harness rig](scripts/validate-harnesses) separates automated assertions from manual gates. Model-backed child-agent behavior and authenticated Cursor delivery need their own evidence. Inventory or mock results do not establish either. Live installs into real harness configuration remain held by the operator.

Derived in part from MIT-licensed work by Matt Pocock (the skills pack) and Lauren Tan (pstack). See LICENSE.
