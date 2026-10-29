---
name: start-dev
description: Human-invoked front door for the full post-spec lifecycle. Accepts a to-spec spec, runs the restored architect skill's Phase A+B for the design, plans a unit graph like a dev lead, executes it as ready sets with one merge worker, runs one confrontational review, and the owner lands on the verdict. Use for /start-dev, "run the spec", "start development".
disable-model-invocation: true
---

# start-dev

`/start-dev <spec>` takes an approved spec and runs the whole lifecycle behind it: design, plan, execution, review. The invocation is the go for intake; the operator's go after the plan approval is the go for execution. This skill is human-invoked only.

The lifecycle is spec intake → architect → verification readiness → dev-lead plan → execute ready sets → one confrontational review → owner land.

## Entry and exit

**Entry.** `/start-dev <spec>` reads the spec at the given path. The spec acceptance checklist: problem, solution, stories, implementation decisions, testing decisions, out of scope, open questions. A thin or contradictory spec, or a missing product decision, routes back to wayfinder or to-spec rather than being silently filled in; start-dev settles only what an experiment can settle. When no spec document exists, run the `to-spec` synthesis inline, write the spec into the run root, and continue. The run root is the spec's parent directory, and a wayfinder map keeps its own slug and is linked, never merged.

**Exit.** A merge-ready PR: the review's PASS verdict, the merge recommendation, the decision trail, open risks, and follow-ups. One spec is one PR, and the owner lands it on the clean verdict. Start-dev never tags, publishes, or installs, and never rewrites the spec.

**Stop conditions.** Blocked design, blocked plan, a failed review after the loop limit, missing credentials or permissions, or a product call no experiment settles.

**Maintenance.** Verification drift is routed by cause and scope: in-PR correction when the current PR caused it, a standalone maintain run when it is confined to the verify skill's directory with no product code, a planned feature or its own run when product code or several features are involved. See § Maintenance.

## Principles

The full Principles index lives in [`references/principles.md`](references/principles.md), the start-dev copy of the pstack index, and applies in every phase. The table names each phase's **primary** principles; it is an emphasis, not an exhaustive limit. Every phase still applies the full index, and the design phase keeps its explicit full-index read and review check. The leaf `principle-*` skills remain the authority; read the leaf for any principle that shapes a decision and name it with the choice it changed.

| Phase | Primary principles |
|---|---|
| Spec intake | `never-block-on-the-human`, `model-the-domain`, `minimize-reader-load`, `attack-the-premise`, `laziness-protocol`, `experience-first` |
| Architect / design | The full index; the design-critical: `foundational-thinking`, `redesign-from-first-principles`, `subtract-before-you-add`, `outcome-oriented-execution`, `exhaust-the-design-space`, `fix-root-causes`, `model-the-domain`, `boundary-discipline`, `type-system-discipline`, `make-operations-idempotent`, `separate-before-serializing-shared-state`, `prove-it-works` |
| Verification readiness | `prove-it-works`, `test-behavior-not-implementation`, `boundary-discipline`, `model-the-domain`, `fix-root-causes`, `encode-lessons-in-structure`, `never-block-on-the-human` |
| Dev-lead plan | `sequence-verifiable-units`, `separate-before-serializing-shared-state`, `guard-the-context-window`, `never-block-on-the-human`, `prove-it-works`, `minimize-reader-load`, `encode-lessons-in-structure`, `foundational-thinking` |
| Orchestrate execution | `prove-it-works`, `test-behavior-not-implementation`, `fix-root-causes`, `sequence-verifiable-units`, `model-the-domain`, `boundary-discipline`, `type-system-discipline`, `make-operations-idempotent`, `laziness-protocol`, `guard-the-context-window`, `minimize-reader-load`, `encode-lessons-in-structure` |
| Confrontational review | `prove-it-works`, `attack-the-premise`, `fix-root-causes`, `redesign-from-first-principles`, `test-behavior-not-implementation`, `explain-the-number`, `minimize-reader-load`, `guard-the-context-window`, `never-block-on-the-human` |
| Operator land | `prove-it-works`, `sequence-verifiable-units`, `never-block-on-the-human`, `encode-lessons-in-structure` |

## Hats

