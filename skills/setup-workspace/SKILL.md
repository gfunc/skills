---
name: setup-workspace
description: Onboard a repository for the gfunc pack, Wayfinder, and start-dev. Discover existing guidance, tracker, models, plugin, and verification coverage. Preview and approve scoped changes, complete selected phases, and report each scope. Use for /setup-workspace or "set up this workspace".
---

# Set up a workspace

Inspect first. Reuse working configuration. Preview changes, obtain scoped approval, complete selected phases, and report their results. This router coordinates existing owners. It does not install dependencies or start a product task.

## 1. Locate the pack and inspect the target

Keep two absolute roots. The pack root comes from this skill's actual installed or cloned location, two directories above it. The target root is the consuming repository. Resolve pack links there and repository paths under the target, never against a guessed checkout.

Read the active harness pointer and follow the [adapter and clone-selection contract](../../references/adapters/README.md). Resolve `profile-root` and `profile` to one absolute profile path. `plugin` means the installed pack root. Read the profile and confirm its identity matches `harness`. Without a pointer, use the pack's [existing resolver](../../scripts/resolve-harness), with explicit selection when required. Do not add another selector. A missing, ambiguous, unreadable, or mismatched profile stops affected harness actions, not harness-neutral inspection.

Before proposing writes, inspect these sources without exposing secrets:

- Repository status and applicable root, parent, and nested instructions. Read `AGENTS.md`, `CLAUDE.md`, and their referenced ownership relationship.
- `docs/issue-tracker.md`, legacy `docs/agents/issue-tracker.md`, and guidance that names another tracker. A remote host is not a tracker choice.
- Existing domain guides, glossaries, ADRs, `GLOSSARY-MAP.md`, and package context maps. Read relevant scoped instructions without flattening them.
- Documented execution and check commands, tests, real-behavior harnesses, and project-local verification skills in the active profile's skill folders. Distinguish a test suite, a harness, and a skill with launch, drive, and feature-map instructions.
- `~/.agents/pstack-models.md`, if present, and non-secret evidence of the pack's loaded or installed state. Do not read credential stores or native provider-auth configuration.

Identify the real consumer path for each repository type. Use public API usage for libraries, rendered-document workflows for docs, and actual skill or plugin use for skill packs. Note other unmapped paths. No UI does not mean verification is inapplicable. Do not run execution commands during discovery unless separately approved.

Keep one run record of findings, offers, approvals, changed inputs, resources, and outcomes. Choose a unique run ID for `.scratch/setup-workspace/<run-id>/report.md` in the target. Inspect ignore rules before writing scratch files. Preview an ignore-rule change only if needed. If ignored reporting is unavailable or declined, keep the report in the conversation and disclose that it was not persisted.

## 2. Preview and approve each effect

Show what is usable, what needs attention, and the proposed changes. Separate repository wiring, user preferences, installation, and verification. List exact paths and content differences, files to preserve, commands, resources, evidence paths, and cleanup. Discovery alone authorizes no maintained-file writes.

Offer missing model configuration once. Offer verification generation once when no project-local app-driving skill exists, even if a harness already exists; formal verification has no onboarding offer. Offer maintenance once for a usable skill that appears stale or incomplete. Record declines and do not repeat these offers in this run. Installation is not an automatic offer or prerequisite. Run it only on an explicit request.

Selecting a phase does not approve its writes or execution. Obtain approval for each concrete preview. Carry forward exact approvals and choices already supplied. Let each capability owner obtain its detailed approval when that detail is not yet known. New effects need a new preview and approval.

Before each approved write, reread affected files and check the preview's inputs. If content, ownership, or a resolved destination changed, stop that action and preview again. Read-only paths and unrelated dirty work are not permission to overwrite or reset. Apply only approved differences. Read back writes and compare them with the preview. Matching content needs no write.

## 3. Wire the repository

For selected repository changes, read the [repository wiring guide](references/repository-wiring.md). It defines tracker migration, one guidance owner, and the small setup-owned block.

Use `docs/issue-tracker.md` as the canonical tracker document when configuration is needed. Without configuration, use [local Markdown](../../references/trackers/local-markdown.md), even when a remote exists. Do not create a tracker document merely to restate that default. Preserve custom configuration. Preview legacy migration and a compatibility pointer before either write. Conflicting authorities stop that action for an operator choice.

Update one existing guidance owner. Create `AGENTS.md` only when neither conventional file exists. If both exist, follow their established ownership relationship. Ambiguity stops that action for an operator choice. Preserve surrounding and nested content. Use short inline domain-reading rules or an existing custom guide. Do not create empty glossaries, ADRs, or context maps.

Reuse existing explicit tracker configuration as the current choice. A new tracker requires an explicit choice. Read the matching [GitHub](../../references/trackers/github.md) or [GitLab](../../references/trackers/gitlab.md) reference, or the repository's custom instructions. Preview local instructions and read-only capability checks, including Wayfinding operations, child tickets, and dependencies. Report unavailable capabilities. Never execute the reference's write examples during setup. Do not create labels, issues, maps, or PRs.

## 4. Complete the model phase here

This router owns the phase. If the model offer was declined, record `declined` and continue to step 5 without another offer or a write.

Read the active profile's `## Models` and `## Subagents` sections and follow them as the mechanism: how a subagent model is chosen, the availability gate, the inheritance token, and whether a per-spawn model parameter exists. Read `~/.agents/pstack-models.md` if present; it is the role-intent store the pack's skills read when they pick a model, not a harness configuration. Take the role set from the pack's skills plus the file's existing lines; a line no skill names is retired, and a role the file does not list falls back to that skill's default.

