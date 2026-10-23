---
name: setup-pstack
description: Configure or reuse pstack's per-role models and reasoning budget. Validate availability, preview preference changes, and write only approved settings. Use for /setup-pstack, "configure pstack models", "pstack budget", or the model phase of setup-workspace.
---

# Configure pstack models

Configure role preferences in `~/.agents/pstack-models.md`. This universal file is the only preference authority, and pstack skills read it explicitly. A preference does not make a model available in the native harness.

Use this workflow for both `/setup-pstack` and the model phase of `setup-workspace`. When a caller has already obtained acceptance of the phase, continue here without another offer or slash invocation. Carry forward its explicit choices and scoped approvals. Selecting the phase alone does not approve file writes.

Do not install or update plugins, copy agent definitions, change native provider configuration, or offer verification generation. Those effects are outside this skill.

## Steps

### 1. Read the profile and current preferences

Read the active harness profile supplied by the caller or adapter. Follow the existing [adapter and clone-selection contract](../../references/adapters/README.md). Resolve `profile-root` and `profile` to one absolute profile path. On a plain clone without a pointer, use the pack's existing [harness resolver](../../scripts/resolve-harness). Locate the pack from this skill's actual location, not the consuming repository's working directory. A missing, unreadable, or mismatched profile blocks the affected phase.

Read `~/.agents/pstack-models.md` if it exists. Use its role values and `# budget` line as the current choices. A missing role keeps its skill default. On reuse, report an absent budget line as unrecorded and name `large` as the default. Do not add a line. Do not treat a delivery copy as another preference source.

Unless reconfiguration was explicitly selected, preserve existing preferences byte for byte. Do not normalize formatting, add omitted roles, delete retired lines, or refresh delivery copies. Validate the effective choices in step 2, then return the reuse result in step 6. Unavailable or unconfirmed choices require a report, not an automatic rewrite.

If preferences are missing, continue with the accepted configuration phase. If the operator declines configuration, return `declined` without writes. Ask only for choices that are still missing or need resolution.

### 2. Establish native availability

Use the active profile's Models and Subagents sections for the availability gate, inheritance token, and model mechanism. Inspect only documented, non-secret catalogs or session tool metadata. Prefer the profile's model-list command when one exists. Do not read credentials or provider-auth configuration, edit native settings, spawn probe agents, or make paid calls.

Record the available slugs and the evidence used. A catalog name alone does not satisfy an additional gate the profile requires. If the evidence cannot establish availability, mark the affected roles as unconfirmed. Explain unavailable roles and the native prerequisite without repairing it.

`inherit-parent`, `auto`, and the active profile's inheritance token are valid preference values. They leave the subagent's `model` unset and retain the parent model and effort. Disclose any inheritance limitation the profile records. Do not demand real model slugs when inheritance resolves the selected configuration.

For reused preferences, return `needs-action` if an effective choice is unavailable or unconfirmed. Leave the file unchanged. For a new or explicitly selected configuration, resolve only the affected choices in step 3.

### 3. Select missing or requested choices

Prefer the structured-question tool in the profile's Capabilities section. Without one, ask in chat with numbered options. Do not repeat questions the operator or caller already answered.

For a new configuration, start from the role defaults in step 5. For reconfiguration, start from the current effective choices. Preserve families, panel lists, aliases, and the budget unless their change was selected. Identify retired role lines, such as `how critics`, for removal only in an explicitly selected reconfiguration preview.

Ask for a budget only when one is missing from the selected configuration or the operator requested a budget change. Name the current budget when recorded. With no prior choice, explain that `large` matches the skill defaults. Offer these choices:

- `unlimited` uses `max` reasoning.
- `large` uses `xhigh` reasoning.
- `medium` uses `high` reasoning.
- `small` uses `medium` reasoning.

For a new configuration or a selected budget change, set every real slug's effort token to the target, including panel entries. The effort token is last, or immediately before a trailing `fast`. The effort ladder is `max` > `xhigh` > `high` > `medium` > `low`. If the result is not available, use the same family's available slug with the highest effort at or below the target. If none exists, mark that role as needing a choice. Do not invent a slug or change its family silently. Inheritance values do not change with the budget.

