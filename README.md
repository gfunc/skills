# skills

Companion pack to [pstack](https://github.com/backnotprop/pstack) (the standalone mirror of cursor/plugins/pstack). Two front doors, one executor:

- `/poteto-mode` (pstack) — the automatic entry. Give it a goal and a check; it routes to a playbook and runs.
- `/wayfinder` (this pack) — the HITL entry. Grills a loose idea into a map, a spec, and tickets.

Behind both doors sits one executor: pstack's autopilot-stack. This pack holds the planning chain and the bridge that feeds it.

The chain: `/wayfinder` (HITL discussion) → `/to-spec` (synthesis; you confirm the spec) → `/to-tickets` (automatic decomposition into work tickets) → `/implement-spec` (automatic bridge; emits the pstack plan) → you confirm the plan → pstack executes. Spec confirmation and plan confirmation are the only two human gates.

## Layout

- `skills/wayfinder` — HITL spec discussion and documentation, ported from the mattpocock pack, name kept.
- `skills/to-spec` — conversation to spec; its ending drives the automatic chain.
- `skills/to-tickets` — spec to work tickets (pure decomposition). _Pending: ticket 11._
- `skills/implement-spec` — the spec-to-plan bridge: consumes a spec with its tickets or a spec alone, emits the pstack-shaped plan lint-clean against `check-plan.mjs`, stops at the plan-confirmation gate. _Pending: ticket 12._
- `references/trackers/` — the tracker-doc indirection: `local-markdown.md` (default), `github.md`, `gitlab.md`.
- `references/plan-skeleton.md` + `scripts/emit-plan` — the plan emitter the bridge owns. _Pending: ticket 12._
- `GLOSSARY.md` — the dual vocabulary: planning terms, pstack execution terms, and the seam between them.

## Configuration

No setup skill; everything auto-detects with defaults. Two optional config files:

- `<repo>/docs/issue-tracker.md` — a consuming repo commits a copy of the relevant `references/trackers/*.md` (edited to taste) to say which tracker it uses. Absent it, skills default to local-markdown in `.scratch/`.
- `~/.agents/pstack-models.md` — the role→model table (feature, refactoring, bug-fix, hardest tasks, judgment and prose, swarm workers, audit and second opinion). The pack ships a default table; edit freely, and any plan can override per-role lines at authoring time.

## Store convention

`.scratch/` in a consuming repo is the artifact root for all pack and pstack activity there: planning artifacts (spec, work tickets) and execution state (plan, decision trail, agent registry, logs, lane worktrees) live side by side under `.scratch/<feature-slug>/`. Keep `.scratch/` gitignored. This is the local stand-in for Cursor's injected per-agent store.

## Dependencies

- pstack itself (the executor and its playbooks).
- The discussion skills `grilling`, `domain-modeling`, `research`, and `prototype`, which wayfinder invokes.
- `node`, for pstack's `check-plan.mjs` plan linter.

## Stances

- The pstack mirror stays a pure mirror. Nothing here modifies it; sync conflicts stay impossible by construction.
- Ported skills keep their upstream names and supersede the mattpocock-installed copies at install time.
- Harness-neutral, mirror-style: each skill carries a Harness section (local worktrees for cloud agents, Playwright for control-ui, the tick driver your harness's scheduler provides).
- No triage labels, no setup skill. Type markers route ticket resolution; the plan file plus the operator's plan confirmation is the handoff to execution.

## Status

In progress. wayfinder and to-spec are ported; to-tickets and implement-spec are pending. Install (replacing the mattpocock copies in `~/.agents/skills`) waits until the full chain is ported — a ported to-spec chaining into an unported to-tickets would mix old and new semantics. The wayfinder map driving this work lives at `.scratch/pstack-planning/map.md` (gitignored scratch state).

Derived in part from MIT-licensed work by Matt Pocock (the skills pack) and Lauren Tan (pstack). See LICENSE.
