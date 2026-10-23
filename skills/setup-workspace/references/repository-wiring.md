# Wire tracker and repository guidance

Use this guide only for selected repository changes. Resolve paths under the target repository. Preview exact differences and obtain approval before writing. Preserve unrelated content and dirty work.

## Resolve the tracker

1. Read `docs/issue-tracker.md`, legacy `docs/agents/issue-tracker.md`, and tracker declarations in applicable guidance. Compare all explicit authorities first. Conflicts require an operator choice before any tracker or tracker-link change. Leave conflicting sources untouched while unresolved.
2. If the canonical document exists without a conflict, reuse its custom instructions. Treat a legacy document that only points to it as compatibility, not a second authority.
3. If only the legacy document contains configuration, preview copying its full custom contents to `docs/issue-tracker.md`. Adjust only relative links that the move would break, and disclose those edits. Replace the legacy body with a compatibility pointer only after reading back the canonical copy and confirming preservation.
4. For compatible duplicate instructions, preview consolidation into the canonical document without losing unique custom text. If they are identical, leave the canonical document unchanged. Convert the legacy document to a pointer only after canonical readback. If compatibility is uncertain, stop for an operator choice.
5. If neither document nor guidance configures a tracker, retain the pack's local-Markdown default. Do not infer a remote tracker from a Git remote or create a file for the default. If guidance alone names a custom tracker, preserve it and preview any canonicalization instead of silently falling back.

The migrated legacy document can contain this pointer. Its target is relative to `docs/agents/`:

```markdown
# Issue tracker

Read [the canonical tracker instructions](../issue-tracker.md). This compatibility pointer contains no separate tracker policy.
```

For a selected tracker change, preserve existing operations and custom conventions. Use the pack's matching tracker reference for map, child-ticket, dependency, claim, and frontier operations. Custom trackers need concrete equivalents or an explicit capability gap. Local setup can document future remote operations. It cannot perform them. Preview only read-only access checks. Do not provision labels, create test tickets, or introduce triage.

## Choose one guidance owner

Read both root files when present, plus applicable parent instructions. If one file delegates shared repository guidance to the other, update the delegated owner. Preserve the referring file and any harness-specific sections. Mutual references or two independent policies do not establish ownership. Stop the guidance action for an operator choice when ownership is ambiguous.

If only `AGENTS.md` or only `CLAUDE.md` exists, use that file. If neither exists, preview a new `AGENTS.md`. Do not create both or modify nested files to impose a root hierarchy. Respect scoped instructions and monorepo context maps.

Update only the setup-owned block delimited below. Preserve custom additions within an existing block unless their change was explicitly selected. With malformed or duplicate markers, stop for reconciliation instead of guessing which text to replace. With no block, reuse equivalent existing guidance without duplication. Append a small block only for missing instructions, after preview and approval. Do not absorb surrounding custom text into a block you claim to own.

## Add only missing guidance

Construct the block from observed paths and commands. The example is a shape, not text to copy with unresolved choices. For local Markdown, name the default without a tracker-file link. For configured tracking, point to `docs/issue-tracker.md` or the chosen existing custom authority. Do not encode a pointer to an unresolved tracker conflict.

```markdown
<!-- setup-workspace:begin -->
## Workspace guidance

Use local Markdown under `.scratch/` for planning and issue work unless this repository explicitly selects another tracker.

Before a domain change, read the relevant existing glossary and ADRs. If `GLOSSARY-MAP.md` exists, use it to find the affected context. Follow nested instructions. Create domain content only when a real term or decision needs recording. Do not create empty scaffolding.
<!-- setup-workspace:end -->
```

If a custom domain guide already owns these rules, link to that guide instead of adding parallel instructions. Preserve its package-specific paths. Include execution or check commands only when repository sources establish them and the guidance needs them. A documented command is not evidence of execution. Report missing commands rather than inventing them. Do not create a domain guide, glossary, ADR directory, or context map merely to complete setup.