For example, `unlimited` proposes `claude-opus-5-5-max` for `claude-opus-5-5-xhigh` only if available. If Grok's detected slugs stop at `xhigh`, keep `grok-4.7-xhigh-fast` under `unlimited`. Under `small`, use `claude-opus-5-5-medium` and `grok-4.7-medium-fast` only if available.

Offer confirmed models and inheritance values for roles that need a choice or were selected for change. For `arena runners`, `architect runners`, and `interrogate reviewers`, each list entry creates one subagent, including repeated inheritance entries. The list length sets the count. `arena cross-judge pool` is a list from which Arena selects one value whose family differs from the parent's when possible. `swarm workers` supplies every worker's default unless a race or comparison assigns another model per arm.

### 4. Validate and approve the write preview

Validate every real slug to be written against step 2's evidence and the active profile's gate. Inheritance values pass as described above. If a choice is unavailable or unconfirmed, request a supported alternative or return `needs-action`. Do not write an unresolved configuration.

Show every effective role and its chosen value, the budget and target effort, and the availability evidence. Preview exact paths, content changes, retired-line removals, and any delivery copies. Identify paths that remain unchanged. Ask for approval of these specific writes unless the caller already obtained that exact approval.

Use only the active harness's documented delivery path. Claude Code can load a verbatim copy at `~/.claude/rules/pstack-models.md`. Cursor can use an optional project copy at `.cursor/rules/pstack-models.mdc`, with the frontmatter shown below. Cursor User Rules are UI-managed, not a user-level rule file to create. Include a delivery copy only in the approved preview. It is never another preference authority.

If approved content already matches, skip the write. If approval is declined, keep the existing state and return `declined`.

### 5. Write and read back approved preferences

Re-read affected files immediately before writing. If the inputs changed after the preview, stop the affected write and obtain a fresh preview and approval. Unreadable files, conflicting changes, and read-only paths block this phase, not unrelated caller phases.

Write only approved differences to `~/.agents/pstack-models.md`, without frontmatter. Record the chosen budget label and target effort in `# budget`. Use the role names below. These are defaults, not evidence that the named models are available:

```text
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# Inheritance values keep the parent model and effort. Omit the subagent model parameter.
# Each inheritance entry in a panel list still counts toward its fan-out.
# budget: large (xhigh)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: grok-4.7-xhigh-fast
perf-issue: grok-4.7-xhigh-fast
hillclimb: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-xhigh
hardest tasks: claude-opus-5-5-xhigh
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-xhigh
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-xhigh
reflect tooling: grok-4.7-xhigh-fast
reflect judgment, divergent, synthesizer: claude-opus-5-5-xhigh
arena runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
arena cross-judge pool: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
swarm workers: grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
```

After the universal write succeeds, create or update only approved delivery copies from that file. The Claude Code copy has no frontmatter. Only the Cursor project copy prepends this frontmatter:

```yaml
---
description: pstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
```

Read back each written file and compare it with the approved content. If a delivery copy fails, retain the completed universal write and report the failed path. Do not roll back successful changes or report the phase as ready.

### 6. Return the model result

Report the model phase with these details in ordinary prose or a short list. No new result-file format is required:

- The outcome is `ready`, `needs-action`, `blocked`, `declined`, or `not-applicable`, with its reason. Distinguish reused preferences from completed or partial writes.
- Name the universal preference path and each delivery path inspected or written. State which files changed and which stayed unchanged.
- Include the chosen roles, panel lists, and budget. Identify omitted roles that retain defaults.
- Include validation evidence and its limits. Configuration and availability checks are not model execution proof.
- Explain skipped or blocked work, affected roles, and the next action. Do not claim native provisioning, installation, or verification generation.
- When called by `setup-workspace`, return this result directly to that caller and continue its remaining phases, including after a declined or blocked model phase. Never require the operator to invoke `/setup-pstack` separately. For standalone use, finish with the same result.
