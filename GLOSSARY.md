# Companion pack for pstack

The planning chain (wayfinder → to-spec → to-tickets) that hands execution to pstack. This glossary fixes the pack's planning vocabulary, the pstack execution vocabulary the pack speaks unchanged at the seam, and the translation between the two.

## Language

### Planning

**Map**:
The index of one wayfinding effort: its destination, decisions so far, uncharted fog, and scope boundary.
_Avoid_: roadmap, epic

**Decision ticket**:
A ticket whose resolution is a decision; wayfinder's unit of planning, closed by an answer, not by code.
_Avoid_: task

**Work ticket**:
A ticket whose resolution is a finished slice of the build; to-tickets' output and the plan emitter's input.
_Avoid_: task, story

**Ticket frontier**:
The open, unblocked, unclaimed tickets of a map — the decisions takeable right now. Never shortened to "frontier" (see Seam).

**Surface**:
A work ticket's declared execution surface (ui, cli, library, backend); it keys the lane profile the emitted plan section carries.

### Execution

**Plan**:
The handoff artifact from planning to execution: a lint-checked checklist of units, one section per PR, that pstack's autopilot runs box by box.
_Avoid_: spec, design doc

**Unit**:
One box in a plan: the smallest execution work item, checked only when its named evidence exists.
_Avoid_: box, task

**PR**:
The evidence vehicle for one feature; every unit of the feature lives in its single plan section, and the swarm verdict lands on its head.
_Avoid_: branch, changeset

**Owner**:
The agent that runs one PR end to end — all its units, its evidence, its merge-ready report. One owner per PR.

**Lane**:
One verification scenario in a swarm: a gates lane, a live lane, the perf lane, or an audit lane.

**Swarm**:
The fan-out of lanes at a PR head whose reports aggregate into a verdict.

**Verdict**:
The swarm's judgment on one patch: clean only when every lane passes, voided by a new head unless the patch itself is unchanged.
_Avoid_: CI green, approval

**Ledger**:
The running verification record of a program: one entry per verdict, invalidated when the PR head moves.

**Merge frontier**:
The computed set of PRs in a stack that are clear to merge now; regenerated after every merge. Never shortened to "frontier" (see Seam).

**Standing orders**:
The numbered constraint register — model policy, verification bar, forbidden paths, escalation — pasted verbatim into every plan, spawn, and resume.

**Operator**:
The human the program serves: lands PRs, answers escalations, holds stand-down authority.
_Avoid_: user

### Seam

Where the two vocabularies meet.

- A **work ticket** becomes a **unit** when the emitter writes it into a plan; a feature's ticket set becomes one **PR**.
- A **decision ticket** has no execution counterpart; it is resolved before any plan exists.
- **Ticket frontier** and **merge frontier** share a word and nothing else: the first is planning's list of takeable decisions, the second is execution's computed set of mergeable PRs. Pack artifacts always use the qualified forms.
- **Standing orders** and **operator** name the same concept on both sides; the pack keeps its own standing-orders register and pastes it into every plan it emits.