| Hat | Who | Notes |
|---|---|---|
| Spec acceptance | Main agent | Checks the spec acceptance checklist; routes gaps back. |
| Architect | Main agent | Runs the restored `architect` skill's Phase A (ground with `how`, `why` when ownership or layering changes) and Phase B (sketch via `arena`, two-plus candidates, red-flag screen, interface-depth comparison, one synthesized package), stopping before Phase C; the design review replaces Agree. Reads the full Principles index from `references/principles.md` and applies every principle it names; authors no separate design principles. The package records the surface, drivability evidence, and formal signal with its property. |
| Verification readiness | Main agent | Owns the decision after the design review. May delegate the launch probe to a research subagent; hands the decision and evidence to the plan lead. |
| Plan lead | Main agent, or a fresh subagent with the [plan-lead prompt](references/roles/plan-lead.md) | Receives the verification readiness decision and evidence as inputs. A read-only plan agent cannot write the plan. |
| Orchestrator | Main agent | Schedules the ready sets, confirms staffing, runs the goal, orchestrates the review. |
| PR owner | Main agent | Owns the PR, spawns unit workers and one merge worker, runs the final review, and lands on the verdict. Never edits the branch. |
| Dev, critical-dev, reviewer, fixer, merge worker, research | Role prompts under [`references/roles/`](references/roles/) | Spawned on the profile's Role mapping types. |
| Review lead | A fresh subagent on a different model family with the [review-lead prompt](references/roles/review-lead.md) | Confrontational; independent of the owner and the main agent; never edits. |

The main agent always wears the PR-owner hat. Where the profile reports no nested spawn, the plan and review hats collapse into it too, with the reduced independence disclosed in the ledger. Every resolution comes from the active profile's Role mapping.

## Scope adaptation

One spec is one PR, at any size. Author it with [`playbooks/program-plan.md`](playbooks/program-plan.md), execute it with [`playbooks/single-pr.md`](playbooks/single-pr.md). A multi-PR effort is several specs, each executed as its own PR, and that is outside this skill. Packaging is not a separate workflow.

## Design

The main agent runs the design phase inside the restored [`architect`](../architect/SKILL.md) skill's Phase A and B. `/start-dev` is the human invocation, so the main agent follows that skill's phases deliberately, not as an auto-invocation. Read [`references/principles.md`](references/principles.md), the start-dev copy of the Principles index, in full and apply every principle it names, the core, architecture, verification, delegation, and meta principles, not a design-relevant subset. The leaf `principle-*` skills are the authority for each: read the leaf for any principle that shapes a decision, and name that principle with the specific choice it changed in the design rationale. Start-dev authors no separate design principles. This full-index requirement is start-dev's constraint layered on the `architect` container.

**Phase A, Ground.** Run `how` over the affected subsystems and produce the architectural understanding it prescribes. When the design redefines ownership or layering, also run `why` so the existing rationale becomes a constraint. Skip Phase A only for genuine greenfield with no surrounding system.

**Phase B, Sketch.** Run `architect` Phase B exactly: `arena` with the design-sketch task and the Phase A grounding, each runner taking `architect`'s `references/runner-prompt.md`, the runners drawn from the brief's `Model: architect runners=` line, then the active profile's `### Role model table`, then `~/.agents/pstack-models.md`, then the skill's stated default. At least two structurally distinct candidates before synthesis, whole-shape alternatives rather than point fixes. Screen every candidate against `architect`'s [`references/design-red-flags.md`](../architect/references/design-red-flags.md). Compare the viable candidates on interface depth and prefer the design that hides more complexity behind a smaller public surface. Arena returns one synthesized design package, and its synthesis decision fills the rationale's synthesis section.

**Stop before Phase C.** The mandatory design review, a fresh subagent on a different model family or the operator, replaces `architect`'s Agree checkpoint, and the operator's plan approval follows it. The design review checks the design artifact and its rationale against the full Principles index in [`references/principles.md`](references/principles.md), not a subset. It also checks the formal signal and one-sentence property, including a `none` claim against the closed signal list. Phase D, Implement, is the unit workers' execution phase; the synthesized sketch is the contract the plan carries and the implementation fills in against. Phase E, Scrap, is the re-design route: when execution or review shows the sketch is wrong as a pattern, re-run Phase A and B and re-chart the plan rather than bolting fixes onto a wrong design.

