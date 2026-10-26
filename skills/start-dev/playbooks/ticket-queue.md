### Ticket queue

Principles: apply the `Dev-lead plan` row in [§ Principles](../SKILL.md#principles) of the skill.

**You own one feature's queue. The main agent holds this role for a single feature.** Several PRs, blocking edges, file lanes, one PR owner subagent per PR.

1. Take the approved spec. Confirm the run root is the spec's parent directory and the ledger is initialized per the [run ledger](run-ledger.md) playbook.
2. Decompose the feature into PRs. One PR is one change with its own evidence. Write the ticket set into `features/<id>/tickets.tsv` with one row per PR: id, title, file lane glob, blocking edges, surface. A ticket set that a wayfinder map or spec already carries is imported, not rewritten.
3. Order the queue by the blocking edges. Two tickets whose file lanes overlap are serialized by an edge even when the work is independent. Compute the ready set after every PR completes.
4. Stamp the feature's plan sections with `node skills/start-dev/scripts/emit-plan`, one PR section per ticket, and pass each through `node skills/start-dev/scripts/check-plan.mjs`. Fix every line it prints before any spawn.
5. Spawn one `dev-owner` PR owner per ready ticket, in one message so they run concurrently, per the profile's Role mapping. Where nesting is unavailable, the orchestrator runs the [PR-owner role prompt](../references/roles/pr-owner.md) itself and discloses it. Each brief carries the plan section, the file lane, the run root, the standing orders, the [report contract](../references/report-contract.md), and `owns: <PR section steps>`. The brief points at files and paths; it never inlines bulk content.
6. Gate each PR at its owner's merge-ready report. Read the evidence paths, do not trust the report text. A finding goes back to that PR's owner. At most three loops per PR, then a blocker row.
7. Review and fix per feature. One fresh reviewer subagent on a different model family reads the feature's whole diff and its receipts. One fresh `coder` fixer resolves the findings. Recheck at high risk only, not every finding.
8. Run the feature gate. The feature's own evidence bar, the union of its PRs' unit boxes, at least one live probe, and the perf block. Record it in `features/<id>/run.md`.
9. Close the feature. Every ticket done or blocked, the ledger current, and the reply naming each PR with its URL and verdict.

**Reply.** The ticket table with state per row, each PR URL, the feature gate evidence, open decisions, and the step table.
