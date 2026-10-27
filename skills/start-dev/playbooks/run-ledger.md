### Run ledger

**You own the ledger. The orchestrating main agent writes it; children report rows.** The ledger is the run's memory and its evidence index. It lives under `.scratch/<effort>/` in the target repo and stays gitignored.

## Shape

Principles: apply the `Dev-lead plan` row in [§ Principles](../SKILL.md#principles) of the skill.

| Path | Level | Holds |
|---|---|---|
| `.scratch/<effort>/program.md` | Program | The program plan, feature states, the audit cadence, the standing-order record. |
| `.scratch/<effort>/features.tsv` | Program | One row per feature: id, title, state, owner, updated. |
| `.scratch/<effort>/features/<id>/run.md` | Feature | The feature's ticket queue, PR states, gate evidence, review and fix rounds. |
| `.scratch/<effort>/features/<id>/tickets.tsv` | Feature | One row per PR: id, title, file lane, edges, surface, feature entry, state. |
| `.scratch/<effort>/decisions.tsv` | Run | The decision trail, append-only, one row per decision with its evidence. A maintenance finding names its signal, evidence, route, and owner. |
| `.scratch/<effort>/agents.tsv` | Run | The spawned-agent registry: id, role, state, stuck-after. |

The templates live in [`references/ledger-templates.md`](../references/ledger-templates.md). Durable plans a restored pstack playbook authors stay in `docs/`; the ledger holds run state, not durable plans.

## Steps

1. Initialize the ledger before the first spawn, from the templates. Record the lifecycle handoffs as they happen: spec acceptance, the design artifact and its review, the verification readiness decision, the plan and run graph with their review, the operator's go, the execution mode (goal or normal) with the profile's continuation mechanism, each wave with its tasks and gate, the review verdict, and the operator's land. The run root is the spec's parent directory. `.scratch/` is the artifact root for everything this run writes, including lane worktrees under `lanes/`, gate output under `logs/`, verification evidence under `verification/`, and screenshots under `shots/`.
2. Record the hat resolution and any fallback: which hats ran as subagents, which collapsed to the main agent, the model-family diversity actually achieved, and the reduced independence where the profile forced a collapse.
3. Guard the context window. The orchestrator's context is the run's most expensive resource. Every step resends the whole context, so input tokens dominate a long run; a poll is a step. Keep the model and effort stable for a run, since a switch invalidates the prompt cache and repays the whole context. Route bulk reads and diff review to children; keep decision-relevant reads in the parent.
4. Update the ledger at every boundary, not at the end. A row per spawn, per gate, per verdict, per blocker. Append-only on `decisions.tsv`; supersede a wrong row with a new row, never edit one.
5. Audit the ledger before handing back. Walk this run's rows against the transcripts and the approved plan. Compare the plan's obligations and the standing orders with the execution evidence, including obligations absent from the log. Record their evidence or their explicit disposition. A skipped or blocked obligation is not completed or waived merely because it is logged. A gap gets a superseding row with a pointer that resolves.
6. Reply with the ledger paths, the row counts, and the open blockers. Never claim a state the ledger does not show.

**Reply.** The ledger paths with row counts, the decision trail's last rows, blockers with their exact obstacles.
