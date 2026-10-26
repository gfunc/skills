---
name: start-dev
description: Human-invoked front door for the full post-spec lifecycle. Accepts a to-spec spec, architects the design arena-led, plans with a run graph like a dev lead, orchestrates execution through the dev-owner agent in parallel waves, and runs a confrontational review before the operator lands. Use for /start-dev, "run the spec", "start development".
disable-model-invocation: true
---

# start-dev

`/start-dev <spec>` takes an approved spec and runs the whole lifecycle behind it: design, plan, execution, review. The invocation is the go for intake; the operator's go after the plan approval is the go for execution. This skill is human-invoked only.

The lifecycle is spec intake → architect → dev-lead plan → orchestrate → confrontational lead review → operator land.

## Entry and exit

**Entry.** `/start-dev <spec>` reads the spec at the given path. The readiness checklist: problem, solution, stories, implementation decisions, testing decisions, out of scope, open questions. A thin or contradictory spec, or a missing product decision, routes back to wayfinder or to-spec rather than being silently filled in; start-dev settles only what an experiment can settle. When no spec document exists, run the `to-spec` synthesis inline, write the spec into the run root, and continue. The run root is the spec's parent directory, and a wayfinder map keeps its own slug and is linked, never merged.

**Exit.** A merge-ready PR: the review lead's PASS verdict, the merge recommendation, the decision trail, open risks, and follow-ups. The operator lands. Start-dev never merges, tags, publishes, or installs, and never rewrites the spec.

**Stop conditions.** Blocked design, blocked plan, a failed review after the loop limit, missing credentials or permissions, or a product call no experiment settles.

## Hats

| Hat | Who | Notes |
|---|---|---|
| Spec acceptance | Main agent | Checks the readiness checklist; routes gaps back. |
| Architect | Main agent | Arena-led design; reuses the restored poteto-mode Principles index; authors no separate design principles. |
| Plan lead | Main agent, or a fresh subagent with the [plan-lead prompt](references/roles/plan-lead.md) | A read-only plan agent cannot write the plan. |
| Orchestrator | Main agent | Schedules waves, confirms staffing, runs the goal, orchestrates the review loop. |
| PR owner | The [`dev-owner`](../../agents/dev-owner.md) agent | Execution only; it does not plan or review. |
| Dev, critical-dev, reviewer, fixer, merge worker, research | Role prompts under [`references/roles/`](references/roles/) | Spawned on the profile's Role mapping types. |
| Review lead | A fresh subagent on a different model family with the [review-lead prompt](references/roles/review-lead.md) | Confrontational; independent of `dev-owner` and the main agent; never edits. |

Where the profile reports no nested spawn, the PR-owner hat collapses to the main agent, which runs the [PR-owner role prompt](references/roles/pr-owner.md) itself and spawns devs directly. On Pi the plan and review hats collapse too, with the reduced independence disclosed in the ledger. Every resolution comes from the active profile's Role mapping.

## Design

The main agent runs the architect phase. Read the restored [poteto-mode Principles index](../poteto-mode/SKILL.md) and its design-relevant `principle-*` leaves; start-dev authors no separate design principles.

1. `how` grounds the affected subsystem.
2. `arena` runs the architectural design discussion, as poteto-mode uses it: competing designs, base selection, and grafting. It is the default for a non-trivial design.
3. `architect` sketches the selected design's types, signatures, and module boundaries.
4. `interrogate` when the arena cannot settle a contested design; `prototype` for a question a run can settle.

The artifact is the arena's competing designs, the selected base and grafts, the type and module sketch, the data model, and any prototype evidence. It lives in the run root and is referenced from the plan. The design review is a fresh subagent on a different model family or the operator; the architect never reviews its own design. When the design contradicts the spec, route back to wayfinder or to-spec; do not silently rewrite the spec.

## Plan

The [plan lead](references/roles/plan-lead.md) charts the [run graph](references/run-graph.md) before execution: nodes are PRs or features and the atomic tasks, edges are blocking dependencies and file-lane collisions, groups are waves, plus the critical path and the gates. The plan carries staffing (the role-to-model map, confirmed with the operator outside auto mode), risk with a fallback per risk, the worktree topology, and the review plan. The plan review by a fresh subagent or the operator precedes the operator's go. A design or spec change re-charts and re-approves. See [`playbooks/program-plan.md`](playbooks/program-plan.md).

## Execution

The main agent turns the approved graph into waves that maximize parallel atomic tasks by file lane; lane collisions are serialized. [`playbooks/pr-owner.md`](playbooks/pr-owner.md) and [`references/worktree-topology.md`](references/worktree-topology.md) carry the flow: one feature worktree holds the PR branch; each parallel wave gets a wave worktree with task worktrees branching from it and the merge worker integrating task branches there, with the full gate on the wave worktree after the wave; a serial wave runs in the feature worktree; after all waves, merge into the feature worktree, run the full gate and the fixer loop, and open the PR from the feature branch.

On a harness with `/goal`, run execution under goal mode with the merge-ready PR as the completion criterion, foreground children or passive completion waits, and no background polling and no audit tick. On a harness without it, normal mode with the same no-polling rule. The profile's Role mapping names which applies.

## Review

The [review lead](references/roles/review-lead.md) runs the confrontational review of the PR head against the spec, the design, the plan, and the evidence. It files findings, the fixer resolves them, the main agent orchestrates, and the review lead gives PASS, FIX, or BLOCK plus a merge recommendation. At most three loops. The operator lands.

## Boundaries

- The main agent is the architect in design and the orchestrator after it. It does not run the confrontational review.
- One writer per branch. `dev-owner` is the only writer of its PR branch. The root never pushes; owners push only their own branch.
- Every brief carries the [report contract](references/report-contract.md) verbatim and declares `owns: <steps>`.
- The standing orders in [`references/standing-orders.md`](references/standing-orders.md) are stamped into every plan and carried verbatim in every brief.
- Run artifacts live under `.scratch/<effort>/` per the [run ledger](playbooks/run-ledger.md). Durable plans a restored pstack playbook authors stay in `docs/`.
- This skill reads the restored pstack skills and playbooks it names, by path, for principles, design, and standards. It does not depend on the 0.2.1 modified workflow; every path it names resolves in the restored pack.

## Playbooks and references

- [Program plan](playbooks/program-plan.md) and [ticket queue](playbooks/ticket-queue.md).
- [PR owner](playbooks/pr-owner.md) and [run ledger](playbooks/run-ledger.md).
- [Run graph](references/run-graph.md) format and [worktree topology](references/worktree-topology.md).
- [Role prompts](references/roles/) and the [report contract](references/report-contract.md).
- [Provenance](references/provenance.md) records where every moved piece came from.

**Reply.** The phase you are in, the artifacts and their paths, the hats in play and any fallback disclosed, the gates' evidence, and the blockers with their exact obstacles.
