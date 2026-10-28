# Wire audit

[`scripts/wire-audit`](../../scripts/wire-audit) reads Kimi `wire.jsonl` trails
(protocol 1.5) and reports four ways a delegated run breaks the orchestration
contract: polling for a background child's state, the parent authoring product
edits itself, background children or cron jobs under an active goal, and a
subagent spawning its own child in the background. It reads one agent's wire,
or every agent wire in a session. It is read-only and prints counts; it never
sends anything or writes anywhere.

```bash
scripts/wire-audit ~/.kimi-code/sessions/<session>/agents/main/wire.jsonl
scripts/wire-audit --session ~/.kimi-code/sessions/<session>
scripts/wire-audit <wire> --json
scripts/wire-audit <wire> --fail-on poll
scripts/wire-audit --session <session> --fail-on nested-background
scripts/wire-audit --self-test
```

## Checks

**poll.** A *poll-shaped* Bash call matches `git status`, `git log`, or a
timed `sleep <number>` anywhere in the command, so the match is a substring
and a quoted echo of the text matches too. A *candidate* is a poll-shaped
Bash call made while at least one background child is live: live from
`subagent.spawned` with `runInBackground: true` until that `subagentId`'s
`subagent.completed`, `subagent.cancelled`, or `subagent.failed`, so
overlapping children are handled and a foreground child never makes a call
count. A *finding* is a run of two or more consecutive candidates in the
parent's tool-call stream. Any other parent tool call ends a run; child
spawn and end events do not. Isolated single polls are counted but are not
findings.

**parent-authoring.** Every parent `Edit`/`Write` whose target is a product
file. Product means any path except one under `.scratch/` (the run's plan,
ledger, and store) or under `.kimi-code/` (harness session artifacts,
including plan-mode plan files), matched on path segments for absolute and
relative forms. In `--session` mode this check is evaluated for `main` only,
because children author product files by design.

**goal-mode.** A goal is active from `goal.create` until a `goal.update` sets
its status to `complete`, `paused`, `blocked`, or `cancelled`; an `active`
status resumes it. A `subagent.spawned` with `runInBackground: true` in that
window is a finding. A `cron.add` in that window is also a finding. The goal
is the continuation, so a background child or a timed tick turns the next turn
into a poll.

**nested-background.** A `subagent.spawned` with `runInBackground: true`
whose `callerAgentId` is present and not `main`. On Kimi that task is
registered under the spawning subagent's own task scope, so it never appears
in `/tasks` and the operator loses the progress panel. A wire that predates
`callerAgentId` cannot attribute the spawn and reports zero.

## Session mode

`--session <dir>` scans `<dir>/agents/*/wire.jsonl`, audits each agent, and
prints one aggregate. Text mode prints the nested findings, one row per agent
with any check non-zero, and a clean-agent count. JSON mode keys the per-agent
reports under `agents` and repeats the nested findings at the top level.
`parent-authoring` is evaluated for `main` only here. A session directory with
no `agents/` directory, or no agent wires, exits 2.

## Exit codes

- `0` no findings selected by `--fail-on` (default `none`)
- `1` findings present for the selected check
- `2` usage or input error, including a malformed wire line

`--fail-on` accepts `poll`, `parent-authoring`, `goal-mode`,
`nested-background`, or `none`.

## Limits (v2)

Counts span the whole wire; there is no plan-gate inference, so a
post-approval slice is out of scope, and there are no context metrics. The
single-wire input is one agent's trail; use `--session` for the whole tree.
The wire is append-only, so file order is authoritative and timestamps are
report-only. Goal state comes only from `goal.create` and `goal.update`; a
wire with no goal events reports zero. Only `cron.add` is counted, not a cron
fire. The pass contract for the script is `--self-test`, not any historical
count; the fixtures include a child wire with one nested background spawn and
a main wire with none.