For a contested design, run `interrogate` before the design review; for a question a run can settle, run `prototype`. Do not run the `architect` skill's Phase C checkpoint; the design review is that gate here.

The design artifact is the Phase B synthesized package, its types, signatures, module boundaries, rationale, base and grafts, plus the design review. It records the surface (`ui`, `cli`, `library`, or `backend`); drivability evidence (the launch or e2e setup command, ready signal, one driven journey, timestamp, and any production boundary that requires a supported seam); and the formal signal (`concurrency/interleaving`, `retries/timeouts`, `state machine/protocol`, `parser/serializer`, `unsafe/FFI`, or `distributed ordering`) with a one-sentence property, or `none`. It lives in the run root and is referenced from the plan. When the design contradicts the spec, route back to wayfinder or to-spec; do not silently rewrite the spec.

## Verification readiness

Principles: apply the phase row in § Principles.

After the design review and before the plan lead writes the plan, the main agent that ran Phase A/B decides verification readiness. It may delegate the launch probe to a research subagent, but the decision stays with the main agent. Read the design package, the repo's launch or e2e setup, the existing project skills, and the drivability probe. A test-only mock never counts. An e2e setup that boots the real app and drives the real surface is the launch and drive recipe; the generated skill wraps it rather than duplicating it.

Record one drivability state:

- `drivable`: the real app launches from a clean checkout and reaches a usable state.
- `drivable-with-boundary`: a repo-supported production seam isolates the third party; name the boundary and the unproven journeys.
- `not-drivable`: no launch path or no supported seam exists.

**App skill.** Decide `exists`, `exists-stale`, `create-after-first-drivable-batch`, `create-before-amendment`, or `not-required`. Route `exists-stale` to `maintain-verification-skill`, never recreation. Allow `not-required` only when no `ui` or `cli` surface exists. Any `ui` or `cli` surface triggers the gate. Multiple apps get one verify skill each; the primary is the app the design's journeys touch, and the operator decides only a tie. Accept `exists` only with driver proof: one mapped journey passing at the head and one known-bad control failing. A driver being rewritten, or one with no negative control, is `exists-stale`. Record the stack `Isolation` and the `Gate duration` per layer; the plan derives its ready-set size from isolation and marks any gate above 90 minutes detached.

**Formal.** Decide `exists`, `exists-stale`, `create`, or `not-required`. Route `exists-stale` to `maintain-formal-verification-skill`. For `not-required`, record the checked signal list and `none`; the design review can challenge it.

**Recording.** Hand the decision and evidence to the plan lead. The plan records them in `## Verification readiness` between `## How to read this` and `## Run graph`, including the driver proof, the isolation mode, and the gate durations, and the run root gains one append-only `decisions.tsv` row referencing that section. A creation decision becomes a unit with dependents, as the spec's readiness mapping states.

## Maintenance

Signals: a feature entry is wrong, missing, or dead; the formal sync commit is stale; the harness cannot drive a working feature. A final-gate lane contradicting the map is the detection event. A product regression is a separate finding. Detection is layered: readiness catches stale artifacts as `exists-stale`; the plan checker catches a missing map-update box and a Files path outside every lane; the unit workers catch lane contradictions and harness gaps; the review lead catches drift at the head.

Route by cause and scope:

- In-PR correction when the current PR caused the drift: the map update or the formal sync advance lands in that PR.
- Standalone maintain run when the drift is confined to the verify skill's directory and no product code is involved. At most one PR.
- Planned feature or its own `/start-dev` run when product code, scope, bounds, or several features are involved. A coupled change joins the current graph; an independent large one gets its own run.

Record a finding with evidence plus a `decisions.tsv` row naming signal, evidence, route, and owner. The main agent routes; the operator sees the route in the plan or review handback and can override it.

Executor: the maintain skills stay operator-invocable. Inside start-dev, the main agent or a unit worker follows their text by path; `disable-model-invocation: true` blocks auto-invocation, not reading.

Edit scope: the verification skill's own directory only. A product regression becomes a separate bug-fix effort. The map or property is never weakened to match a broken app.

## Plan

Principles: apply the phase row in § Principles.

