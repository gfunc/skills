---
name: verify-poteto-mode
description: "Scripted verification for the poteto-mode skill's CLIs — the check-plan.md plan checker and the orch stack bookkeeper — with a feature map of journeys and known-bad controls. Use when verifying poteto-mode changes, /verify-poteto-mode, or when a poteto-mode PR needs driver proof."
disable-model-invocation: true
---

# Verify poteto-mode

This skill drives the two real CLIs shipped in [skills/poteto-mode/](../poteto-mode/SKILL.md) and proves their user-facing behavior against the maintained feature map in [features/](features/README.md). Read the map's index before driving, then use the matching feature file as the recipe. Verify at the head you are proving: run every command from the checkout or worktree root of the code under test, with the paths below resolved against that root.

## Prerequisites

- `node` on `PATH` (the checker is a plain `.mjs` script).
- bun at `~/.bun/bin/bun` (the orch and checker test suites; orch.ts's shebang also names bun).
- git on `PATH`. No forge CLI, network, or auth: the orch journeys run through fake forge bins generated in temp dirs.

## Launch

There is no server. Launch means running the real CLI per drive in a fresh temp directory:

- Checker journey: `node skills/poteto-mode/scripts/check-plan.mjs --spawn-bound 120 <plan.md>`. Ready is the report line `1 PR sections, 0 problems, spawn bound 120 minutes` on stdout with exit `0`.
- Orch journey: `~/.bun/bin/bun test orch` from `skills/poteto-mode/scripts`. Ready is the tail `0 fail` with exit `0` (about 4 seconds).

First run in a fresh checkout installs commander via `bun install --frozen-lockfile` (bootstrap.ts, keyed on package.json + bun.lock) — allow extra time for it, and expect the orch CLI to restart itself once after installing. Every journey uses fresh temp dirs and reads only local files, so instances never collide; double-driving is harmless but pointless.

## Doctor

One read-only check that the checkout is worth driving:

```sh
node skills/poteto-mode/scripts/check-plan.mjs --spawn-bound 120 skills/verify-poteto-mode/fixtures/plan-valid.md
```

Exit `0` with `0 problems` in the summary means the checkout's checker and this skill's fixtures agree; a nonzero exit before any drive of your real target is drift — fix the skill or the checkout first.

## Drive

- `check-plan#*`: run the checker binary on a fixture plan (see [features/check-plan.md](features/check-plan.md) for the exact per-entry commands and assertions).
- `orch-frontier#*`: run the suite from `skills/poteto-mode/scripts` with `~/.bun/bin/bun test orch` (see [features/orch-frontier.md](features/orch-frontier.md)).

Stable handles are the fixture paths in [fixtures/](fixtures/) and the literal message strings the CLIs print; assert on those, never on line numbers that shift with edits.

## Evidence

Capture for every proof: the command, stdout, stderr, and exit code, appended per row to one file in the run's store, `.scratch/<feature-slug>/verification/` (the pack's store convention; e.g. `prove-once.txt` with one `## command / ## exit` block per row, tail included). Proof standards: exercise the real CLI the user runs (no mocks of the CLI under test), record both a mapped journey passing and a known-bad control failing per feature entry, and treat a control that passes as a broken assertion, not a pass. Fixture copies the journeys mutate are created in a temp dir and removed there; committed fixtures stay untouched.

## Cleanup

Remove only the temp dirs and mutated fixture copies a run created (`mktemp -d` paths; precise targets, never by process name — there are no servers). Committed fixtures and the evidence file survive cleanup; if evidence lives inside a removed temp dir, the run was invalid — rerun it.

## Maintenance loop

Keep the map honest as the CLIs change with [/maintain-verification-skill](../maintain-verification-skill/SKILL.md).
