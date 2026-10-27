---
name: start-dev
description: Human-invoked front door for the full post-spec lifecycle. Accepts a to-spec spec, runs the restored architect skill's Phase A+B for the design, plans with a run graph like a dev lead, orchestrates execution through the dev-owner agent in parallel waves, and runs a confrontational review before the operator lands. Use for /start-dev, "run the spec", "start development".
disable-model-invocation: true
---

# start-dev

`/start-dev <spec>` takes an approved spec and runs the whole lifecycle behind it: design, plan, execution, review. The invocation is the go for intake; the operator's go after the plan approval is the go for execution. This skill is human-invoked only.

The lifecycle is spec intake → architect → verification readiness → dev-lead plan → orchestrate → confrontational lead review → operator land.

## Entry and exit

**Entry.** `/start-dev <spec>` reads the spec at the given path. The spec acceptance checklist: problem, solution, stories, implementation decisions, testing decisions, out of scope, open questions. A thin or contradictory spec, or a missing product decision, routes back to wayfinder or to-spec rather than being silently filled in; start-dev settles only what an experiment can settle. When no spec document exists, run the `to-spec` synthesis inline, write the spec into the run root, and continue. The run root is the spec's parent directory, and a wayfinder map keeps its own slug and is linked, never merged.

**Exit.** A merge-ready PR: the review lead's PASS verdict, the merge recommendation, the decision trail, open risks, and follow-ups. The operator lands. Start-dev never merges, tags, publishes, or installs, and never rewrites the spec.

**Stop conditions.** Blocked design, blocked plan, a failed review after the loop limit, missing credentials or permissions, or a product call no experiment settles.

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
| Orchestrator | Main agent | Schedules waves, confirms staffing, runs the goal, orchestrates the review loop. |
| PR owner | The [`dev-owner`](../../agents/dev-owner.md) agent | Execution only; it does not plan or review. |
| Dev, critical-dev, reviewer, fixer, merge worker, research | Role prompts under [`references/roles/`](references/roles/) | Spawned on the profile's Role mapping types. |
| Review lead | A fresh subagent on a different model family with the [review-lead prompt](references/roles/review-lead.md) | Confrontational; independent of `dev-owner` and the main agent; never edits. |

Where the profile reports no nested spawn, the PR-owner hat collapses to the main agent, which runs the [PR-owner role prompt](references/roles/pr-owner.md) itself and spawns devs directly. On Pi the plan and review hats collapse too, with the reduced independence disclosed in the ledger. Every resolution comes from the active profile's Role mapping.

## Scope adaptation

Read the spec and its ticket set, then pick one layer. When the input admits two readings, run the smaller layer and say why.

| Input | Layer | Playbook |
|---|---|---|
| One PR of work, any size | The PR owner runs it directly | [`playbooks/pr-owner.md`](playbooks/pr-owner.md) |
| One feature, several PRs | The feature owner runs the ticket queue | [`playbooks/ticket-queue.md`](playbooks/ticket-queue.md), one PR owner per ready ticket |
| Several features, one program | The program orchestrator runs the program plan | [`playbooks/program-plan.md`](playbooks/program-plan.md), then each feature's queue |

Packaging, one PR or a base-chained stack, is not a separate workflow.

## Design

The main agent runs the design phase inside the restored [`architect`](../architect/SKILL.md) skill's Phase A and B. `/start-dev` is the human invocation, so the main agent follows that skill's phases deliberately, not as an auto-invocation. Read [`references/principles.md`](references/principles.md), the start-dev copy of the Principles index, in full and apply every principle it names, the core, architecture, verification, delegation, and meta principles, not a design-relevant subset. The leaf `principle-*` skills are the authority for each: read the leaf for any principle that shapes a decision, and name that principle with the specific choice it changed in the design rationale. Start-dev authors no separate design principles. This full-index requirement is start-dev's constraint layered on the `architect` container.

**Phase A, Ground.** Run `how` over the affected subsystems and produce the architectural understanding it prescribes. When the design redefines ownership or layering, also run `why` so the existing rationale becomes a constraint. Skip Phase A only for genuine greenfield with no surrounding system.

