# Orch frontier

The orch CLI (`skills/poteto-mode/scripts/orch/`) resolves a stacked-PR frontier through the forge descriptor for gh, origin, and glab, and rejects forge output it cannot parse — unknown states, malformed rows, non-JSON — loudly instead of guessing.

## Sub-features

- `orch-frontier#three-forge` — the frontier resolves through all three forge descriptors. Journey: `~/.bun/bin/bun test orch` passes all 20 tests, including the three-forge frontier and argument-mapping cases. Control: the same suite run against a scratch copy with the glab descriptor's `listSubcommand` flipped to `pr` fails, proving the suite exercises the real descriptor mapping, not a stub (U1's report records the equivalent 3 fails with `glab must not serve pr list`).
- `orch-frontier#unknown-state` — forge rows with unknown states or missing fields are rejected loudly. Journey: the malformed-row/unknown-state test cases (`rejects glab rows with unknown states or missing fields`, `rejects unparseable glab output loudly`) pass inside the suite run. Control: a hand-built fixture whose fake glab emits a row with the unknown state `locked` makes the real orch CLI exit non-zero with the loud `invalid PR row` error — proving the rejection lives in the shipped CLI, not only in a test expectation.

## How to get to it (user POV)

- Run `~/.bun/bin/bun test orch` from `skills/poteto-mode/scripts` in a terminal; the same suite an operator runs before shipping orch changes is the verification harness.
- Drive the CLI itself the way the suite does: the fake forge bins and stack repo are generated in temp dirs per test; a hand-driven `orch.ts frontier set --forge glab` against such a fixture reproduces the same messages.

## Driving it with bun test

Preconditions:

- bun at `~/.bun/bin/bun` (the suite and orch.ts's shebang are bun-native).
- Run from `skills/poteto-mode/scripts` so `bun test orch` resolves the `orch/` file filter.
- First run installs commander itself (`bun install --frozen-lockfile` via bootstrap.ts); allow extra time.
- No forge CLI, network, or auth: all forge interactions run through fake bins in fresh temp dirs.

- **Three-forge suite passes.** Run `cd skills/poteto-mode/scripts && ~/.bun/bin/bun test orch`. Exit `0`; tail shows `20 pass`, `0 fail`, and per-forge passes including `resolves the ordered frontier from the gh/origin/glab base chain and validates an optional pin` and `rejects unparseable gh/origin/glab output loudly`.
- **Unknown state rejected loudly.** From the same run, `rejects glab rows with unknown states or missing fields` passes; it asserts `glab mr list --source-branch stack/open output has an invalid PR row` for a row with `state: "locked"` and for a row missing `target_branch`.
- **Known-bad control for `orch-frontier#three-forge`.** Flip the glab descriptor's `listSubcommand` from `"mr"` to `"pr"` in a scratch copy of the `skills/poteto-mode/scripts/orch/` dir (copy, never in place), run the suite from that copy, and require failure: the glab frontier and argument-mapping tests fail because the fake glab bin rejects `pr list` invocations, matching U1's recorded `glab must not serve pr list` evidence (`.scratch/poteto-kimi-ready/reports/u1.md`, Evidence). The committed tree stays untouched (`git status` clean).
- **Known-bad control for `orch-frontier#unknown-state`.** Build the fixture by hand the way `orch.test.ts`'s `makeGitStack`/`withFakeForge` do — a temp git stack repo checked out at `stack/open`, and a fake `glab` bin on `PATH` that writes one JSON array row `[{"iid":11,"state":"locked","source_branch":"stack/open","target_branch":"stack/closed"}]` for `mr list --source-branch <branch> --all --output json ...` — then run `~/.bun/bin/bun skills/poteto-mode/scripts/orch/orch.ts --store "$TMP/store" init` once, then `~/.bun/bin/bun skills/poteto-mode/scripts/orch/orch.ts --store "$TMP/store" frontier set --repo "$TMP/repo" --forge glab` from the fixture's repo dir. The frontier set exits `1`; stderr is `error: glab mr list --source-branch stack/open output has an invalid PR row`. The shipped CLI rejects loudly without the suite asserting it for you.
- **Proof.** Append each row's command, output tail, and exit code to the run's evidence file under `.scratch/<feature-slug>/verification/`, per the map's evidence path convention.

## Gotchas

- Run the suite from `scripts/`, not the repo root: `bun test orch` filters by path and finds nothing from the root.
- The known-bad control mutates source; do it only in a scratch copy (or stash-and-restore) and verify `git status` is clean after — a committed descriptor flip is a product bug, not a control.
- The fake-forge fixture hard-codes the repo path; reuse the suite's helpers rather than improvising a fixture, or the stderr messages won't match.
- `bun install` on first run re-execs orch.ts; a slow first run is the install, not a hang.
- Commander-level forge rejection (`Allowed choices are gh, origin, glab`) is a different layer from the row rejection; only the row-level `invalid PR row` message proves `orch-frontier#unknown-state`.
