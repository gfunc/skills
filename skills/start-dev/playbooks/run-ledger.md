### Run ledger

**You own the ledger. The orchestrating main agent writes it; children report rows.** The ledger is the run's memory and its evidence index. It lives under `.scratch/<spec>/` in the target repo and stays gitignored.

## Shape

Principles: apply the `Dev-lead plan` row in [§ Principles](../SKILL.md#principles) of the skill.

| Path | Holds |
|---|---|
| `.scratch/<spec>/plan.md` | The approved plan: the lane table, the run graph and the one PR section. |
| `.scratch/<spec>/progress.md` | The progress log, in `show-me-your-work`'s format. The resume rule reads it. |
| `.scratch/<spec>/run.md` | The run record: PR state, one row per unit with its merge SHA, gate evidence, review and fix rounds. |
| `.scratch/<spec>/decisions.tsv` | The decision trail, append-only, one row per decision with its evidence. A maintenance finding names its signal, evidence, route, and owner. |
| `.scratch/<spec>/agents.tsv` | The spawned-agent registry: id, role, state, stuck-after. |

The templates live in [`references/ledger-templates.md`](../references/ledger-templates.md). Durable plans a restored pstack playbook authors stay in `docs/`; the ledger holds run state, not durable plans.

## Steps

1. Initialize the ledger before the first spawn, from the templates. Record the lifecycle handoffs as they happen: spec acceptance, the design artifact and its review, the verification readiness decision, the plan and run graph with their review, the operator's go, the execution mode (goal or normal) with the profile's continuation mechanism, each unit with its worktree and gate, the review verdict, and the landing. The run root is the spec's parent directory. `.scratch/` is the artifact root for everything this run writes, including unit worktrees under `lanes/`, gate output under `logs/`, verification evidence under `verification/`, and screenshots under `shots/`.
2. Record the hat resolution and any fallback: which hats ran as subagents, which collapsed to the main agent, the model-family diversity actually achieved, and the reduced independence where the profile forced a collapse.
3. Guard the context window. The orchestrator's context is the run's most expensive resource. Every step resends the whole context, so input tokens dominate a long run; a poll is a step. Keep the model and effort stable for a run, since a switch invalidates the prompt cache and repays the whole context. Route bulk reads and diff review to children; keep decision-relevant reads in the parent.
4. Update the ledger at every boundary, not at the end. A row per spawn, per unit merge, per gate, per verdict, per blocker. Append-only on `decisions.tsv`; supersede a wrong row with a new row, never edit one.
5. Audit the ledger before handing back. Walk this run's rows against the transcripts and the approved plan. Compare the plan's obligations and the standing orders with the execution evidence, including obligations absent from the log. Record their evidence or their explicit disposition. A skipped or blocked obligation is not completed or waived merely because it is logged. A gap gets a superseding row with a pointer that resolves.
6. Reply with the ledger paths, the row counts, and the open blockers. Never claim a state the ledger does not show.

**Reply.** The ledger paths with row counts, the decision trail's last rows, blockers with their exact obstacles.
