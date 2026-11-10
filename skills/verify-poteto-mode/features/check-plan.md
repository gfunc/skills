# Plan checker

The check-plan CLI (`skills/poteto-mode/scripts/check-plan.mjs`) validates an emitted plan's dialect and rejects any live lane whose `` `Timeout <minutes>` `` exceeds the resolved spawn bound, so a delegation plan that would outlive its subagents is caught before owners spawn.

## Sub-features

- `check-plan#valid` — a plan conforming to the dialect passes: report line names the box counts and the bound; exit `0`. Journey: checker on `fixtures/plan-valid.md` at bound 120. Control: an over-bound copy fails at the same bound (exit 1, `exceeds the spawn bound`), proving the pass is earned by the dialect, not unconditional.
- `check-plan#over-bound` — a lane naming `` `Timeout 121` `` under bound 120 is rejected: exit `1`, stderr names the file, line, lane number, the value, and the bound. Journey: the over-bound copy at bound 120. Control: the same copy with the backticked marker removed fails with `names no backticked` instead — proving the rejection keys on the lane's own Timeout value, not on lane presence.

## How to get to it (user POV)

- Run `node skills/poteto-mode/scripts/check-plan.mjs --spawn-bound <minutes|unlimited> <plan.md>` in a terminal from the checkout root; a plan author hits the same path whenever they validate an emitted plan.
- Read the summary line the checker prints: `<n> PR sections, <n> problems, spawn bound <n> minutes` (or `unlimited`).

## Driving it with the check-plan CLI

Preconditions:

- Run from the checkout (or worktree) root of the code under test, so `skills/poteto-mode/scripts/check-plan.mjs` resolves.
- `node` is on `PATH`.
- The committed fixtures exist: `skills/verify-poteto-mode/fixtures/plan-valid.md` passes the doctor command in the skill's Doctor section.
- Work in a temp dir for mutated copies (command below uses one created by `mktemp -d`, stored in `$TMP`); the committed fixtures stay untouched.

- **Valid plan passes.** Run `node skills/poteto-mode/scripts/check-plan.mjs --spawn-bound 120 skills/verify-poteto-mode/fixtures/plan-valid.md`. Exit `0`; stdout ends `1 PR sections, 0 problems, spawn bound 120 minutes` and the report line shows `boxes=19` for `PR 1 probe`.
- **Over-bound lane rejected.** Copy the fixture and inflate one lane's timeout past the bound: run `TMP=$(mktemp -d) && sed 's/`Timeout 45`/`Timeout 121`/' skills/verify-poteto-mode/fixtures/plan-valid.md > "$TMP/plan-over-bound.md" && node skills/poteto-mode/scripts/check-plan.mjs --spawn-bound 120 "$TMP/plan-over-bound.md"`. Exit `1`; stderr matches `plan-over-bound.md:<line>: PR 1 probe: lane <n> timeout 121 minutes exceeds the spawn bound of 120`, naming lane, value, and bound; stdout's summary shows `1 problems`.
- **Known-bad control for `check-plan#valid`.** Use the same over-bound copy as the control of the valid journey: at the same bound it exits `1` with `exceeds the spawn bound`, so the valid journey's exit `0` is earned.
- **Known-bad control for `check-plan#over-bound`.** Strip the marker instead of inflating it: run `TMP=$(mktemp -d) && sed 's/ `Timeout 45`//' skills/verify-poteto-mode/fixtures/plan-valid.md > "$TMP/plan-no-marker.md" && node skills/poteto-mode/scripts/check-plan.mjs --spawn-bound 120 "$TMP/plan-no-marker.md"`. Exit `1`; stderr matches `plan-no-marker.md:<line>: PR 1 probe: lane <n> names no backticked \`Timeout <minutes>\`` — a lane without a backticked marker fails on the missing marker, never on the bound, proving the over-bound rejection is not unconditional.
- **Proof.** Append each row's command, stdout tail, stderr tail, and exit code to the run's evidence file under `.scratch/<feature-slug>/verification/`, per the map's evidence path convention.

## Gotchas

- `probe-plan.md` in the verification readiness store predates the Timeout contract: at the current head it exits `1` with ten `names no backticked` problems. It is not a valid-plan fixture; use `fixtures/plan-valid.md`, which is the probe plan with `` `Timeout 45` `` injected on all ten lanes.
- The bound comparison is strict (`>`), so `Timeout 120` passes and `Timeout 121` fails under bound 120; a control needs the inflated value, not a boundary touch.
- A run against a different `--spawn-bound` re-answers both entries: the over-bound value must exceed the bound actually passed, or the control silently proves nothing.
- Assert on the message text, not on line numbers: the lane's line shifts with plan edits.
- The checker is static: it reads local files only and needs no forge CLI, network, or auth.
