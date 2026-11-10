# poteto-mode verification map

This directory is the maintained source for verifying the user-facing behavior of the poteto-mode skill's CLIs. Read the index before driving, then use the matching feature file as the recipe. The harness is the CLIs themselves plus bun; every command below runs from the checkout (or worktree) root of the code under test.

## Baseline preconditions

- `node` on `PATH`; bun at `~/.bun/bin/bun`; git on `PATH`.
- The checkout builds as-is: no install step is needed for the checker; the first orch run installs commander itself (bootstrap.ts, `bun install --frozen-lockfile`, keyed on package.json + bun.lock).
- No forge CLI, network, or auth is needed: orch journeys run against fake forge bins generated in temp dirs by the suite.
- Run `skills/verify-poteto-mode/fixtures/plan-valid.md` through the doctor command in the skill's Doctor section and require exit `0` before driving anything else.
- Every journey writes only to fresh temp dirs; never point a mutated fixture at a shared file.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Treat every command and message string as literal. Assert the exact stderr text the CLI prints; do not weaken an assertion to match what the run happened to print.
- Copy a fixture to a temp dir before mutating it; the committed fixtures under `skills/verify-poteto-mode/fixtures/` are the unmodified inputs.
- Proofs that drive one entry point do not cover the map's other entries; run each feature entry's own journey and its known-bad control.

## Proof and skip reporting

- CLI proof includes the command, stdout, stderr, and exit code, appended per row to the run's evidence file under `.scratch/<feature-slug>/verification/`.
- Every feature entry is proven only by the pair its file names: one mapped journey passing plus one known-bad control failing at the same head.
- Record the feature ID and entry used with every artifact. Report an unreachable path with the attempted command and the unmet precondition; never report a skipped entry as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior, each naming its journey and its known-bad control.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with <harness>` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Plan checker](./check-plan.md) covers valid plans accepted, over-bound lanes rejected, and the rejection's failure modes.
- [Orch frontier](./orch-frontier.md) covers three-forge frontier resolution and loud rejection of bad forge output.

## Evidence path convention

Journey and control outputs append to `.scratch/<feature-slug>/verification/` in the repo under test, one file per run (e.g. `prove-once.txt` with `## command` / `## exit` blocks per row). The `.scratch` store is never committed; the proof is the recorded exit codes and output tails, referenced from the feature entries' driver-proof notes.
