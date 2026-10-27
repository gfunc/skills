# start-dev verification touch map

**Question.** Which files, scripts, and checks in `skills/start-dev/` would a verification-readiness step and a feature-map lane contract have to touch? For each anchor: is it **must change** or **reference only**, and what is at stake?

**Source.** The shipped 0.3.0 tree at `.scratch/start-dev-0.3.0/lanes/release/skills/start-dev/` (commit `11cebf3`, `feat(start-dev): own a copy of the pstack Principles index`). That tree is byte-identical to `origin/main` at `36f2492689a27d7a13d177dd0406d2bd373f4744` (`diff -rq` clean), so every line number below applies to either. The main checkout is on an older branch and was not used for content.

**Method.** Read every file in the skill, the three playbooks, all eight references, all nine role prompts, both checker scripts, the smoke test, and the five harness profiles. Ran the checker's suite (`node --test scripts/check-plan.test.ts`: 26 pass, 0 fail). Ran two controlled probes against the checker fixture: the unmodified passing fixture, and the same fixture with a `## Verification readiness` section inserted. No start-dev content was edited. The research is textual plus those probes; no model-backed run was performed.

**Classification.** **must change** means the port's contract cannot be stated correctly without editing this anchor. **reference only** means the anchor states, enforces, or consumes verification in a way the port must respect, but its text does not change. A "must change (light)" marker means a phrase or pointer, not a structural rewrite.

## The answer in one paragraph

The port has two separate wiring jobs, not one. The readiness step is a lifecycle insertion: `SKILL.md`'s phase chain and plan handoff, the plan lead's inputs, `program-plan.md`'s stamping step, and a recorded decision in the plan. The lane contract is a rewrite of the verification paragraph, the skeleton's `Verify, live` block, the boot recipe, and `check-plan.mjs`. The enforcement gap is the real work: today's checker validates the *shape* of ten lanes but not their provenance, and the one standing order that names a driver ("Playwright is the control skill") contradicts the plan's surface-based control-skill rule and is stamped verbatim into every brief. A plan can pass today with invented lanes, no `verify-<app>` skill, no feature map, and no readiness decision; I proved that with the checker's own passing fixture. The port's centre of gravity is therefore the checker and its negative controls, not more prose.

## Must-change set at a glance

1. **Lifecycle and phase table.** `SKILL.md:11` (phase chain), `:29` (plan row), `:38` (spec-acceptance naming collision), `:39` (design package), `:40` (plan lead), `:44` (review lead), `:68` (ordering), `:72` (design artifact), `:78` (plan contents), `:84` (full gate), `:92` (review scope), `:111` (reply).
2. **Plan-lead inputs and plan contents.** `references/roles/plan-lead.md:7,9,11,17,19`; `playbooks/program-plan.md:8,10,13`.
3. **Verification and control-skill prose.** `playbooks/program-plan.md:15,17,19`.
4. **Plan skeleton.** `references/plan-skeleton.md:18-21` (read list), `:32-33` (spawn/dependency), `:50` (verdict lanes), `:56` (boot recipe), `:110,112-121` (live lanes), `:130` (review gate), `:143-145` (close).
5. **Gate-strength harmonization.** `playbooks/pr-owner.md:13` ("its live probe") and `playbooks/ticket-queue.md:14` ("at least one live probe") versus `plan-skeleton.md:110` ("Ten lanes") and `program-plan.md:15`.
6. **Standing orders.** `references/standing-orders.md:4` ("Playwright is the control skill"), `:5` (screenshot path).
7. **Checker rules.** `scripts/check-plan.mjs:7` (lane regex), `:182-184` (gates), `:258-302` (Verify, review gate), plus a new readiness-section rule.
8. **Checker tests.** `scripts/check-plan.test.ts:16-74` (fixture) and new negative controls for readiness and map provenance.
9. **Role prompts.** `references/roles/review-lead.md:7,11,21`; `references/roles/pr-owner.md:9,15`; `references/roles/reviewer.md:8`.
10. **Report contract.** `references/report-contract.md:5`.
11. **Run graph.** `references/run-graph.md:21,22,28-32,40`.
12. **Bookkeeping and machinery.** `references/provenance.md:10-14`, `playbooks/run-ledger.md:14,22`, `tests/smoke`, and conditionally `scripts/emit-plan`.

## 1. `SKILL.md`

Phase anchors: **Design** (`:39`, `:68`, `:72`), **Plan** (`:29`, `:40`, `:78`), **Execution** (`:84`), **Review** (`:44`, `:92`), and the **Principles** table (`:25-32`). Design and Plan are the rows a readiness step changes; Execution and Review consume the result.

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 11 | "The lifecycle is spec intake → architect → dev-lead plan → orchestrate → confrontational lead review → operator land." | **must change** | The readiness step has no place in the top-level chain. If it is not inserted between architect and dev-lead plan, it is invisible to every downstream reader. |
| 15 | "The readiness checklist: problem, solution, stories, implementation decisions, testing decisions, out of scope, open questions." | **must change** (naming) | "Readiness" already means spec acceptance. The new gate needs a distinct name, or the operator will read the spec checklist as the verification gate. |
| 17 | "A merge-ready PR: the review lead's PASS verdict, the merge recommendation, the decision trail, open risks, and follow-ups." | reference only | The exit condition stays valid, but the PASS definition changes in `review-lead.md:21` (map coverage). |
| 28 | Architect row: the full index; design-critical includes `prove-it-works`. | reference only | The design phase already carries the verification principle. Readiness is a separate decision, not a new design principle. |
| 29 | Dev-lead plan row: `sequence-verifiable-units`, … `prove-it-works`, `encode-lessons-in-structure`, `foundational-thinking`. | **must change** | This is the phase-to-principle index. A new phase without a row is off-index; readiness needs `prove-it-works` and `test-behavior-not-implementation` named, or a plan row that carries them. |
| 38 | "Spec acceptance \| Main agent \| Checks the readiness checklist; routes gaps back." | **must change** (naming) | Same word, different gate. Rename or qualify to avoid two readiness checklists in one skill. |
| 39 | Architect hat: Phase A/B, design review replaces Agree. | **must change** | The design package must record the surface and drivability evidence readiness consumes; otherwise readiness re-runs the interview or guesses. |
| 40 | Plan lead hat: "Main agent, or a fresh subagent with the plan-lead prompt." | **must change** | The hat table is the contract index; the plan lead must receive the readiness decision as an input. |
| 44 | Review lead hat: "Confrontational; independent of `dev-owner` and the main agent; never edits." | **must change** | The review lead is the only independent check of map drift; the hat must say so or the duty has no owner. |
| 68 | "The mandatory design review … and the operator's plan approval follows it." | **must change** | Ordering: readiness sits after the design review and before the run graph. State it, or readiness can run against a design that is then rejected. |
| 72 | "The design artifact is the Phase B synthesized package … It lives in the run root and is referenced from the plan." | **must change** | This is the handoff object. It must either carry the readiness decision or explicitly name the plan as its carrier. |
| 78 | "The plan carries staffing …, risk …, the worktree topology, and the review plan." | **must change** | The list reads as exhaustive. Add the readiness decision and the feature-map lane source, or the operator approves a plan that omits the new gate. |
| 84 | "the full gate on the wave worktree after the wave … run the full gate and the fixer loop" | **must change** | "Full gate" is undefined here and weaker in `pr-owner.md:13`. If the live half is not map-driven, execution reverts to invented lanes. |
| 92 | "review of the PR head against the spec, the design, the plan, and the evidence." | **must change** | Add the feature map and the readiness decision; otherwise map drift is outside the review's stated scope. |
| 98 | "Every brief carries the report contract verbatim and declares `owns: <steps>`." | reference only | This is the propagation mechanism; the row-shape edit belongs in `report-contract.md:5`, not here. |
| 99 | "The standing orders … are stamped into every plan and carried verbatim in every brief." | reference only | This is why the order-4 edit is high-leverage and why a new order must be chosen carefully; the edit belongs in `standing-orders.md:4`, not here. |
| 111 | "The phase you are in, the artifacts …, the gates' evidence, and the blockers…" | **must change** | The reply must name the readiness decision and map coverage, or the handback silently omits the new gate. |