Establish which aliases are available before proposing a value. Apply the profile's availability gate and its model smoke. Never record a slug you have not confirmed is available; mark the role as needing a choice instead. Where the per-spawn parameter needs a configured model pool to exist at all, such as Kimi's `[secondary_model]`, the pool's alias additions are part of the previewed differences. On a harness with no per-spawn model parameter, record that limit and the skill-default fallback rather than writing aliases nothing can use.

Preview the role-to-model table with current and proposed values, confirmed aliases, fallbacks, and the exact differences. Obtain approval for those differences, then write only them to `~/.agents/pstack-models.md`, preserving every untouched line. Read the write back against the preview. Do not write a harness-specific rule file from an older setup, repair native configuration, silently substitute model families, or install a plugin. Preferences do not provision models.

**Native alias write.** When the active profile binds subagent models through a native pool the brief's `Model:` lines must name — on Kimi, the `[secondary_model.models]` table in `~/.kimi-code/config.toml` — the approved alias additions are a separate write with their own preview and approval, distinct from the `~/.agents/pstack-models.md` differences. Preview the exact alias lines to add under `[secondary_model.models]` and the `[models]` entry each resolves to, and confirm each alias passes the profile's availability gate before proposing it. On approval, add only those alias lines through the native config surface, preserving every other line, table, and key, and never touching provider auth or credential keys. Read the write back against the preview. A declined or blocked native write leaves `~/.agents/pstack-models.md` untouched and the affected roles recorded as needing a choice; a role line that names an alias absent from the pool cannot be honored, so do not write it.

## 5. Install only when separately requested

Reuse an already-loaded plugin. A plain clone is usable without installation. Otherwise record installation as not requested and continue.

For an explicit installation or update request, read the pack's [existing installer](../../scripts/install). Preview its command, source, destinations, registry effects, and any native trust requirements. Resolve source and managed destination before replacement. If they are the same directory, refuse before mutation and request a separate source checkout. Do not stage a self-copy or bypass the installer safeguard or hook trust.

Obtain separate installation approval, then use only the installer for the active harness. Do not reproduce its mechanics here. Record actual stage results and failures without equating installation with model availability or consumer-path proof.

## 6. Complete only selected verification work

Generation here is an offer, not the gate. `start-dev`'s verification readiness decides what a run actually requires: it always re-checks surface match and feature-map coverage, and a mismatch is `exists-stale`. When several verification skills exist, obtain an explicit target choice before maintenance. Read the selected skill and map. For a usable stale or incomplete skill, route the accepted offer to [maintain-verification-skill](../maintain-verification-skill/SKILL.md). An unusable structure is a reported gap, not permission to replace it. For an absent skill, route accepted generation to [create-verification-skill](../create-verification-skill/SKILL.md). Wrap an existing harness instead of duplicating it.

Before execution, read the chosen owner and preview its concrete file changes, launch and doctor commands, drive, isolated data, evidence, and cleanup. Resolve owner-proposed commands before approval. Select project-local output from the active profile's skill folders and existing repo convention. Disclose unmapped consumer paths and prerequisites. If no safe meaningful path is established, report the reason instead of inventing one.

Approval covers only the previewed isolated local work and required proof. Dependency installation, native repair, paid calls, shared or production resources, product fixes, commits, and PRs each need separate explicit authorization.

Announce that boundary before invoking the selected owner. Pass the absolute profile, target, approved effects, and exclusions. Follow that owner's workflow now, then return its result to step 7. Generation may say to fix startup or install dependencies. Maintenance may say to ship a PR. Stop those effects unless separately approved. This is a permission stop, not a silent override of the owner's completion criteria. Preserve partial work and report pending effects rather than claiming the owner finished.

Preserve the owner's proof bar. Generation executes launch, doctor, at least one mapped real journey, evidence capture, and cleanup. Maintenance exercises every mapped feature and re-proves corrections. Check that evidence survives cleanup. A discovered harness, unit tests, file creation, or build does not prove the consumer path. An unexecuted or failed generated skill remains an unverified draft or blocked result. If permissions prevent completion, report the incomplete owner result. Declined or blocked verification does not stop unrelated repository onboarding.

## 7. Report and leave a resumable state

Read the [run report guide](references/run-report.md). Persist the secret-free report only in the target's ignored run directory. Read it back. If persistence fails or is unavailable, return the report in the conversation and name the unsaved path and reason. Do not expose secrets, credential-bearing URLs, or raw auth output.

Report workspace, user/harness, and verification separately. Use `ready`, `needs-action`, `blocked`, `declined`, or `not-applicable` with evidence, reasons, and next actions. Keep preference, availability, and plugin results distinct within user/harness. Distinguish discovered or configured state from verified execution. Do not collapse partial results into an unconditional success claim.

After failure or interruption, retain completed changes and evidence. Clean up only processes and disposable resources this run created, using recorded identities, never broad process-name kills or repository resets. Evidence stays. On resume, re-inspect actual state, reconcile prior approvals and resources, and preview remaining differences. Do not replay stale writes. An already-correct rerun changes no maintained files, though it may create a new run report.

Return the report path or persistence limitation, per-scope outcomes, and next actions. You may suggest Wayfinder for an unclear large goal, start-dev for an approved spec, or poteto-mode for a clear task with a success check. Do not start any of them automatically. start-dev specifics live in its own skill; this router offers verification generation and maintenance once here, and `start-dev`'s verification readiness is the enforcement point.
