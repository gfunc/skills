# Worktree topology

One feature worktree holds the PR branch. One unit worktree per unit. Both live under `.scratch/<effort>/lanes/`.

```
.scratch/<effort>/lanes/
  feature/          holds the PR branch, checked out once
  unit-<id>/        one per unit, branched from the feature head
```

## Flow

1. **Feature worktree.** The owner creates it on the PR branch at the start of the run. It survives the whole run, receives every unit merge, and the PR opens from it.
2. **Unit worktree.** The merge worker or the owner creates it at the feature head before dispatch. The unit worker edits only its own worktree and runs its scoped tests there.
3. **Unit merge.** When a unit's scoped tests pass, the merge worker merges the unit branch into the feature worktree. One writer, one merge at a time. A unit whose tests are red never merges.
4. **Final verify.** The full suite, the final-gate lanes and the formal check run in the feature worktree at the merged head, before the review.
5. **After the run.** Unit worktrees are removed once their merge is recorded. The feature worktree stays until the PR is landed.

## Ownership

- The merge worker is the only writer of the PR branch. The owner never edits it; a unit worker never touches it.
- A conflict goes back to the owner named with the two units and the files. It is a lane-split defect, not a merge-worker judgment call.
- A unit's artifacts commit inside the unit's worktree before the merge. Uncommitted work is not merged and is not recoverable by a later unit.
- Evidence stays under `.scratch/<effort>/`, which the run root owns, not the unit worktree.

## Capability gating

Where the profile reports no nested spawn, the topology collapses: the owner runs the unit work in the feature worktree itself and records the reduced independence in the ledger. The unit gate and the one-writer rule do not change; with no separate writer, the owner becomes the writer and says so.
