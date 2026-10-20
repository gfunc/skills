# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`. This is the stack's default tracker, used whenever a repo does not commit `docs/issue-tracker.md` naming another one.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- State is recorded as a `Status:` line near the top of each issue file: `open`, `claimed`, `resolved`, or `closed`. This stack has no triage labels; type markers (`Type:` lines locally, `wayfinder:*` labels on real trackers) route resolution
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- The same feature directory also receives the run's execution artifacts — the plan (`plan.md`), decision trail, logs, and lane worktrees. `.scratch/` is the artifact root for all pack and pstack activity in the repo (see the pack README's store convention)

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `open`/`claimed`/`resolved`/`closed`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved` or `closed`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
