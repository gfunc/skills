# Wire audit

[`scripts/wire-audit`](../../scripts/wire-audit) reads one Kimi agent's `wire.jsonl`
trail (protocol 1.5) and reports two ways a delegated parent breaks the
orchestration contract: polling for a background child's state, and authoring
product edits itself. It is read-only and prints counts; it never sends
anything or writes anywhere.

```bash
scripts/wire-audit ~/.kimi-code/sessions/<session>/agents/main/wire.jsonl
scripts/wire-audit <wire> --json
scripts/wire-audit <wire> --fail-on poll
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
relative forms.

## Exit codes

- `0` no findings selected by `--fail-on` (default `none`)
- `1` findings present for the selected check
- `2` usage or input error, including a malformed wire line

## Limits (v1)

Counts span the whole wire; there is no plan-gate inference, so a
post-approval slice is out of scope, and there are no context metrics. The
input is one agent's wire; children have their own trails. The wire is
append-only, so file order is authoritative and timestamps are report-only.
The pass contract for the script is `--self-test`, not any historical count.
