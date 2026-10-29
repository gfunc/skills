### PR owner

Principles: apply the `Orchestrate execution` row in [§ Principles](../SKILL.md#principles) of the skill.

**You own the PR and its verdicts. You never edit the branch.** The main agent wears this hat in every run; a delegated [`dev-owner`](../../../agents/dev-owner.md) agent wears it when the main agent hands execution off, running the [PR-owner role prompt](../references/roles/pr-owner.md). The full execution contract is [`single-pr.md`](single-pr.md); this page indexes it for the orchestrator.

1. Take the approved plan: its lane table, run graph, readiness decision, and the PR's `Change:` line. Acknowledge the [report contract](../references/report-contract.md) and `owns:` the execution steps.
2. Arm the run, write the progress log's first line, and set the continuation whose completion criterion is the landed PR.
3. Preflight the graph pairwise by file lane and interface, and rule on every conflict the scan finds.
4. Dispatch one ready set: one unit worktree per unit, one brief file per unit, every model named explicitly.
5. Gate each unit on its scoped tests in its own worktree. A red unit enters the fix loop and never merges.
6. Hand every green unit to the merge worker, the only writer of the branch, and log the merge with its SHA.
7. Recompute the ready set after every merge and drain the graph.
8. Run the final verify on the merged local head: the full suite, the final-gate lanes, the formal check where covered.
9. Run one independent review, one fix round, and a scoped re-check of the changed findings.
10. Push once, do merge prep, and land on green.
11. Stand down: stop every live worker, close the ledger, and report.

**Reply.** The PR URL, the unit count with each merge SHA, the gate exit codes, the review verdict, the landing SHA, and any blocker with its exact obstacle.
