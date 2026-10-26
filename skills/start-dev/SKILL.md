---
name: start-dev
description: Human-invoked front door for executing an approved spec. Runs one PR directly, or a feature ticket queue, or a program of several features, with a PR-owner subagent dispatching parallel atomic-task waves. Use for /start-dev, "run the spec", "start development".
disable-model-invocation: true
---

# start-dev

`/start-dev <spec>` takes an approved spec and runs the execution workflow behind it. The invocation is the go. This skill is human-invoked only.

Read the spec at the path the operator gives. If no spec document exists, run the `to-spec` synthesis inline, write the spec into the run root, and continue. The spec's parent directory is the run root. A wayfinder map keeps its own program-effort slug and is linked from the spec, never merged into it.

## Scope adaptation

Read the spec and its ticket set, then pick one layer.

| Input | Layer | Playbook |
|---|---|---|
| One PR of work, any size | PR owner runs it directly | [`playbooks/pr-owner.md`](playbooks/pr-owner.md) |
| One feature, several PRs | Feature owner runs the ticket queue | [`playbooks/ticket-queue.md`](playbooks/ticket-queue.md) |
| Several features, one program | Program orchestrator runs the program plan | [`playbooks/program-plan.md`](playbooks/program-plan.md) |

Packaging, one PR or a base-chained stack, is not a separate workflow. The router selects the layer from the spec and the ticket set; when the input admits two readings, run the smaller layer and say why.

## Roles

- **Operator.** The human. Lands PRs, answers escalations, holds stand-down authority.
- **Program or feature orchestrator.** The main agent. Plans, briefs, reviews, gates, records. It does not author product changes when a child can. It writes only plans and ledgers.
- **PR owner.** Always a `poteto-agent` subagent, one per PR. Runs one PR branch end to end and is its only writer.
- **Dev.** A `coder` subagent. One atomic task per fresh spawn, dispatched in parallel waves by the PR owner.
- **Critical-dev.** A `coder` subagent on the strongest judgment model, for the hardest changes in a wave.
- **Research.** An `explore` subagent for read-only investigation.
- **Merge worker.** A `coder` subagent that integrates wave commits on the PR branch.
- **Reviewer.** A fresh subagent on a different model family. It reads and reports; it never edits.
- **Fixer.** A fresh `coder` subagent that resolves reviewer findings.

The spawn allowlist for a `poteto-agent` PR owner is `poteto-agent`, `coder`, `explore`, `plan`, set in `agents/poteto-agent.md`. Devs and helpers spawn through the harness's own agent types, so a PR owner never needs a type outside the allowlist.

## Boundaries

- The main agent is the program or feature orchestrator. The PR owner is always a subagent. Devs are `coder` subagents. No layer edits product files from the orchestrating chat.
- Every brief carries the [report contract](references/report-contract.md) verbatim and declares `owns: <steps>`.
- One writer per branch. The PR owner is the only writer of its PR branch.
- The standing orders in [`references/standing-orders.md`](references/standing-orders.md) are stamped into every plan and carried verbatim in every brief.
- Run artifacts live under `.scratch/<effort>/` in the target repo, per the [run ledger](playbooks/run-ledger.md). Durable plans that a restored pstack playbook authors stay in `docs/`.
- This skill reads the restored pstack skills and playbooks it names, by path, for principles, architecture discussion, and standards. It does not depend on the 0.2.1 modified workflow; every path it names resolves in the restored pack.

## Playbooks

- [Program plan](playbooks/program-plan.md). Several features, one program, one PR section per PR.
- [Ticket queue](playbooks/ticket-queue.md). One feature, several PRs, blocking edges and file lanes.
- [PR owner](playbooks/pr-owner.md). One PR, parallel atomic-task waves, one merge worker, gates.
- [Run ledger](playbooks/run-ledger.md). The layered `.scratch` ledger and its templates.

**Reply.** The layer you selected and why, the PR ids with their owners, the run root, and the first gate's evidence. Tables for the ticket set. No claims beyond the evidence in the ledger.
