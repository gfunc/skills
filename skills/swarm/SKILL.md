---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
4. Pick the worker model from the `swarm workers` line in `~/.agents/pstack-models.md`. Read the profile's Models section for the native binding, availability gate, subagent mechanism, and inheritance token. If the file or that line is missing, use `grok-4.7-xhigh-fast`. For `auto`, `inherit-parent`, or the profile's inheritance token, omit `model` so the workers run on the parent model. If the chosen value is not established as available, use the nearest listed family default and say so; with no listed alternative, stop that spawn and say why. For a model race, name each arm's model up front. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the profile.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

**Harness profile.** Before spawning, read the active harness profile. The adapter line or `scripts/resolve-harness` supplies `harness=<name>` and `profile=<absolute path>`; if the line or profile is missing, ambiguous, or mismatched, stop the affected action and say why. Harness-neutral work may continue. Pass the active `harness=` and `profile=` paths in every worker brief.

Spawn all N workers in one message using the tool and arguments the profile's Subagents section names, with the step 4 model, left unset for `auto`, `inherit-parent`, or the profile's inheritance token. Give each worker its own worktree or output path when it runs locally. Pass the profile's branch argument when it has one; otherwise name the branch in the brief.

If the profile supports no parallel spawn, run the workers sequentially and disclose the reduced independence in the reply and trail. If it supports no spawn at all, run them yourself, one after another, and disclose the same.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