**Phase B, Sketch.** Run `architect` Phase B exactly: `arena` with the design-sketch task and the Phase A grounding, each runner taking `architect`'s `references/runner-prompt.md`, the runners drawn from the `architect runners` line in `~/.agents/pstack-models.md`. At least two structurally distinct candidates before synthesis, whole-shape alternatives rather than point fixes. Screen every candidate against `architect`'s [`references/design-red-flags.md`](../architect/references/design-red-flags.md). Compare the viable candidates on interface depth and prefer the design that hides more complexity behind a smaller public surface. Arena returns one synthesized design package, and its synthesis decision fills the rationale's synthesis section.

**Stop before Phase C.** The mandatory design review, a fresh subagent on a different model family or the operator, replaces `architect`'s Agree checkpoint, and the operator's plan approval follows it. The design review checks the design artifact and its rationale against the full Principles index in [`references/principles.md`](references/principles.md), not a subset. It also checks the formal signal and one-sentence property, including a `none` claim against the closed signal list. Phase D, Implement, is `dev-owner`'s execution phase; the synthesized sketch is the contract the plan carries and the implementation fills in against. Phase E, Scrap, is the re-design route: when execution or review shows the sketch is wrong as a pattern, re-run Phase A and B and re-chart the plan rather than bolting fixes onto a wrong design.

For a contested design, run `interrogate` before the design review; for a question a run can settle, run `prototype`. Do not run the `architect` skill's Phase C checkpoint; the design review is that gate here.

The design artifact is the Phase B synthesized package, its types, signatures, module boundaries, rationale, base and grafts, plus the design review. It records the surface (`ui`, `cli`, `library`, or `backend`); drivability evidence (the launch or e2e setup command, ready signal, one driven journey, timestamp, and any production boundary that requires a supported seam); and the formal signal (`concurrency/interleaving`, `retries/timeouts`, `state machine/protocol`, `parser/serializer`, `unsafe/FFI`, or `distributed ordering`) with a one-sentence property, or `none`. It lives in the run root and is referenced from the plan. When the design contradicts the spec, route back to wayfinder or to-spec; do not silently rewrite the spec.

## Verification readiness

Principles: apply the phase row in § Principles.

After the design review and before the plan lead charts the run graph, the main agent that ran Phase A/B decides verification readiness. It may delegate the launch probe to a research subagent, but the decision stays with the main agent. Read the design package, the repo's launch or e2e setup, the existing project skills, and the drivability probe. A test-only mock never counts. An e2e setup that boots the real app and drives the real surface is the launch and drive recipe; the generated skill wraps it rather than duplicating it.

Record one drivability state:

- `drivable`: the real app launches from a clean checkout and reaches a usable state.
- `drivable-with-boundary`: a repo-supported production seam isolates the third party; name the boundary and the unproven journeys.
- `not-drivable`: no launch path or no supported seam exists.

**App skill.** Decide `exists`, `exists-stale`, `create-after-first-drivable-batch`, `create-before-amendment`, or `not-required`. Route `exists-stale` to `maintain-verification-skill`, never recreation. Allow `not-required` only when no `ui` or `cli` surface exists. Any `ui` or `cli` surface triggers the gate. Multiple apps get one verify skill each; the primary is the app the design's journeys touch, and the operator decides only a tie.

**Formal.** Decide `exists`, `exists-stale`, `create`, or `not-required`. Route `exists-stale` to `maintain-formal-verification-skill`. For `not-required`, record the checked signal list and `none`; the design review can challenge it.

**Recording.** Hand the decision and evidence to the plan lead. The plan records them in `## Verification readiness` between `## How to read this` and `## Program checklist`, and the run root gains one append-only `decisions.tsv` row referencing that section.

## Plan

Principles: apply the phase row in § Principles.

