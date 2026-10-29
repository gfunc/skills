---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a self-contained offline HTML report, then grill through the one the operator picks. Use when choosing refactor work from evidence instead of a hunch.
disable-model-invocation: true
---

# Improve codebase architecture

Surface architectural friction and propose deepening opportunities: refactors that turn shallow modules into deep ones. The aim is testability and navigability.

**Harness profile.** Read the active profile before harness-dependent work; `profile` is absolute, or relative to `profile-root` (`plugin` means the installed plugin root), and a parent passes its child the resolved absolute path; stop the affected action if the profile is unavailable.

Read [`GLOSSARY.md`](../../GLOSSARY.md) for **Module**, **Interface**, **Seam** and **Depth**, and use those words exactly. [`domain-modeling`](../domain-modeling/SKILL.md) owns the glossary; this skill adds no second vocabulary, and it drifts into "component", "service", "API" or "boundary".

## 1. Scope before you scan

**Repo-size guard.** Skip the scan when the repository has fewer than roughly 30 tracked source files, or one package with no internal module boundary. At that size the deletion test already settles the question, and an HTML survey costs more than it returns. Say so, name the files the operator might still mean, and stop.

YAGNI decides where to look. Deepening pays off through future changes, so weight the code that recently changed.

- If the operator named a module, subsystem or pain point, take it.
- Otherwise walk `git log --oneline` over a good stretch and let the hot paths pull attention first. Scattered changes with no hot spot widen the net.
- Read the glossary and any ADRs in the area before scanning.

## 2. Explore

Spawn one read-only subagent through the profile's Subagents section. Give it the scope and these questions, not a checklist of files.

- Where does understanding one concept require bouncing between many small modules?
- Where is a module shallow, its interface nearly as complex as its implementation?
- Where were pure functions extracted for testability while the real bugs hide in how they are called?
- Where do tightly coupled modules leak across their seams?
- Which parts are untested, or hard to test through the current interface?

Apply the **deletion test** to every suspected shallow module: would deleting it concentrate complexity, or just move it? "Concentrates" is the signal.

## 3. Present candidates as an HTML report

Write one self-contained file to the OS temp directory: `$TMPDIR`, falling back to `/tmp` on Linux and macOS, `%TEMP%` on Windows, named `<tmpdir>/architecture-review-<timestamp>.html`. Inline CSS and inline SVG only. No CDN, no web font, no network fetch, so the report renders offline and never lands in the repository.

Open it with `xdg-open`, `open` or `start` according to the platform, and tell the operator the absolute path. Start from [`references/report-template.html`](references/report-template.html).

Each candidate card carries:

- **Files.** The modules involved.
- **Problem.** The friction the current architecture causes.
- **Solution.** What would change, in plain English.
- **Benefits.** Stated in locality, leverage and the tests that get easier.
- **Before and after.** A side-by-side inline SVG diagram of the shallowness and the deepening.
- **Recommendation strength.** `Strong`, `Worth exploring`, or `Speculative`.

End with a **Top recommendation** and why. If a candidate contradicts an ADR, show it only when the friction is real enough to warrant reopening the ADR, and mark that in the card.

Do not propose interfaces yet. Ask which candidate to explore.

## 4. Grill, then design twice

Once the operator picks a candidate, run [`grilling`](../grilling/SKILL.md) to walk the decision tree: constraints, dependencies, the shape of the deepened module, what sits behind the seam, and which tests survive. Run [`domain-modeling`](../domain-modeling/SKILL.md) inline as terms and decisions settle, which is exactly [`grill-with-docs`](../grill-with-docs/SKILL.md).

When alternative interfaces are needed, run [`architect`](../architect/SKILL.md) Phase B, which owns the [`arena`](../arena/SKILL.md) sketch. Do not carry a second design-it-twice pattern here.

## Attribution

Adapted from Matt Pocock's `improve-codebase-architecture`, MIT, Matt Pocock. Five changes: bound to `grilling` and `domain-modeling`, inline CSS and SVG instead of CDNs, the harness-profile block, `architect` and `arena` replacing its design-it-twice pattern, and the repo-size guard the source lacks.