Also reviewed and unchanged: `:23` (full Principles index requirement), `:54-56` (scope adaptation: the readiness step applies at every layer, so no text change), `:62-66` (design Phase A/B), `:70` (interrogate/prototype), `:86` (goal mode), `:96-97` (hat and writer boundaries), `:100-101` (run artifacts and pstack reads), `:105-109` (playbook/reference index, conditional on a new reference file).

## 2. Playbooks

### `playbooks/program-plan.md`

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 3 | "Principles: apply the `Dev-lead plan` row…" | **must change** (light) | Follows the `SKILL.md` phase-row decision. |
| 5 | "You own the plan, not the code. The plan is a checklist an owner runs box by box…" | reference only | The plan-as-artifact framing is the right carrier for readiness. |
| 7 | "When the change is one or two files with an obvious approach, skip the plan." | reference only | A trivial PR still needs the lane decision, but not the full plan; the readiness step can be a one-line decision. |
| 8 | "Settle open questions by prototype before you write." | **must change** (light) | The drivability test is an experiment; this is the only step that runs one before writing. Name readiness evidence here or it has no evidence path. |
| 9 | "Explore in research subagents … Each returns file pointers, conventions, test commands, and entry points." | reference only | Research can gather drivability evidence, but the readiness owner decides. |
| 10 | "Then fill every remaining placeholder box. Decomposition happens here … Infer each PR section's Surface…" | **must change** | The Surface line is the key for the lane profile. The same step must record the readiness decision and the map entry per PR, or the stamped plan is silent on both. |
| 11 | "Write under `/technical-writing` in full, then `/unslop`." | reference only | Style only. |
| 12 | "Run `check-plan.mjs` and fix every line it prints." | **must change** (light) | The instruction survives, but the rule set changes. Authors need the new failures named or they will treat them as checker exceptions. |
| 13 | "Post the plan path, the script's output, and the step table…" | **must change** | The approval summary must include the readiness decision and map coverage, or the operator approves without seeing them. |
| 15 | "**Verification.** … A `ui` PR runs ten lanes … through the control skill … One lane is the **Regression lane against trunk.**" | **must change** | The core paragraph. Add the map source per lane, the update duty, and keep the regression lane. This is the highest-leverage prose in the skill because every plan's live block is copied from it. |
| 17 | "**Control skill.** Pick it by surface. … `control-ui` … `control-cli` … This stack's local mapping supersedes…" | **must change** | It names cursor-team-kit, then overrides with Playwright/tmux, and never mentions the project-local `verify-<app>` skill. Collapse to one story: the verify skill is the driver, using the profile's UI Driver. |
| 19 | "The surface profiles the checker enforces…" | **must change** | The sentence describes the old checker. If the checker gains readiness/map rules, this paragraph is wrong. |
| 21 | "**Reply:** … what the prototypes proved and what stays unproven …" | **must change** (light) | Add the readiness decision and map coverage. |

### `playbooks/pr-owner.md`

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 3 | "Principles: apply the `Orchestrate execution` row…" | reference only | No change. |
| 5 | "You own one PR branch end to end. You are its only writer." | reference only | Ownership unchanged. |
| 7 | "It names the PR id, the ticket set or plan section, the file lanes, the run root, and the standing orders." | **must change** | The brief must carry the readiness decision, the verify-skill path, the map entries, and the update duty; otherwise the PR owner cannot execute the lane contract it never received. |
| 8 | "Create the PR branch from the base the brief names." | reference only | No change. |
| 9 | "Plan the waves … each one file lane or a disjoint file set…" | reference only | File-lane scheduling unchanged. |
| 10 | "Each brief carries … the success criterion…" | **must change** (light) | If a task changes user-facing behavior, its brief must name the map entry it updates. |
| 11 | "Gate the wave … targeted tests for each task's lane, plus the typecheck and lint once." | reference only | Unit/typecheck/lint gate unchanged. |
| 12 | "Repeat waves until the PR section's Build boxes are done." | reference only | No change. |
| 13 | "Run the feature gate at the PR head: the plan section's Verify, unit block in full, its live probe, and its perf block." | **must change** | "Its live probe" is weaker than the skeleton's ten lanes. This is the gate the PR owner actually runs; it must say ten map-driven lanes. |
| 14 | "Push only your own branch … open the PR ready, never draft…" | reference only | No change. |
| 15 | "Hand back the merge-ready report … the gate evidence paths…" | **must change** (light) | Add map-update evidence and the readiness disposition. |
| 17 | "**Reply.** The PR URL, the wave count … the report-contract step table." | reference only | No change. |

### `playbooks/ticket-queue.md`

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 3 | "Principles: apply the `Dev-lead plan` row…" | reference only | No change. |
| 5 | "You own one feature's queue…" | reference only | No change. |
| 7 | "Take the approved spec … the ledger is initialized…" | reference only | No change. |
| 8 | "one row per PR: id, title, file lane glob, blocking edges, surface." | **must change** | The ticket row is the queue's contract. Add the feature-map entry or feature id, or every PR owner re-derives the lane source. |
| 9 | "Order the queue by the blocking edges." | reference only | No change. |
| 10 | "Stamp the feature's plan sections … pass each through `check-plan.mjs`." | reference only | The checker rules change, not this step. |
| 11 | "Each brief carries the plan section, the file lane, the run root, the standing orders…" | **must change** (light) | Same brief gap as `pr-owner.md:7`. |
| 12 | "Gate each PR at its owner's merge-ready report." | reference only | No change. |
| 13 | "One fresh reviewer … reads the feature's whole diff and its receipts." | **must change** (light) | The feature-level reviewer must check map drift/coverage; otherwise the map is checked only by the PR owner who wrote it. |
| 14 | "The feature's own evidence bar, the union of its PRs' unit boxes, at least one live probe, and the perf block." | **must change** | "At least one live probe" is the weakest gate in the skill. It must become the union of map-driven lanes / coverage, or the feature gate is weaker than the PR gate. |
| 15 | "Close the feature." | reference only | No change. |
| 17 | "**Reply.** The ticket table … each PR URL…" | reference only | No change. |

## 3. References

### `references/plan-skeleton.md`

