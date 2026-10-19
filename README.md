# skills

Companion pack to [pstack](https://github.com/backnotprop/pstack) (the standalone mirror of cursor/plugins/pstack). Two front doors, one executor:

- `/poteto-mode` (pstack) — the automatic entry. Give it a goal and a check; it routes to a playbook and runs.
- `/wayfinder` (this pack) — the HITL entry. Grills a loose idea into a map, a spec, and tickets.

Behind both doors sits one executor: pstack's autopilot-stack. This pack holds the planning chain and the bridge that feeds it.

## Layout (planned)

- `skills/wayfinder` — HITL spec discussion and documentation, relocated from the mattpocock pack, name kept.
- `skills/to-spec` — conversation to spec.
- `skills/to-tickets` — spec to tickets to a pstack-shaped multi-phase plan, lint-clean against pstack's `check-plan.mjs`.
- `skills/implement-spec` — reworked from executor into the spec-to-plan bridge, for discussions that end at a spec doc.
- `references/plan-skeleton.md` + `scripts/emit-plan` — the shared plan emitter both emitters read; `check-plan.mjs` stays the gate.

## Stances

- The pstack mirror stays a pure mirror. Nothing here modifies it; sync conflicts stay impossible by construction.
- Ported skills keep their upstream names and supersede the mattpocock-installed copies at install time.
- Harness-neutral, mirror-style: each skill carries a Harness section (local worktrees for cloud agents, Playwright for control-ui, timed waits for `/loop`).
- No triage labels, no setup skill. Type markers route ticket resolution; the plan file plus the operator's explicit go is the handoff to execution.

## Status

In progress. The wayfinder map driving this work lives at `.scratch/pstack-planning/map.md` (gitignored scratch state).

Derived in part from MIT-licensed work by Matt Pocock (the skills pack) and Lauren Tan (pstack). See LICENSE.
