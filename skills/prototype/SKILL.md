---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user brings a design doc to turn into UI, an existing page or app to polish, appearance variants to compare, or logic and behavior to sanity-check before building.
---

# Prototype

A prototype is **throwaway code that answers a question**. The input the operator brings and the question being asked decide the branch; the table below is the whole discriminator.

## Route by input and question

Name the **input** (a design doc or brief, an existing page or app, a bare question) and the **question** (logic-behavior, appearance, interaction, polish), using the user's prompt, the surrounding code, or by asking if the user is around. The four branches produce very different artifacts, so a wrong pick wastes the whole prototype.

| Input ＼ Question | logic-behavior | appearance | interaction | polish |
|---|---|---|---|---|
| Design doc / brief | [LOGIC](LOGIC.md) (rare; treat as bare question) | [DESIGN-DOC](DESIGN-DOC.md) | [DESIGN-DOC](DESIGN-DOC.md) | [REDLINE](REDLINE.md) on the rendered draft |
| Existing page / app | [LOGIC](LOGIC.md) (extract the state) | [VARIANTS](VARIANTS.md) (sub-shape A) | [VARIANTS](VARIANTS.md) (sub-shape A) | [REDLINE](REDLINE.md) |
| Bare question | [LOGIC](LOGIC.md) | [VARIANTS](VARIANTS.md) (sub-shape B) | [LOGIC](LOGIC.md) (behavior sub-shape) | [REDLINE](REDLINE.md) needs an existing page; without one route [VARIANTS](VARIANTS.md) and state the assumption |

On an ambiguous cell, the input decides the default branch: a design doc biases [DESIGN-DOC](DESIGN-DOC.md), an existing page biases [VARIANTS](VARIANTS.md) or [REDLINE](REDLINE.md) by question, a bare question biases [LOGIC](LOGIC.md) — and the artifact's top states the assumption in one line. Interaction questions route by input, because interaction lives in the artifact the input names.

The branches:

- [LOGIC](LOGIC.md) — push a state model through the cases that are hard to reason about on paper, in a single shareable HTML file a non-developer can drive.
- [VARIANTS](VARIANTS.md) — several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.
- [DESIGN-DOC](DESIGN-DOC.md) — ground a brief, write and gate a design plan, fan direction cards, narrow by the thumbnail funnel, build the picked direction.
- [REDLINE](REDLINE.md) — audit each variant of an existing page for polish, then select a winner by a fixed rule.

## Rules that apply to every branch

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious, but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure. A prototype answering a ticket (wayfinder ticket or plan unit) lives in that effort's tree at `.scratch/<effort>/prototype/<slug>/`; a standalone prototype gets its own effort tree with the same shape. The artifact and its evidence never live in `/tmp` — `/tmp` holds only disposable process scratch (trunk worktrees, browser profiles), whose evidence files still save into the effort tree.
2. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE, wipe me" name.
3. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.

How a prototype starts, proves itself, and closes is not a rule per branch — it is the [completion gate](#completion-gate) below, the single authority for all four branches. The branch files point at it and repeat none of it.

## Completion gate

A prototype is done only when all three clauses hold. Every branch closes through this one gate; no branch file restates it.

1. **Runnable with one command.** Playwright's `webServer` starts a server-backed prototype, a static artifact opens as a file, and REDLINE uses the existing app's own start command. No thinking required to start it.
2. **Verified with the branch's evidence form, with the state surfaced.** LOGIC prints or renders the full relevant state after every action and records observed state output or a walkthrough recording. VARIANTS renders the full relevant state on every variant switch and records per-variant screenshots, with per-id disclosure where a modern-web-guidance guide was applied. DESIGN-DOC records the approved-direction file plus a screenshot of the built artifact. REDLINE records the per-variant reports plus `winner.json`.
3. **Captured.** The validated decision — the verdict and the question it settled — folds back into the real code, and the prototype is archived as a primary source on a throwaway branch, out of main, with a context pointer to that branch left where the decision lands (the issue or the commit). REDLINE applies the winner and archives the losing variants with their reports. Main keeps only the validated decision.

Capture is idempotent: re-running it amends the archive commit, updates the pointer in place, and REDLINE's fold-back checks the winner is already applied before reapplying.

## Verify with a browser

Every branch's evidence comes from driving the real artifact. Reuse [playwright-cli](../playwright-cli/SKILL.md) for the browser pass.

- **Server lifecycle belongs to Playwright.** Where a server exists, start it through Playwright's `webServer` — it runs the start command, waits for readiness, and tears the server down. The options are documented in the [playwright-expert configuration reference](../playwright-expert/references/configuration.md).
- **Static artifacts need no server.** A single HTML file opens directly.
- **A server started outside Playwright** obeys three rules: drain the server's stdout and stderr pipes (a full pipe buffer stalls the server), probe HTTP rather than the TCP port (a bound socket is not readiness), and kill the whole process group rather than the parent PID.