This file is the template stamped into every plan. It is the single highest-leverage text after `program-plan.md:15`.

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 7 | "Every box names the evidence that checks it … a file, a log line, a screenshot, a test run, or a SHA." | reference only | The evidence bar is already strong; the new boxes fit it. |
| 9 | "The program runs `skills/poteto-mode/playbooks/<execution playbook>.md`." | reference only | The execution playbook is unchanged. |
| 11 | "Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked." | reference only | The exact string is a checker constant (`check-plan.mjs:5-6`) and a How-to-read marker (`:31`). Do not reword. |
| 17 | "State the protocol and this plan to the operator, then stop." | **must change** (light) | The approval must include the readiness decision; add it here or in the readiness section. |
| 18 | "Read these from one source at program start. Re-read them at every tick." | **must change** | The read list must include the `verify-<app>` skill and its feature map, or the lanes read stale instructions. |
| 21 | "`git show origin/main:<control skill path>`" | **must change** | The placeholder becomes the verify-skill path (and/or the profile's UI Driver). The checker ignores it today because it contains `<`/`>` (see `check-plan.mjs:102-113`). |
| 27 | Tick prompt: "Probe every active lane and judge progress by side effects only." | reference only | "Lane" here means a running owner/lane; no change. |
| 32 | "Spawn one owner per PR with the full lifecycle the execution playbook names." | **must change** (light) | The owner's brief must carry the map entry. |
| 33 | "Follow this dependency graph. Start dependent work only after its parent merges…" | **must change** | A folded creation unit is a dependency edge; later live-gated PRs block on it. Without this, the creation unit floats outside the graph. |
| 37 | "Hold the review gate. `<PR ids>` change an interaction." | reference only | The interaction rule stays; map drift can be added to the review gate text. |
| 50 | "One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block." | **must change** | Add "each lane names the feature-map entry it drives" and "a behavior-changing PR updates the map". This is the verdict's lane source. |
| 56 | "Drive UI surfaces with Playwright (`skills/playwright-cli`); CLIs with tmux or a PTY." | **must change** | The boot recipe must drive through the project's `verify-<app>` skill, which uses Playwright/tmux. Otherwise the generated skill is decorative. |
| 61 | "Save every screenshot to `.scratch/<feature-slug>/shots/<pr-id>/worker-<n>/<slug>.png`…" | reference only | The path stays compatible; the map can name the feature ID in the artifact. |
| 82 | "**Staffing.** … critical-dev and reviewer independence…" | reference only | No change. |
| 84 | "**Risk.** … the verification ceiling." | reference only | The readiness decision can be a risk, but the line does not change. |
| 106 | "**Verify, unit.** …" | reference only | Unit gate unchanged; the rule string must stay. |
| 110 | "**Verify, live.** … Ten lanes on `<swarm workers model>` at the PR head, per the boot recipe." | **must change** | Add the map source per lane and the update duty. This is stamped into every plan. |
| 112 | "Lane 1. Regression lane against trunk. Run <the same load-bearing scenario> at trunk and head." | **must change** | The regression lane must name the mapped trunk scenario/feature; otherwise it is invented. |
| 113-121 | "Lane N. <Scenario.> Save `<slug>.png`. Pass when <predicate>." | **must change** (light) | Each lane must name a map entry/journey; the placeholder should carry `<feature-id#sub-feature>`. |
| 123 | "**Verify, perf.** …" | reference only | The perf gate is dual-sided and unchanged; the map may add a budget but the lane contract does not require it. |
| 130 | "**Review gate.** The operator reviews before merge." | **must change** (light) | Add map drift and evidence location to the review gate. |
| 132-134 | "Copy lane `<n>` screenshots … Record a 30 to 60 second video … Post … and wait for the operator's click." | reference only | The evidence mechanics stay. |
| 143-145 | "## Close the program … Every box above is checked with its evidence." | **must change** | Add the map-update box; otherwise the close can pass with drift. |
| 148-162 | Appendices A-D. | reference only | Prototype/alternatives/risks/links; no change. |

### `references/standing-orders.md`

This register is stamped into every plan (`program-plan.md:10`) and carried verbatim in every brief (`SKILL.md:99`). An edit here is felt everywhere, and so is a contradiction.

| Line | Quote | Class | What is at stake |
|---|---|---|---|
| 1 | "Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked." | reference only | Must remain byte-exact; the checker matches this prefix (`check-plan.mjs:258-261`). |
| 2 | "CI green is an input to a verdict, not a verdict." | reference only | Reinforces evidence. |
| 3 | "Inconclusive is not a pass." | reference only | Applies to map lanes unchanged. |
| 4 | "Playwright is the control skill." | **must change** | Direct contradiction. Playwright cannot drive a CLI/TUI, and a `verify-<app>` skill may use tmux/PTY or another harness. Stamped into every plan and brief, it overrides the plan's own control-skill choice. |
| 5 | "Save screenshots to `.scratch/<feature-slug>/shots/<pr>/worker-<n>/`." | **must change** (light) | If the lane contract names feature-map evidence, this path must be reconciled; otherwise there are two evidence locations. |
| 6 | "Evidence is exit codes and output tails, never a self-report." | reference only | Applies. |
| 13 | "Stay under the verification ceiling." | reference only | Budget constraint. |
| 17 | "Long gates tee to `.scratch/<feature>/logs/`." | reference only | Evidence location. |
| 21 | "Prove new or changed tests can fail … (negative control)." | reference only | This is the model for the checker's new negative controls. |
| 25 | "Models are per-plan … Role names are feature, refactoring, bug-fix, judgment and prose, swarm workers…" | reference only | No change. |

### `references/run-graph.md`

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 3 | "The plan lead charts the run graph before execution. It lives in the plan's `## Run graph` block…" | reference only | The graph stays in the plan. |
| 21 | "A `pr:` or `feature:` node per PR or feature; a `task:` node per atomic task, labeled with its id and file lane. A gate node per wave gate, plus the feature gate and the review gate." | **must change** | Add the readiness gate and the folded creation unit. Also note the checker requires a lane on every `task:`/`pr:`/`feature:` node, not only task nodes. |
| 22 | "`-->\|blocks\|` for a blocking dependency; `-->\|lane <glob>\|` for a file-lane collision. Both serialize." | **must change** (light) | If a map edge is added, it needs a label and checker support. Otherwise the map has no place in the graph. |
| 23 | "Each `subgraph W<n>` is one wave of tasks that run in parallel." | reference only | Wave semantics unchanged. |
| 24 | "**Critical path.** … the longest blocking chain, with its gates." | reference only | No change. |
| 28-32 | Checker rules: graph parses, task node, lane, wave-gate edge, feature/review gates, acyclic. | **must change** | The list is the checker's advertised contract. Add readiness and any new node/edge rules; also correct `:29` ("Every task node carries a lane") to match the checker (every task/pr/feature node). |
| 36 | "The checker proves structure, not design." | reference only | Still true; the map adds provenance, not design judgment. |
| 40 | "A design or spec change re-charts the graph…" | **must change** (light) | A readiness change (e.g. `create-before-amendment`) also re-charts; add it. |

### `references/worktree-topology.md`

| Line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| 3 | "One feature worktree, one wave worktree per parallel wave, one task worktree per atomic task." | reference only | Topology unchanged. |
| 14-17 | Feature worktree; parallel wave with the full gate; serial wave; after all waves. | reference only | Gate content changes, topology does not. |
| 23 | "Task and wave worktrees are removed after their wave's gate passes and the review has the evidence it needs." | **must change** (light) | If the folded creation unit produces the `verify-<app>` skill in a task worktree, it must be committed/merged before removal. State that the artifact survives. |
| 27 | "The gates do not change." | reference only | Still true under collapse; the new gate also does not change. |

### `references/report-contract.md`

| Line | Quote | Class | What is at stake |
|---|---|---|---|
| 3 | "Every start-dev brief carries this contract verbatim." | reference only | The propagation mechanism. |
| 5 | "One todo and one result row per owned step, in the shape `step \| executed \| absorbed \| blocked \| evidence`." | **must change** | The readiness decision and map update need a row or a disposition; otherwise the contract cannot report them. |
| 6 | "`absorbed` names the child or step owner that absorbed the step and the evidence." | reference only | The shape stays. |
| 7 | "If you cannot spawn … return it as `BLOCKED` with a reason. Never mark it done." | reference only | Applies. |
| 8 | "Return file pointers, not raw dumps." | reference only | Applies. |
| 9-10 | The contract lives in the briefs and playbooks, not `agents/poteto-agent.md`. | reference only | No change. |

### Supporting ledger references

| File:line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| `playbooks/run-ledger.md:22` | "Record the lifecycle handoffs as they happen: spec acceptance, the design artifact and its review, the plan and run graph with their review, the operator's go…" | **must change** | Add verification readiness to the handoff list; otherwise the run's memory omits the decision. |
| `playbooks/run-ledger.md:14` | "One row per PR: id, title, file lane, edges, surface, state." | **must change** (light) | If `tickets.tsv` gains a map column, this description follows. |
| `playbooks/run-ledger.md:26` | "Audit the ledger … Compare the plan's obligations and the standing orders with the execution evidence, including obligations absent from the log." | reference only | This audit is exactly how a readiness/map omission should be caught. |
| `references/ledger-templates.md:43,65` | `tickets.tsv` header `id title file lane edges surface state`. | **must change** (light) | Same column decision. |
| `references/ledger-templates.md:48,58` | `run.md` PR and review/fix tables. | reference only | Can hold map findings and verdict heads without a schema change. |

### Principles copy

| File:line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| `references/principles.md:31-37` | The **Verification** bucket: "Prove It Works", "Fix Root Causes", "Sequence Work into Verifiable Units", "Test Behavior, Not Implementation", "Explain the Number". | reference only | The readiness decision applies `prove-it-works`; the lane contract applies `test-behavior-not-implementation` and `sequence-verifiable-units`. The leaf skills remain the authority, so start-dev's copy does not change. |
| `references/principles.md:33` | "**Prove It Works.** After a task, before declaring done. Verify against the real artifact, not a proxy or \"it compiles\"." | reference only | This is the principle the readiness gate operationalizes; naming it in the plan is enough. |

### Machinery

| File:line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| `tests/smoke:125-129` | Runs `check-plan.mjs` on the emitted skeleton and only prints a note about the exit code. | **must change** | The only end-to-end artifact test does not exercise readiness or the new lane rules; add a readiness section and assertions. |
| `tests/smoke:147-151` | Asserts `## Run graph`, `Continuation: `, `[gate: feature]`, and `[gate: review]`. | **must change** (light) | Add the readiness gate/creation unit if the run graph changes. |
| `scripts/emit-plan:86-93` | `replaceRequired` on exact skeleton markers (`# <Program> plan`, `<execution playbook>`, `<swarm workers model>`, `Surface: ui`, PR heading). | reference only (conditional) | It only changes if the port wants the readiness decision stamped rather than authored; a placeholder section needs no emitter change. |
| `references/provenance.md:10-14` | `plan-skeleton.md` "Unchanged except its owning script"; `check-plan.mjs` "Content unchanged." | **must change** | Both claims become false after the port; update the provenance table in the same change. |

## 4. `scripts/check-plan.mjs`: what it enforces today

The checker is a structural validator with a style pass. It reads the plan, strips frontmatter, tracks fences, and then validates sections and blocks. It never reads a target repo, a skill, or a map.

### 4.1 The constants

| Line | Constant | Behavior |
|---|---|---|
| 5-6 | `RULE` | The exact sentence "Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked." |
| 7 | `LANES` | Requires the phrase "Ten lanes on <model> at the PR head", with the model in backticks and no angle brackets in that token. |
| 8 | `SURFACES` | `ui`, `cli`, `library`, `backend`. The default when no `Surface:` line is `ui` (`:243`). |
| 9 | `LANE_ARTIFACT` | `ui` requires a `Save` box naming a path; `cli` requires a `Log` box naming a path. |
| 10-20 | `SUB_BLOCKS` | Exact ordered nine blocks: `Depends on.`, `Files.`, `Build.`, `You see.`, `Verify, unit.`, `Verify, live.`, `Verify, perf.`, `Review gate.`, `Merge.` |
| 21 | `PROGRAM_H3` | `Arm the program`, `Spawn owners`, `PR mechanics`, `Verdict and merge`, `Boot recipe`, in order, with extra H3s allowed after them. |
| 22 | `PROGRAM_STATUS_MARKER` | `status message`. |
| 23 | `REMOTE_READ_MARKER` | `git show origin/main:`. |
| 24 | `PLUGIN_TOKEN` | Backtick token extractor. |
| 25 | `CONTINUATION_LINE` | `Continuation: <non-space>`. |
| 26-32 | `HOW_TO_READ_MARKERS` | Five literals, including `playbooks/` and the full `RULE`. |
| 33 | `PERF_ITEMS` | `Metric.`, `Probe.`, `Baseline.`, `Rule.` in exact order. |
| 34 | `BOX` | `- [ ]` or `- [x]` only. |

### 4.2 `Verify, unit` / `Verify, live` / `Verify, perf`

| Check | Line | What it enforces | What it does not enforce |
|---|---|---|---|
| Rule prefix | 258-261 | Every one of the three blocks must start with `RULE` after the bold label. Applies to all surfaces. | It does not check that the rule is *true* of the boxes; the rule is a string prefix. |
| Unit boxes | 254-257 | `Verify, unit.` must have at least one box. | It does not check that the box names a test file, a case, or a command. |
| Live, `ui`/`cli` | 263-279 | `live.rest` must match `LANES`; lane boxes must be `Lane 1.` … `Lane 10.`; each must contain the surface artifact (`Save` for ui, `Log` for cli); each must contain `Pass when`. | It does not check the scenario, the feature-map source, the regression-lane label, the pass predicate's meaning, or the evidence path's existence. |
| Live, `library`/`backend` | 276-278 | At least one live box. | It does not require a probe command, a result, or a map entry. |
| Perf | 281-285 | Exactly four boxes, in order, whose first words are `Metric.`, `Probe.`, `Baseline.`, `Rule.`. | It does not check the metric, the interleaved probe, the trunk baseline, or the failing number. |

### 4.3 The control skill

**There is no control-skill check.** The only appearance of a control skill in the checker's world is the skeleton's backticked `git show origin/main:<control skill path>` (`plan-skeleton.md:21`), and the checker's plugin-path extractor explicitly excludes tokens containing `<` or `>` (`:102-113`). The checker's own passing fixture (`check-plan.test.ts:16-74`) contains no control-skill line and exits 0. I ran the extracted fixture through the checker: `1 PR sections, 0 problems`, exit 0. So a plan can pass with no control skill named at all, and the `program-plan.md:17` paragraph is pure prose.

### 4.4 Lanes

- **Count and shape are enforced.** `ui`/`cli` need exactly lanes 1 to 10 in that numeric set (`:268-270`), with a `Save` or `Log` artifact and a `Pass when` predicate (`:271-275`).
- **Provenance is not enforced.** The lane text can be any scenario; there is no requirement that it names a feature-map entry, a user journey, or a `verify-<app>` skill. The checker's own fixture's lane 1 is "Lane 1. Save `lane-1.png`. Pass when evidence exists." — no regression label, no map — and it passes.
- **The regression lane is not enforced.** `program-plan.md:15` says "One lane is the **Regression lane against trunk.**", but the checker never looks for that string. A plan can label all ten lanes with arbitrary scenarios and pass.
- **The surface profiles are enforced.** `ui`/`cli` need lanes; `library`/`backend` must have no lane requirement and a `None.` review gate (`:289-294`). The default surface is `ui`, so a PR with no `Surface:` line gets the strictest lane profile by accident.

### 4.5 Run graph

| Check | Line | Behavior | Gap |
|---|---|---|---|
| Section | 168-169 | `## Run graph` required. | — |
| Mermaid | 171-172 | A fenced `mermaid` block required. | — |
| `graph TD` | 176 | Must declare `graph TD`. | — |
| Nodes | 177-181 | At least one `task:`, `pr:`, or `feature:` node; **every** such node must contain ` lane `. | `run-graph.md:29` says only task nodes carry a lane; the checker is stricter. A `feature:` node without a lane fails. |
| Gates | 182-184 | `[gate: feature]` and `[gate: review]` required. | No readiness gate, no wave-gate edge check. |
| Waves | 185-186 | At least one `subgraph W<n>[`. | `run-graph.md:30` says every wave has a wave-gate edge or feeds the feature gate; the checker only checks that one wave subgraph exists. |
| Acyclic | 187-210 | DFS over parsed edges; a cycle fails. | Edges inside `subgraph` blocks or with non-identifier node names may be missed. |
| Critical path | 211-212 | A line starting `**Critical path.**` or `Critical path:`. | It does not check that the line is non-empty or accurate. |

### 4.6 Program checklist, read source, and style

- Five H3s in order, with extra H3s allowed after them (`:144-153`).
- `status message` must appear somewhere in the section (`:154-156`).
- A read source is required: `git show origin/main:` or at least one installed-plugin path (`:157-163`).
- A `Continuation: <mechanism>` line is required (`:164-165`).
- Installed plugin paths: token must start `/`, contain `/plugins/` and `/skills/`, end `.md`, and contain no `<`, `>`, or `*` (`:102-113`). If the plugin root is absent, the checker prints a note and passes (`:119-121`); if the root exists but the file is missing, it fails (`:123-126`).
- Style: long dashes (`–`/`—`), curly quotes, and `: ` (colon + non-space) in prose fail (`:84-88`), with exemptions for a `Surface:` line and a `Continuation:` line (`:86-88`). Backticked spans are stripped before the colon check (`:80-83`), so "Decision `exists`" passes while "Decision: exists" fails.

### 4.7 What the checker does not enforce, summarized

1. No `## Verification readiness` section, decision token, or evidence.
2. No `verify-<app>` skill existence, path, or read box.
3. No feature-map existence, seeding, entry, or update duty.
4. No lane provenance (map entry per lane).
5. No "Regression lane against trunk" label.
6. No control-skill selection or path.
7. No exact `None. <PR id> is not review-gated.` sentence; `None.` alone passes for `library`/`backend`.
8. No interaction rule for `ui`/`cli`: a `ui` PR with `**Review gate.** None.` and no boxes passes (the checker's own fixture does exactly this).
9. No wave-gate edge check.
10. No map-drift check in the review gate.
11. No report-contract row check.
12. No readiness/map box in the close section.

## 5. `scripts/check-plan.test.ts`: negative controls

The suite has 26 tests: 16 negative controls (expect exit 1) and 10 positive controls (expect exit 0). The fixture `validPlan` (`:16-74`) is a `ui` plan by default. It contains no control-skill path, no feature map, no readiness section, and a `**Review gate.** None.` — and it passes. That single fact is the strongest evidence of the enforcement gap.

### 5.1 Negative controls, by test name

| Test (line) | Mutation | What it rejects |
|---|---|---|
| "rejects headings and prose outside a proper close" (111) | A `## Example only` heading after a non-appendix close; a mid-sentence colon in prose outside a fence | Fence leakage and style violations. |
| "rejects backtick info strings containing a backtick" (121) | A fence opener whose info string contains a backtick | Ambiguous fence parsing; the following heading is treated as outside. |
| "rejects a library plan with a gated review form" (141) | `Surface: library` + `**Review gate.** The operator reviews before merge.` | `library`/`backend` must use `None.` |
| "rejects a ui plan missing lanes" (151) | Lane 1 replaced by `- [ ] Check the thing.` | `ui` live block must be ten numbered lanes. |
| "rejects an unknown Surface value" (160) | `Surface: banana` | Surface vocabulary. |
| "rejects more than one Surface line in a PR section" (174) | `Surface: ui` followed by `Surface: cli` | Surface ambiguity. |
| "rejects a program checklist with no Continuation line" (193) | Remove `Continuation: /goal` | Harness continuation is mandatory. |
| "rejects an installed plugin path when the plugin is present and the file is missing" (211) | Plugin root exists; named file absent | Read-source resolution. |
| "rejects a program checklist with neither a remote marker nor an installed plugin path" (234) | Remove `git show origin/main:` | A read source is mandatory. |
| "rejects a plugin-sourced plan whose tick prompt reads from trunk" (240) | Plugin path plus `Re-read the execution playbook from trunk.` | Stale read source. |
| "rejects a run graph missing a task lane" (257) | `T2[task: b]` | Every task node needs a file lane. |
| "rejects a run graph missing the review gate" (263) | Remove `[gate: review]` | Review gate presence. |
| "rejects a run graph missing the feature gate" (270) | Remove `[gate: feature]` | Feature gate presence. |
| "rejects a cyclic run graph" (278) | Add `T3 -->\|blocks\| T1` | Acyclicity. |
| "rejects a plan with no run graph section" (284) | Remove `## Run graph` | Section presence. |
| "rejects a run graph with no wave subgraph" (291) | Rename `subgraph W1`/`W2` to `subgraph Group` | Wave vocabulary. |

### 5.2 Positive controls

| Test (line) | What it accepts |
|---|---|
| "accepts ordinary, indented, and longer closing fences" (94) | Closing fences with 0-3 spaces and a longer fence. |
| "accepts nested backticks and tilde info strings" (100) | A four-backtick outer fence containing a three-backtick fence, and a `~~~` fence with an info string. |
| "keeps mismatched, shorter, and suffixed closers inside the fence" (105) | Closers that do not match the opener stay inside the fence. |
| "accepts a cli plan with Log lanes" (126) | `Surface: cli` with `Log` artifacts. |
| "accepts a library plan without lanes and with a None review gate" (133) | `Surface: library`, one live box, `None.` review gate. |
| "accepts extra H3s after the required five in the Program checklist" (166) | Extra `###` sections after the five required ones. |
| "accepts an indented Surface line without a colon flag" (183) | `  Surface: ui` is exempt from the colon check. |
| "accepts a profile-named Continuation line" (188) | `Continuation: CronCreate hourly tick`. |
| "accepts an installed plugin path when the file exists" (199) | Plugin path that resolves. |
| "accepts an installed plugin path when the plugin is absent and prints a note" (223) | Absent plugin root produces a note, not a failure. |

### 5.3 Controls missing for the new contract

Each of these needs a fixture mutation and an asserted failure message; without them the new rules are unproven.

1. Plan has no `## Verification readiness` section.
2. Readiness decision is missing or not one of `exists`, `create-after-first-drivable-batch`, `create-before-amendment`, `not-required`.
3. A `ui`/`cli` PR has no feature-map entry in any live lane.
4. The readiness decision is `exists` but the named `verify-<app>` skill or feature-map file does not exist.
5. A behavior-changing PR has no map-update box.
6. Lane 1 is not the regression lane (if the contract keeps the label).
7. The review gate omits map drift.
8. A `ui`/`cli` surface is `not-required` for verification (policy says gated).
9. `create-after-first-drivable-batch` has no batch marker or no folded creation unit.
10. The plan names no control skill (if the port makes the control skill mandatory).
11. The run graph has a readiness gate node but no edge into the first live-gated PR.
12. The run graph's folded creation unit is not a task/PR node with a lane.

## 6. `references/roles/*.md`

| File:line | Quote (abridged) | Class | What is at stake |
|---|---|---|---|
| `plan-lead.md:7` | "Inputs: the accepted spec and the design artifact…" | **must change** | Add the readiness decision, the `verify-<app>` path, and the feature map. Without them the plan lead cannot chart the lane source. |
| `plan-lead.md:9` | "**Chart the run graph first.** … Name the critical path, the wave gates, the feature gate, and the review gate." | **must change** | Add the readiness gate and the folded creation unit; otherwise the graph cannot show the new dependency. |
| `plan-lead.md:11` | "**Then the plan.** … the design artifact reference; the verification ceiling; the risk register…" | **must change** | Add the readiness record and the map lane mapping. |
| `plan-lead.md:13` | "**Staffing.** Roles and models per unit…" | reference only | No change. |
| `plan-lead.md:15` | "**Plan review.** Your plan is reviewed by a fresh subagent or the operator…" | reference only | The review scope changes; the step does not. |
| `plan-lead.md:17` | "**Re-planning.** A design or spec change re-charts the graph…" | **must change** (light) | A readiness change also re-charts. |
| `plan-lead.md:19` | "Return the plan path, the graph, and the report-contract rows." | **must change** (light) | Add the readiness decision. |
| `review-lead.md:5` | "You run the confrontational final review … You read and judge; you never edit." | reference only | No change. |
| `review-lead.md:7` | "Your brief carries the PR head, the evidence, and the spec, design, and plan." | **must change** | Add the feature map and the readiness decision; otherwise the review lead cannot check map drift. |
| `review-lead.md:11` | "Does the PR do what the spec says, the way the design says, in the order the plan charts?" | **must change** | Add "Does it update the feature map it changes?" |
| `review-lead.md:12` | "Are the claims evidenced? Check exit codes and output tails yourself…" | reference only | Applies unchanged. |
| `review-lead.md:13` | "What did the owner not test? Name the untested path…" | **must change** (light) | Name the untested map entries as well as code paths. |
| `review-lead.md:17` | "**Method.** Use `interrogate` … `swarm` audit lanes …" | reference only | No change. |
| `review-lead.md:21` | "**Verdict.** … PASS means every lane's evidence resolved and no finding stands." | **must change** | PASS must include map coverage and no map drift, or the verdict can pass a PR that left the map stale. |
| `review-lead.md:23` | "Return the verdict, the findings … the review ledger path." | reference only | No change. |
| `pr-owner.md:9` | "It names the PR id, the plan section, the run graph, the design artifact, the file lanes, the run root, the staffing, the worktree topology, and the standing orders." | **must change** | Add the readiness decision, the `verify-<app>` path, the map entries, and the update duty. |
| `pr-owner.md:13` | "each lane's targeted tests, plus typecheck and lint once." | reference only | Wave gate unchanged. |
| `pr-owner.md:15` | "The full gate … the plan section's unit, live, and perf blocks…" | **must change** | The live block is the map-driven ten lanes, not a generic live probe. |
| `pr-owner.md:17` | "Hand back the merge-ready report … the gate evidence paths…" | **must change** (light) | Add map-update evidence. |
| `reviewer.md:7` | "Read the diff … and the evidence receipts. Distrust the report text…" | reference only | The reviewer's method already fits map evidence. |
| `reviewer.md:8` | "File findings … with the file, the line, and the concrete failure or risk." | **must change** (light) | Add map drift as a finding class. |
| `reviewer.md:10` | "Distinguish a defect … from a note…" | reference only | No change. |
| `reviewer.md:11` | "Return findings only. The fixer resolves them; the review lead owns the verdict." | reference only | No change. |
| `dev.md:7` | "one atomic task: a file lane, the named data shape …, the success criterion, the standing orders, and the report contract." | reference only | The dev's brief is unit-level; the map duty belongs to the PR owner. |
| `dev.md:10` | "Write the change and its test … Prove a new or changed test can fail before it passes." | reference only | Unit verification unchanged. |
| `dev.md:11` | "Evidence is exit codes and output tails, never a self-report." | reference only | Applies. |
| `dev.md:12` | "Return one row in the `step \| executed \| absorbed \| blocked \| evidence` shape…" | reference only | No change. |
| `dev.md:13` | "If the task is not atomic, or two tasks share your lane, say so and stop…" | reference only | No change. |
| `critical-dev.md:9,11,12` | Data shape, strongest judgment model, report row. | reference only | No verification contract change. |
| `fixer.md:9,10` | Re-run targeted tests, record exit codes, one row per finding. | reference only | No change. |
| `merge-worker.md:10,11` | Run the wave gate's targeted tests; return SHAs and exit codes. | reference only | No change. |
| `research.md:7,9,10` | Ground the question with file pointers, commands, sources; no design or edits. | reference only | Can gather drivability evidence, but the readiness owner decides. |

**Role conclusion.** Only three role prompts need structural edits: plan-lead, review-lead, pr-owner. Reviewer gets one finding class. Dev, critical-dev, fixer, merge-worker, and research are reference only. No new role is needed if the folded creation unit runs under `dev-owner` following `create-verification-skill`.

## 7. Harness profiles

The five profiles live at `references/harnesses/{claude,codex,cursor,kimi,pi}.md`. No profile text needs to change for this port; they are the authority the plan must read. The key fields are `UI Driver`, `Skill folders`, and `Role mapping`.

| Profile | Anchor | Quote / fact | Class | What is at stake |
|---|---|---|---|---|
| claude | `:45` | "**UI driver:** `playwright-cli` (`skills/playwright-cli`)." | reference only | The plan's control skill must resolve to this, not to a hardcoded cursor-team-kit name. |
| claude | `:62` | "Skill folders: project `.claude/skills/`; user `~/.claude/skills/`." | reference only | The generated `verify-<app>` skill lives in `.claude/skills/` on this harness. The plan must not hardcode `.cursor/skills`. |
| claude | `:70-78` | PR owner is the plugin agent `dev-owner`; devs/reviewers are general subagents; nested spawn to three layers; fallback collapses the PR owner to the main agent. | reference only | The folded creation unit is executable by `dev-owner`; under the depth limit the main agent runs it and discloses the reduced independence. |
| codex | `:45` | "**UI driver:** `playwright-cli`." | reference only | Same control-skill constraint. |
| codex | `:62` | "Skill folders: project `.agents/skills/`; user `~/.codex/skills/` and `~/.agents/skills/`." | reference only | The generated skill's project path is `.agents/skills/verify-<app>/`. |
| codex | `:70-78` | PR owner is the custom `dev-owner` TOML; devs use `worker`; nested spawn yes; fallback to main. | reference only | Same execution path; the TOML copy is a pack convention, not a plugin feature. |
| cursor | `:45` | "**UI driver:** `playwright-cli`." | reference only | Same. |
| cursor | `:62-63` | Skill folders `.cursor/skills/`; HAS "the cursor-team-kit skills (`deslop`, `control-ui`, `control-cli`)". | reference only | This is the only profile with native `control-ui`/`control-cli`. The plan must not generalize that to every harness. |
| cursor | `:70-78` | PR owner is the plugin agent; nesting one extra level; fallback to main. | reference only | Folded unit execution path. |
| kimi | `:76` | "**UI driver:** `playwright-cli`." | reference only | Same. |
| kimi | `:93` | "Skill folders: project `.kimi-code/skills/` and `.agents/skills/`…" | reference only | The generated skill's project path is harness-specific. |
| kimi | `:95` | "**LACKS:** per-agent `model:` frontmatter; `deslop` and the cursor-team-kit control skills; a built-in PR tool." | reference only | This is the decisive constraint: `program-plan.md:17` cannot require `control-ui`/`control-cli` without a fallback. |
| kimi | `:101-109` | PR owner is the plugin `dev-owner`; its `subagents` allowlist (`coder, explore`) is the nesting opt-in; without it the agent is a leaf and the main orchestrator spawns devs; fallback disclosed. | reference only | The folded creation unit may collapse to the main agent; the plan must not assume a nested spawn. |
| pi | `:37` | "The pack's plan gate is a checked plan (`emit-plan` plus `check-plan`), not a harness mode." | reference only | The readiness gate cannot rely on plan mode; it must be in the checked plan. |
| pi | `:45` | "**UI driver:** `playwright-cli`." | reference only | Same. |
| pi | `:62` | "Skill folders: project `.pi/skills/` and `.agents/skills/`…" | reference only | The generated skill's project path is harness-specific. |
| pi | `:68-78` | Degraded mapping: no stock subagents; the PR owner collapses to the main agent; the review lead is the main agent in a fresh read with reduced independence disclosed. | reference only | The folded creation unit runs sequentially in the main agent; the readiness decision still applies, but the independence disclosure is mandatory. |

**Harness conclusion.** No profile edit is required, and no profile should be edited to name `verify-<app>`: the generated skill is a *project* artifact, not a pack artifact. This holds only if the folded creation unit runs under `dev-owner`, as the settled policy assumes; a separate verification owner would require a Role mapping edit in all five. The port's obligation is the reverse: `program-plan.md:17` and `standing-orders.md:4` must stop treating `control-ui`/`control-cli` or Playwright as universal, and must defer to the active profile's `UI Driver` and `Skill folders`.

## 8. The design-to-plan handoff and the readiness carrier

### 8.1 Where the handoff lives

The handoff is a chain, not a single file:

1. `SKILL.md:72` defines the design artifact and says it "lives in the run root and is referenced from the plan."
2. `SKILL.md:78` gives the plan lead the graph-first duty and lists what the plan carries: staffing, risk, worktree topology, review plan; the plan review precedes the operator's go; a design or spec change re-charts and re-approves.
3. `playbooks/program-plan.md:10` is where the plan is stamped and decomposed; `:12` runs the checker; `:13` hands back for approval.
4. `references/roles/plan-lead.md:7` names the inputs (spec + design artifact); `:9` charts the graph first; `:11` writes the plan.
5. `playbooks/run-ledger.md:22` records the handoffs as they happen: "spec acceptance, the design artifact and its review, the plan and run graph with their review, the operator's go…"

Readiness belongs at the plan lead's input boundary and must be recorded before the plan approval. It is not a design activity and not an execution activity; it is the decision that turns the design's surface into a plan constraint.

### 8.2 The carrier: a plan-level section plus the existing decision ledger

**Recommendation.** Add a `## Verification readiness` H2 to `plan-skeleton.md`, placed between `## How to read this` and `## Program checklist`. Carry these fields:

| Field | Content |
|---|---|
| `Decision` | One of `exists`, `create-after-first-drivable-batch`, `create-before-amendment`, `not-required`. Backtick the token to satisfy the checker's colon rule. |
| `Surface` | The PR's or feature's surface(s), matching `ui`/`cli`/`library`/`backend`. |
| `Evidence` | The drivability probe or the existing-skill check, with the command and output tail. |
| `Skill` | The `verify-<app>` path, or `none yet` with the creation trigger. |
| `Map` | The `features/` path, or `none yet` with the seeding trigger. |
| `Owner` | The plan lead or the named role that made the call. |

Record the same decision as one append-only row in `.scratch/<effort>/decisions.tsv` (template `date \t decision \t evidence`, `ledger-templates.md:71`), referencing the plan section. Do not add a new ledger: `decisions.tsv` already exists for exactly this kind of lifecycle decision, and `run-ledger.md:22` already lists the handoffs it must record. The plan is the durable, operator-approved artifact; the ledger row is the run's memory. The design artifact remains the input, not the carrier, because it is authored by `architect` and may be rejected after the readiness step.

### 8.3 Why this placement is safe

- **The parser.** `check-plan.mjs:221-223` computes `prSections` as the H2 sections between `## Program checklist` and `## Close the program`, excluding `## Run graph`. A readiness H2 *before* `## Program checklist` is not a PR section, so it does not need a `Surface:` line, nine sub-blocks, or lanes. I verified this: a fixture with the readiness H2 inserted exits 0 with `1 PR sections, 0 problems`.
- **The H3 alternative.** A `### Verification readiness` inside `## Program checklist` is also tolerated: `PROGRAM_H3` allows extra H3s after the five required ones (`check-plan.test.ts:166`). The H2 is more visible to the operator and is the recommended shape.
- **The style trap.** `Decision: exists` fails the checker's mid-sentence colon rule (`check-plan.mjs:88`). The first probe failed at that line; a backticked `exists` passed. Use a backticked token or a table, never `Field: value` prose.
- **The checker branch.** If the checker requires the section, it must branch on the decision: `exists` -> the named skill/map file must resolve; `create-after-first-drivable-batch` / `create-before-amendment` -> the plan must carry a folded creation unit and a dependency edge, and the file may not exist yet; `not-required` -> only allowed for `library`/`backend`. Without the branch, a legitimate "create later" plan fails the checker.
- **The emitter.** `emit-plan` can stamp a placeholder decision in the new section, but it does not have to: the author fills the section like every other placeholder. If it stamps, add a `replaceRequired` marker in `scripts/emit-plan` and a smoke assertion.

### 8.4 What "the readiness decision" must not become

It is not a new copy of the spec's test plan. `SKILL.md:15` already checks "testing decisions" at spec acceptance. The verification-readiness decision is narrower: *is there a scripted way to drive this surface, and if not, when will the run create it?* The four tokens are the whole output; the evidence is the proof of the call.

## 9. Collisions the port must resolve

1. **"Lane" is overloaded three ways.** A *file lane* is a glob in `run-graph.md:21-22`, `tickets.tsv`, and every brief. A *live lane* is one of the ten `Verify, live` scenarios (`plan-skeleton.md:110-121`). The new *feature-map lane* would be a third. Recommend naming the new unit a **journey** or **map entry**, and keeping "lane" for the ten live lanes and "file lane" for the graph. Otherwise the plan lead, the checker messages, and the PR briefs will disagree about what a lane is.
2. **Gate strength drifts.** `plan-skeleton.md:110` and `program-plan.md:15` require ten lanes; `playbooks/pr-owner.md:13` says "its live probe"; `playbooks/ticket-queue.md:14` says "at least one live probe"; `references/roles/pr-owner.md:15` says "unit, live, and perf blocks" without a count. The PR owner and feature owner run the weaker versions. The port must align all four on the skeleton.
3. **Standing order 4 versus the control skill.** `standing-orders.md:4` says "Playwright is the control skill." `program-plan.md:17` says `control-ui`/`control-cli`, then overrides with Playwright/tmux. A `verify-<app>` skill is a third story. Because the register is stamped verbatim into every plan and brief, order 4 wins by default unless it is rewritten. Fix order 4 and `program-plan.md:17` together: "Drive through the surface's control skill; on this stack, the project's `verify-<app>` skill, which uses the profile's UI Driver (Playwright for UI, tmux/PTY for CLI)."
4. **`SUB_BLOCKS` is exact-order.** Adding a `**Verify, readiness.**` or `**Feature map.**` block to every PR section requires editing `check-plan.mjs:10-20` and breaks every existing plan. The plan-level H2 avoids this entirely. If a per-PR block is chosen, it needs a migration note and a version bump in the rule.
5. **H2 placement matters.** A readiness H2 between `## Program checklist` and `## Close the program` is parsed as a PR section (`check-plan.mjs:221-223`) and will fail the nine-block check. Put it before `## Program checklist`.
6. **`ui`/`cli` review-gate loophole.** The checker accepts `**Review gate.** None.` on a `ui` PR with no boxes; its own fixture does this (`check-plan.test.ts:65`). If the port wants the interaction rule enforced, the checker needs a separate "changes an interaction" signal — the Surface alone is not enough.
7. **Run-graph lane rule mismatch.** `run-graph.md:29` says "Every task node carries a lane"; `check-plan.mjs:179-181` requires a lane on every `task:`, `pr:`, and `feature:` node. The port should pick one and make the doc and checker agree, especially when adding a creation-unit node.
8. **Wave-gate edge is advertised but not checked.** `run-graph.md:30` requires each wave to have a wave-gate edge; `check-plan.mjs:185-186` only requires one `subgraph W<n>`. If the readiness gate is a wave, add the edge check.
9. **Kimi and Pi do not offer the cursor-team-kit control skills.** `kimi.md:95` lists them as LACKS; `pi.md` names no control skill and has no stock subagents. A plan that hardcodes `control-ui`/`control-cli` has no fallback on those profiles. The `verify-<app>` skill and the profile's UI Driver are the portable story.
10. **The readiness decision needs a pending state.** A `create-after-first-drivable-batch` plan cannot name an existing `verify-<app>` file. The checker must allow the pending state, and the report contract must record it as `blocked`/`absorbed` with the creation trigger, not as done.
11. **"User-facing behavior" is undefined.** The update duty ("a behavior-changing PR updates the relevant feature file") is only enforceable if the plan or the checker names what counts. Otherwise every PR claims no map change. Recommend a per-PR `Map` line with either the feature file or `none — no user-facing behavior`, plus a review-lead challenge.
12. **Generated-skill path is profile-dependent.** `create-verification-skill:11` says `<skills>` is the project skill folder the active profile's `Skill folders` field names. The plan must not hardcode `.cursor/skills`; each profile names its own project skill folder.
13. **Provenance claims will go stale.** `provenance.md:10` says `plan-skeleton.md` is "Unchanged except its owning script"; `:12` says `check-plan.mjs` is "Content unchanged." Both become false after the port. Update the provenance table in the same change, or the sync/attribution record is wrong.
14. **The smoke test does not exercise readiness.** `tests/smoke:125-129` runs `check-plan` on the emitted skeleton and only notes the exit code; `:147-151` asserts the run-graph gates and Continuation. Add the readiness section and the new gate to the smoke assertions, or the only end-to-end artifact test misses the new contract.
15. **The emitter's placeholder logic.** `emit-plan:86-93` uses `replaceRequired` on exact markers. A new readiness section with placeholders is fine for the author, but if the port wants the decision stamped, it needs a new marker and a test.

## 10. Evidence limits

- This is a read-only textual study plus two checker probes. No start-dev content was edited; no model-backed run was performed.
- The checker suite passes: `node --test scripts/check-plan.test.ts` -> 26 tests, 26 pass, 0 fail (Node v26.12.0).
- Probe 1: the extracted `validPlan` fixture (with `${rule}` and `${laneBlock}` expanded) -> `1 PR sections, 0 problems`, exit 0. That fixture contains no control-skill path, no feature map, no readiness section, and no "Regression lane" label; `grep` for `verify-|control-ui|control-cli|feature map|Regression lane` returns nothing. This is the proof that the current checker does not enforce the new contract.
- Probe 2: the same fixture with `## Verification readiness` inserted before `## Program checklist` -> `1 PR sections, 0 problems`, exit 0. The first attempt used `Decision: exists` and failed at line 8 of the temporary plan with "mid-sentence colon"; a backticked `exists` passed. This is the proof of the recommended carrier and its style constraint.
- The 0.3.0 tree is byte-identical to `origin/main` at `36f2492`. If `origin/main` moves, line numbers may drift; the quotes are the stable reference.
- The feature-map shape is quoted from `skills/create-verification-skill/SKILL.md:36-38` and its `references/feature-map-example/README.md:33-42`; no start-dev integration of that shape exists yet, so the lane contract is a design proposal, not a description of shipped behavior.
- No downstream ticket is resolved here. Tickets 04 (readiness contract), 05 (folded unit), 06 (lane contract), 07 (formal gate), 08 (maintenance), and 10 (port spec) still own the decisions. This map classifies anchors and recommends a carrier; it does not choose the decision tokens' policy.
- Harness control-skill availability is from the profile text, not from a live harness run. In particular, the Kimi profile's LACKS line and Pi's no-stock-subagent line are documentation claims, not observations made in this study.