The [plan lead](references/roles/plan-lead.md) receives the verification readiness decision and evidence as inputs, then charts the [run graph](references/run-graph.md) before execution: nodes are PRs or features and the atomic tasks, edges are blocking dependencies and file-lane collisions, groups are waves, plus the critical path and the gates. The readiness decision determines the creation task and the `[gate: verification]` and `[gate: formal]` nodes and edges. The plan carries the readiness table, the verify-skill and feature-map paths, map-driven live-lane coverage, staffing (the role-to-model map, confirmed with the operator outside auto mode), risk with a fallback per risk, the worktree topology, and the review plan. The plan review by a fresh subagent or the operator precedes the operator's go. A design or spec change re-charts and re-approves. See [`playbooks/program-plan.md`](playbooks/program-plan.md).

## Execution

Principles: apply the phase row in § Principles.

The main agent turns the approved graph into waves that maximize parallel atomic tasks by file lane; lane collisions are serialized. [`playbooks/pr-owner.md`](playbooks/pr-owner.md) and [`references/worktree-topology.md`](references/worktree-topology.md) carry the flow: one feature worktree holds the PR branch; each parallel wave gets a wave worktree with task worktrees branching from it and the merge worker integrating task branches there, with the full gate on the wave worktree after the wave; a serial wave runs in the feature worktree; after all waves, merge into the feature worktree, run the full gate and the fixer loop, and open the PR from the feature branch. The full gate is the PR section's `Verify, unit`, ten `Verify, live` lanes, `Verify, formal`, and `Verify, perf` blocks. The carrier PR's creation-task prove-once is part of its gate.

On a harness with `/goal`, run execution under goal mode with the merge-ready PR as the completion criterion, foreground children or passive completion waits, and no background polling and no audit tick. On a harness without it, normal mode with the same no-polling rule. The profile's Role mapping names which applies.

## Review

Principles: apply the phase row in § Principles.

The [review lead](references/roles/review-lead.md) runs the confrontational review of the PR head against the spec, the design, the plan, the feature map, the formal skill's coverage record, and the evidence. It opens the map and coverage record independently. It checks that every changed user-facing behavior has a feature-entry update, every lane's feature entry exists and matches its scenario, every named evidence path exists, and the formal sync commit covers the current covered code; a covered-code change without a rerun or sync update is a finding. It files findings, the fixer resolves them, the main agent orchestrates, and the review lead gives PASS, FIX, or BLOCK plus a merge recommendation. At most three loops. The operator lands.

## Boundaries

- The main agent is the architect in design and the orchestrator after it. It does not run the confrontational review.
- One writer per branch. `dev-owner` is the only writer of its PR branch. The root never pushes; owners push only their own branch.
- Every brief carries the [report contract](references/report-contract.md) verbatim and declares `owns: <steps>`.
- Every brief carries one `Model: <role>=<model>` line per role named in the active harness profile's `### Role model table`, drawn from the profile's harness-native model store; the brief requires each child to pass its line's model on every spawn. A missing role line falls back to `~/.agents/pstack-models.md`, then the skill's stated default.
- The standing orders in [`references/standing-orders.md`](references/standing-orders.md) are stamped into every plan and carried verbatim in every brief.
- Run artifacts live under `.scratch/<effort>/` per the [run ledger](playbooks/run-ledger.md). Durable plans a restored pstack playbook authors stay in `docs/`.
- This skill reads the restored pstack skills and playbooks it names, by path, for principles, design, and standards. It does not depend on the 0.2.1 modified workflow; every path it names resolves in the restored pack.

## Playbooks and references

- [Program plan](playbooks/program-plan.md) and [ticket queue](playbooks/ticket-queue.md).
- [PR owner](playbooks/pr-owner.md) and [run ledger](playbooks/run-ledger.md).
- [Run graph](references/run-graph.md) format and [worktree topology](references/worktree-topology.md).
- [Role prompts](references/roles/) and the [report contract](references/report-contract.md).
- [Provenance](references/provenance.md) records where every moved piece came from.

**Reply.** The phase you are in, the artifacts and their paths, the verification readiness decision and evidence, feature-map coverage and update dispositions, the formal decision and sync disposition, the hats in play and any fallback disclosed, the gates' evidence, and the blockers with their exact obstacles.
