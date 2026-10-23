# gfunc-skills

gfunc's own agent stack: [pstack](https://github.com/backnotprop/pstack) vendored and modified, with the wayfinder planning chain integrated. Two front doors, one executor:

- `/poteto-mode` — the automatic entry. Give it a goal and a check; it routes to a playbook and runs. Map-sized loose ideas route to wayfinder from here.
- `/wayfinder` — the HITL entry. Grills a loose idea into a map of decision tickets, resolved one per session. Also invocable standalone.

Behind both doors sits one executor: pstack's autopilot-stack.

The chain: `/wayfinder` (HITL discussion) → `/to-spec` (synthesis; you confirm the spec) → the multi-phase-plan playbook (automatic: decomposes the spec into units, stamps the plan from the skeleton, lints it with `check-plan.mjs`) → you confirm the plan → pstack executes. Spec confirmation and plan confirmation are the only two human gates. A tracker-visible work-ticket set is an optional artifact, written on request.

## Layout

One flat `skills/` root — every skill a peer:

- pstack's skills (poteto-mode, swarm, show-me-your-work, the principle-*, and the rest), vendored from the mirror and modified in place.
- `skills/wayfinder`, `skills/to-spec` — the planning chain, ported from the mattpocock pack.
- `skills/grilling`, `skills/domain-modeling`, `skills/research`, `skills/prototype` — the discussion skills the chain invokes, absorbed from the mattpocock pack.
- `references/trackers/` — the tracker-doc indirection: `local-markdown.md` (default), `github.md`, `gitlab.md`.
- `vendor-manifest.txt` + `scripts/sync-upstream` — the drift discipline for the vendored paths: the manifest lists every pstack-origin path and its base SHA; the script diffs mirror@base→HEAD per path and reports what needs a three-way merge.
- `GLOSSARY.md` — the dual vocabulary: planning terms, execution terms, and the seam between them.
- `references/harnesses/` — one profile per supported harness, holding that harness's runtime mechanics and capability list. The active profile is named by the host's adapter or by `scripts/resolve-harness`; nothing is copied at setup time.
- `references/adapters/` — the thin per-host adapters and the clone/Codex selection contract.

`/to-tickets` and `/implement-spec` are retired doors: decomposition lives in the multi-phase-plan playbook, and the plan emitter lives inside poteto-mode.

## Harnesses

Five runtimes are supported, each with a profile under `references/harnesses/`: Kimi Code 2.3.0, Claude Code 2.1.307, Codex 0.163.0, Pi 1.3.0, and Cursor (pinned CLI in the rig).

- **Native plugins** carry a thin adapter that names the active profile: Kimi's manifest prompt file, Claude's startup and child hooks, Pi's package extension, Cursor's always-applied rule. Codex cannot trust an install-time hook, so it selects explicitly.
- **A plain clone** selects per session: `scripts/resolve-harness --harness <name>` or `GFUNC_HARNESS=<name>`. Detection is a warned fallback; missing or ambiguous identity stops the affected action.
- **Skills read the profile themselves** before harness-dependent work and pass an absolute profile path to any child agent. The full selection contract lives in `references/adapters/README.md`.

## Configuration

No stack-authored setup skill; everything auto-detects with defaults. The vendored `skills/setup-pstack` remains available for pstack-style installs. Two optional config files:

- `<repo>/docs/issue-tracker.md` — a consuming repo commits a copy of the relevant `references/trackers/*.md` (edited to taste) to say which tracker it uses. Absent it, skills default to local-markdown in `.scratch/`.
- `~/.agents/pstack-models.md` — the role→model table (feature, refactoring, bug-fix, hardest tasks, judgment and prose, swarm workers, audit and second opinion). The stack ships the default at `skills/poteto-mode/references/pstack-models.md`; install it at `~/.agents/pstack-models.md` (copy or symlink), then edit freely. Any plan can override per-role lines at authoring time.

Harness selection is not configuration: a native plugin's adapter names the active profile, and a plain clone selects explicitly with `scripts/resolve-harness --harness <name>` or `GFUNC_HARNESS=<name>`. Detection is a warned fallback; nothing is written to the pack or the working tree.

## Store convention

`.scratch/` in a consuming repo is the artifact root for all stack activity there: planning artifacts (spec, optional work tickets), execution state (plan, decision trail, agent registry, logs, lane worktrees), and scratch outputs (arena and eval candidates, throwaway prototypes, screenshots, resume notes) live side by side under `.scratch/<feature-slug>/`. Keep `.scratch/` gitignored. This is the local stand-in for Cursor's injected per-agent store.

## Syncing upstream

`~/projects/pstack` stays a pure mirror of upstream pstack. When it fetches new upstream, run `scripts/sync-upstream` here: it reports per vendored path whether upstream changed, whether we modified it, and which rows need a human three-way merge. Local modifications are intended — they are what makes this stack ours — but they stay visible per path through the manifest and git history.

## Dependencies

- `node`, for `check-plan.mjs` (the plan linter) and `emit-plan`.
- A forge CLI for execution: `gh` (GitHub) or `glab` (GitLab remotes).
- Playwright, for UI-surface live lanes.

## Stances

- The pstack mirror stays pure; the vendored copy here is modified — that divergence is deliberate and manifest-tracked.
- Ported and absorbed skills keep their upstream names and supersede the mattpocock-installed copies in `~/.agents/skills` at install time.
- No triage labels, no stack-authored setup skill. Type markers route ticket resolution; the plan file plus the operator's plan confirmation is the handoff to execution.

## Status

The harness-instruction consolidation is merged to `main`: five profiles on one schema, per-host adapters, the resolver, rewired skills, installer retirement, and reconciled docs. The Docker rig passes five harnesses with twelve explicit manual gates (child-agent cells need a model; Cursor plugin delivery needs auth). Live installs into any harness's real config remain held by the operator.

Derived in part from MIT-licensed work by Matt Pocock (the skills pack) and Lauren Tan (pstack). See LICENSE.
