# gfunc-skills

The operator's own stack: pstack vendored and modified, with the wayfinder → to-spec planning chain integrated and execution through poteto-mode's autopilot-stack. This glossary fixes the planning vocabulary, the execution vocabulary, and the seam where they meet.

## Language

### Planning

**Map**:
The index of one wayfinding effort: its destination, decisions so far, uncharted fog, and scope boundary.
_Avoid_: roadmap, epic

**Decision ticket**:
A ticket whose resolution is a decision; wayfinder's unit of planning, closed by an answer, not by code.
_Avoid_: task

**Work ticket**:
A ticket whose resolution is a finished slice of the build; an optional intermediate artifact between spec and plan, written on request.
_Avoid_: task, story

**Ticket frontier**:
The open, unblocked, unclaimed tickets of a map — the decisions takeable right now. Never shortened to "frontier" (see Seam).

**Surface**:
A unit's execution surface (ui, cli, library, backend), inferred at plan-authoring time; it keys the lane profile the plan's PR section carries.

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

**Store**:
The repo-local artifact root for all stack activity in one repository: its `.scratch/` directory, with each plan run under `.scratch/<feature-slug>/`. The local stand-in for Cursor's injected per-agent store.

**Vendor manifest**:
The list of upstream-origin (pstack) paths in this repo and the base SHA they came from; the sync script diffs mirror@old→new per path and reports drift for human resolution.

**Operator**:
The human the program serves: lands PRs, answers escalations, holds stand-down authority.
_Avoid_: user

### Seam

Where the two vocabularies meet.

- A spec's decomposition becomes the plan's **units** at authoring time; when **work tickets** exist (written on request), each becomes a unit. A feature's ticket set becomes one **PR**.
- A **decision ticket** has no execution counterpart; it is resolved before any plan exists.
- **Ticket frontier** and **merge frontier** share a word and nothing else: the first is planning's list of takeable decisions, the second is execution's computed set of mergeable PRs. Stack artifacts always use the qualified forms.
- **Standing orders** and **operator** name the same concept on both sides; the stack keeps its own standing-orders register and pastes it into every plan it emits.
### Distribution

**Harness**:
One agent runtime the pack targets: kimi-code, Claude Code, Codex, pi-coding-agent, or Cursor.

**Port**:
The per-harness equivalent of a harness-specific mechanism (a role→model table, a trail-audit reader). A mechanism is kimi-native until its ports exist.

**Harness profile**:
One file per harness (`references/harnesses/<harness>.md`) holding that harness's machinery facts and capability list. Each native plugin's adapter, or `scripts/resolve-harness` on a plain clone or Codex, selects the active profile and supplies its absolute path. No setup step copies a profile, and there is no shared `references/harness.md`.