The [plan lead](references/roles/plan-lead.md) receives the verification readiness decision and evidence as inputs, then writes the plan from the shape module. Run `emit-plan` to stamp the shell; `references/plan-shape.mjs` is the only statement of the plan's blocks and their order, and the prose never restates them. The plan holds one PR section, a lane table with one row per unit, and a run graph of `unit:` nodes, one `pr:` node and one `[gate: final]`. The readiness decision maps onto the graph as the spec states: a creation decision becomes a unit with dependents, a formal creation becomes a unit before the last covered-code change, and a stale skill becomes the first unit. Staffing, risk and the critical path are prose. `check-plan.mjs` validates every rule with its location. A plan review by a fresh subagent or the operator precedes the operator's go. See [`playbooks/program-plan.md`](playbooks/program-plan.md).

## Execution

Principles: apply the phase row in § Principles.

The main agent runs [`playbooks/single-pr.md`](playbooks/single-pr.md). It dispatches the ready set of the unit graph, one worktree per unit, with a separate merge worker as the only writer of the branch. A unit merges only when its scoped tests pass; a red unit enters the fix loop and stops the run at the cap. The final verify runs on the merged local head: the full suite, the plan's final-gate lanes, and the formal check where covered. One independent review follows, with an area split above the threshold, then one fix round and a scoped re-check. The branch is pushed once, CI runs on that head, and the owner lands after merge prep and green CI on the merge result. There are no waves, no wave gates and no fixed lane count.

On a harness with `/goal`, run execution under goal mode with the landed PR as the completion criterion, foreground children or passive completion waits, and no background polling and no audit tick. On a harness without it, normal mode with the same no-polling rule. The profile's Role mapping names which applies.

## Review

Principles: apply the phase row in § Principles.

The [review lead](references/roles/review-lead.md) runs the confrontational review of the local diff against the spec, the design, the plan, the feature map, the formal skill's coverage record, and the evidence. It opens the map and coverage record independently. It checks that every changed user-facing behavior has a feature-entry update, every lane's feature entry exists and matches its scenario, every named evidence path exists, and the formal sync commit covers the current covered code; a covered-code change without a rerun or sync update is a finding. It files findings, the fixer resolves them with [`references/review-reception.md`](references/review-reception.md), and the lead gives PASS, FIX or BLOCK plus a merge recommendation. One fix round, then a scoped re-check of the changed findings. Above eight units or 1,500 changed lines the lead fans out one area reviewer per unit group and aggregates one verdict. The owner lands on a PASS.

## Boundaries

- The main agent is the architect in design and the orchestrator after it. It does not run the confrontational review.
- One writer per branch. The merge worker is the only writer of the PR branch; the owner never edits it. The root never pushes.
- Every brief carries the [report contract](references/report-contract.md) verbatim and declares `owns: <steps>`.
- Every brief carries one `Model: <role>=<model>` line per role named in the active harness profile's `### Role model table`, drawn from the profile's harness-native model store; the brief requires each child to pass its line's model on every spawn. A missing role line falls back to `~/.agents/pstack-models.md`, then the skill's stated default.
- The standing orders in [`references/standing-orders.md`](references/standing-orders.md) are stamped into every plan and carried verbatim in every brief.
- Run artifacts live under `.scratch/<effort>/` per the [run ledger](playbooks/run-ledger.md). Durable plans a restored pstack playbook authors stay in `docs/`.
- This skill reads the restored pstack skills and playbooks it names, by path, for principles, design, and standards. It does not depend on the 0.2.1 modified workflow; every path it names resolves in the restored pack.

## Playbooks and references

- [Plan authoring](playbooks/program-plan.md) and [single PR](playbooks/single-pr.md).
- [Review reception](references/review-reception.md) and [run ledger](playbooks/run-ledger.md).
- [Run graph](references/run-graph.md) format and [worktree topology](references/worktree-topology.md).
- [Role prompts](references/roles/) and the [report contract](references/report-contract.md).
- [Provenance](references/provenance.md) records where every moved piece came from.

**Reply.** The phase you are in, the artifacts and their paths, the verification readiness decision and evidence, feature-map coverage and update dispositions, the formal decision and sync disposition, the hats in play and any fallback disclosed, the gates' evidence, and the blockers with their exact obstacles.
