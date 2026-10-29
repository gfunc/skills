# gfunc-skills

The operator's own stack: the original pstack vendored at upstream content, with the wayfinder → to-spec planning chain integrated and execution through start-dev's one-spec-one-PR workflow. This glossary fixes the planning vocabulary, the execution vocabulary, the code-design vocabulary, and the seam where they meet.

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

### Code design

**Module**:
A unit of code with an interface and an implementation, where the interface is everything a caller must know to use it.
_Avoid_: component, service

**Interface**:
The surface a module exposes to its callers: the types, functions and invariants they must know. It is also the test surface.
_Avoid_: API, signature

**Seam**:
A place where behavior can be changed without editing the code that calls it. One adapter is a hypothetical seam; two make it real.
_Avoid_: boundary, layer

**Depth**:
The leverage of a module: how much behavior hides behind how small an interface. A deep module hides more behind less.
_Avoid_: size, complexity

### Execution

**Plan**:
The handoff artifact from planning to execution: one lint-checked PR section whose units are ordered by a dependency graph, with a lane table and one final gate.
_Avoid_: spec, design doc

**Unit**:
The smallest execution work item: one file lane, its own worktree and its own scoped tests, merged only when those tests pass.
_Avoid_: box, task

**Run**:
The execution of one plan: its ready sets, unit gates, final verify, review and landing, recorded in the progress log and the run ledger.

**Progress log**:
The run's append-only execution record at `.scratch/<spec>/progress.md`, one line per state a resume needs. `show-me-your-work` owns its format and resume rule.
_Avoid_: ledger, changelog

**PR**:
One spec's landing unit, identified by slug; its single plan section holds every unit, and the owner lands it on the clean verdict.
_Avoid_: branch, changeset

**Owner**:
The agent that owns one PR end to end — dispatch, unit gates, review and landing — and never edits its branch. The `dev-owner` agent where the profile reports nested spawn; otherwise the main agent. A merge worker is the only writer of the branch.

**Lane**:
One final-gate verification scenario, one per changed sub-feature plus the regression journey. There is no fixed count.
_Avoid_: gates lane, ten lanes

**File lane**:
A disjoint file glob assigned to a unit for parallel execution. Always qualified; bare "lane" is a verification scenario.
_Avoid_: lane

**Drive**:
The act of exercising the running app through its surface driver along one journey, capturing evidence. A final-gate lane is driven; it is not itself a drive.
_Avoid_: lane

**Feature map**:
The verify skill's `features/` directory: the maintained source of user journeys for live verification.
_Avoid_: test suite, wayfinder map

**Feature entry**:
One feature file in a feature map, holding the sub-features, user entry points, driving recipe, and gotchas for one feature.
_Avoid_: map entry, test file

**Journey**:
One user path within a feature entry; a final-gate lane drives one journey under one condition.
_Avoid_: flow, scenario

**Swarm**:
The fan-out of lanes at a PR head whose reports aggregate into a verdict.

**Verdict**:
The swarm's judgment on one patch: clean only when every lane passes, voided by a new head unless the patch itself is unchanged.
_Avoid_: CI green, approval

**Ledger**:
The run's verification record in `run.md`: one row per gate and unit merge, with its evidence.
_Avoid_: progress log

**Standing orders**:
The numbered constraint register — model policy, verification bar, forbidden paths, escalation — pasted verbatim into every plan, spawn, and resume.

**Store**:
The repo-local artifact root for all stack activity in one repository: its `.scratch/` directory, with each run under `.scratch/<spec>/`. The local stand-in for Cursor's injected per-agent store.

**Vendor manifest**:
The list of upstream-origin (pstack) paths in this repo and the base SHA they came from; the sync script diffs mirror@old→new per path and reports drift for human resolution.

**Operator**:
The human the run serves: lands PRs, answers escalations, holds stand-down authority.
_Avoid_: user

### Vocabulary seam

Where planning and execution meet.

- A spec's decomposition becomes the plan's **units** at authoring time; when **work tickets** exist (written on request), each becomes a unit. The spec's whole build becomes one **PR**.
- A **decision ticket** has no execution counterpart; it is resolved before any plan exists.
- **Ticket frontier** is planning's list of takeable decisions. Execution has no frontier, because the ready set is recomputed from the graph after every merge.
- **Standing orders** and **operator** name the same concept on both sides; the stack keeps its own standing-orders register and pastes it into every plan it emits.
### Distribution

**Harness**:
One agent runtime the pack targets: kimi-code, Claude Code, Codex, pi-coding-agent, or Cursor.

**Port**:
The per-harness equivalent of a harness-specific mechanism (a role→model table, a trail-audit reader). A mechanism is kimi-native until its ports exist.

**Harness profile**:
One file per harness (`references/harnesses/<harness>.md`) holding that harness's machinery facts and capability list. Each native plugin's adapter, or `scripts/resolve-harness` on a plain clone or Codex, selects the active profile and supplies `harness`, `profile-root`, and `profile`. The pointer is absolute in hook, extension, and resolver deliveries. Static prompt artifacts (Kimi, Cursor) cannot know the install path at authoring time, so they send `profile-root=plugin` (the installed plugin root) with a relative `profile` such as `references/harnesses/<harness>.md`; resolve the pair to one absolute path before reading, and pass that absolute path to a child. No setup step copies a profile, and there is no shared `references/harness.md`.
