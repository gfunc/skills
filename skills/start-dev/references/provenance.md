# start-dev provenance

The execution workflow here moved out of the vendored pstack paths in 0.3.0 so `/poteto-mode` could return to upstream content. This file records where each piece came from.

## Moved whole from `skills/poteto-mode/`

| start-dev path | 0.2.1 source | Notes |
|---|---|---|
| `playbooks/program-plan.md` | `skills/poteto-mode/playbooks/multi-phase-plan.md` | The 0.2.1 file was itself a rewrite of pstack's `multi-phase-plan.md`. Emitter, checker, and skeleton paths rewritten to `skills/start-dev/`. |
| `references/plan-skeleton.md` | `skills/poteto-mode/references/plan-skeleton.md` | Unchanged except its owning script. |
| `scripts/emit-plan` | `skills/poteto-mode/scripts/emit-plan` | `skeletonPath` and `registerPath` now resolve inside this skill. |
| `scripts/check-plan.mjs` | `skills/poteto-mode/scripts/check-plan.mjs` | Content unchanged. |
| `tests/check-plan.test.ts` | `skills/poteto-mode/scripts/check-plan.test.ts` | Checker path now resolves `../scripts`. |
| `references/standing-orders.md` | `references/standing-orders.md` | Order 10 clarified for 0.3.0. |

## Seed hunks absorbed into start-dev playbooks

These hunks were removed from pstack-owned files and re-homed here. The restored pstack files no longer carry them.

| Hunk | 0.2.1 source | Re-homed at |
|---|---|---|
| Execution role, `can_spawn`/`owns`, foreground and goal spawn policy | `skills/poteto-mode/SKILL.md` | This skill's **Roles** section and the playbooks' brief rules. |
| Report contract, `step \| executed \| absorbed \| blocked \| evidence` | `agents/poteto-agent.md` | `references/report-contract.md` and every brief template. |
| Write boundary, scope-question ordering, plan seam, delegated brief and child step table | `skills/figure-it-out/SKILL.md` | `playbooks/program-plan.md` steps 2 and 4, `playbooks/pr-owner.md` step 3. |
| No status-poll loop, child step-table reconciliation | `skills/poteto-mode/playbooks/feature.md` | `playbooks/pr-owner.md` step 5. |
| Approved-plan and standing-order audit duties | `skills/show-me-your-work/SKILL.md` | `playbooks/run-ledger.md` step 4. |
| Resend cost, stable model and effort, route bulk to children | `skills/principle-guard-the-context-window/SKILL.md` | `playbooks/run-ledger.md` step 2. |

## Declared hunks in vendored pstack paths

The verification wiring needs the caller's brief to carry the model source, so five pstack-owned skills gained one hunk each. Each is declared in `vendor-manifest.txt` and keeps its upstream attribution; the four verification skills and `setup-pstack` stay untouched.

| Vendored path | Hunk |
|---|---|
| `skills/how/SKILL.md` | A brief `Model: how explorer=` / `Model: how explainer=` line wins before `~/.agents/pstack-models.md`, then the file, then the stated default. |
| `skills/why/SKILL.md` | A brief `Model: why investigators=` / `Model: why synthesizer=` line wins before `~/.agents/pstack-models.md`, then the file, then the stated default. |
| `skills/architect/SKILL.md` | A brief `Model: architect runners=` line wins before `~/.agents/pstack-models.md`, then the file, then the stated default. |
| `skills/arena/SKILL.md` | Brief `Model: arena runners=` and `Model: arena cross-judge pool=` lines win before `~/.agents/pstack-models.md`, then the file, then the stated default. |
| `skills/swarm/SKILL.md` | A brief `Model: swarm workers=` line wins before `~/.agents/pstack-models.md`, then the file, then the stated default. |

Each hunk also states that a brief line does not make a model available: the profile's availability check still runs, and a value the profile cannot express is substituted, recorded, and disclosed.

## Profile role model tables

Every harness profile's Role mapping gained a **Role model table** subsection naming the `Model: <role>=<model>` brief lines start-dev carries (`dev`, `plan-lead`, `review-lead`, and the pstack skill role lines) and the per-harness limit on honoring them:

- **kimi:** the value is a `[secondary_model.models]` alias passed as the spawn's `model`; a configured pool is required, and `force = true` — which removes the parameter and pins every spawn — is reserved for single-model runs.
- **claude:** the per-call `model` argument overrides an agent file's `model:`, so the brief wins; `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` and account-blocked substitutions are the limits.
- **cursor:** the `Task` `model` argument; precedence against a subagent file is undocumented, so the run records the model used and discloses a mismatch.
- **codex:** `spawn_agent.model` is gated by `[features.multi_agent_v2]` and a custom agent TOML `model` outranks an explicit spawn; when the gate is off or a file pins otherwise, fall back and disclose.
- **pi:** no per-spawn parameter exists; the agent file's `model:` is the only child control, so use the skill default or the parent's model, record it, and disclose.

## Preserved but not owned by start-dev

The scratch-listing safety fix from `skills/poteto-mode/scripts/worktree-audit.sh` and `skills/poteto-mode/playbooks/worktree-cleanup.md` (upstream reference cursor/plugins#449) is worth offering to pstack upstream. It was reverted here with the rest of those files because the pack does not modify restored pstack paths. Until upstream takes it, the guard lives in this note.

The guard, for any operator who wants it back locally.

- Audit worktrees with `git -C <worktree> status --porcelain --ignored`. Plain porcelain reports an ignored-only worktree as clean, so an ignored-only worktree reads `clean` when it holds the only copy of untracked work.
- List every untracked and ignored path after the audit table. Removal is confirmed against that listing, not against a count.
- Never `git worktree remove --force` or `rm -rf` a path absent from the listing. Plain `git worktree remove` deletes ignored files without a refusal, and force-removing ignored-only content is what destroyed worktrees in cursor/plugins#449.

## Principles index copy

`references/principles.md` is a copy of the `## Principles` section of pstack `e44668c` `skills/poteto-mode/SKILL.md` (MIT, Lauren Tan): the full index of core, architecture, verification, delegation, and meta principles with each principle's when-it-applies. It is not a copy of the whole poteto-mode skill. The `principle-*` leaf skills remain the authority; start-dev owns this copy and its phase references; the restored pstack file is unchanged.

## What start-dev deliberately does not carry

`skills/poteto-mode/references/pstack-models.md` was discarded as local runtime state. `emit-plan` reads `~/.agents/pstack-models.md` and falls back to its own default; no pack script reads the discarded file.
