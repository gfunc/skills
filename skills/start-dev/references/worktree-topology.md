# Worktree topology

One feature worktree, one wave worktree per parallel wave, one task worktree per atomic task. All live under `.scratch/<effort>/lanes/`.

```
.scratch/<effort>/lanes/
  feature/          holds the PR branch, checked out once
  wave-<n>/         one per parallel wave; task branches merge here
    task-<id>/      one per atomic task, branched from the wave worktree
```

## Flow

1. **Feature worktree.** The main agent creates it on the PR branch before the first wave. It survives the whole run and the PR opens from it.
2. **Parallel wave.** `dev-owner` creates the wave worktree at the feature branch's head. Each task worktree branches from it. Each dev works only in its task worktree. When every task in the wave finishes, the merge worker integrates the task branches into the wave worktree, then the full gate runs on the wave worktree.
3. **Serial wave.** A wave with one task, or tasks that share a lane, runs directly in the feature worktree. No wave worktree is created.
4. **After all waves.** The merge worker integrates each wave head into the feature worktree. The full gate and the fixer loop run there. The PR opens from the feature branch.

## Ownership

- One writer per branch. The task branch belongs to its dev; the wave branch to the merge worker during integration; the feature branch to the merge worker at wave integration and to the fixer inside the review loop.
- A conflict goes back to `dev-owner` named with the two tasks and the files. It is a lane-split defect, not a merge-worker judgment call.
- Task and wave worktrees are removed after their wave's gate passes and the review has the evidence it needs. The feature worktree stays until the operator lands.

## Capability gating

Where the profile reports no nested spawn, the topology collapses: the main orchestrator runs the PR-owner role prompt, executes the waves in the feature worktree sequentially, and records the reduced independence in the ledger. The gates do not change.
