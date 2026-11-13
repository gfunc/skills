---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user brings a design doc to turn into UI, an existing page or app to polish, appearance variants to compare, or logic and behavior to sanity-check before building.
---

# Prototype

A prototype is **throwaway code that answers a question**. The input the operator brings and the question being asked decide the branch; the table below is the whole discriminator.

## Direct invocation: spec-led by default

Invoked directly as a skill, `/prototype` discovers a spec before it builds. It asks only for missing product decisions, answers facts by research, and settles prototype-shaped questions by observing the artifact.

1. **Create or reuse one effort tree.** Resume an existing effort with a `spec.md`, a `map.md`, or a matching prototype before minting a new `.scratch/<effort>/`. A multi-repo effort names one owning repo and links the other repos and branches from that tree, rather than parking an effort in `/tmp`.
2. **Start or update `spec.md`** using the `to-spec` template, read by path from `skills/to-spec/SKILL.md`. Fill what the request, the code, and the environment already answer. Research repository and environment facts instead of asking them.
3. **Interview through `grill-with-docs`**, read by path from `skills/grill-with-docs/SKILL.md`. Follow its existing `grilling` and `domain-modeling` rules for interview order and for glossary and ADR timing. Ask only the missing product decisions the template needs (problem, solution, user stories, implementation decisions, testing decisions, out of scope, open questions), batched by the current decision frontier, with a recommendation each. Use the harness's structured question tool where the profile names one.
4. **When a frontier question is prototype-shaped** — a layout, an interaction, a timing, an approach that observation settles better than discussion — run the six steps of `skills/poteto-mode/playbooks/prototype.md` by path, routing the input and question through the table below. Reading that playbook by path runs its steps; it does not invoke `/poteto-mode`. Capture the selected direction, rejected alternatives, evidence, branch or commit, and remaining questions into `spec.md` and `decisions.tsv` before the dependent interview branch continues.
5. **Repeat until the spec frontier is clear**, then ask the operator to confirm the shared understanding and the final spec. Do not publish to a tracker, do not chain into another workflow, do not begin implementation.

Explicit boundaries keep this the fourth front door rather than a new planning chain:

- `/poteto-mode` and `/start-dev` are later, explicit human invocations. Direct `/prototype` invokes neither. Reading the playbook, the template, or `grill-with-docs` by path runs their steps without activating those workflows.
- An explicit "artifact only, no spec" request keeps the previous lightweight behavior: route, build, verify, done.
- A prototype invoked inside `/poteto-mode` or `/wayfinder` follows the caller's contract; it never forces a second spec interview.

Wayfinder maps stay optional. Reuse an existing `map.md` when one is present. A small direct prototype creates none. Chart or reuse a map only when discovery exposes fog that cannot be resolved safely in one session, and then follow the existing HITL Prototype ticket contract in `skills/wayfinder/SKILL.md`.

Artifacts keep the existing layout. Nothing else is added, and no map, manifest, coverage file, or checker is required:

```text
.scratch/<effort>/
  spec.md
  decisions.tsv
  prototype/<slug>/
```

`spec.md` links each settled decision to its prototype evidence under `prototype/<slug>/`.

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
2. **Verified with the branch's evidence form, with the state surfaced.** LOGIC prints or renders the full relevant state after every action and records observed state output or a walkthrough recording. VARIANTS renders the full relevant state on every variant switch and records per-variant screenshots, with per-id disclosure where a modern-web-guidance guide was applied. DESIGN-DOC records the approved-direction file plus a screenshot of the built artifact. REDLINE records the per-variant reports plus `winner.json`. For a single-file HTML deliverable, open the exact exported file through `file://` — never over HTTP, which is a different runtime — and prove it there: a non-empty application mount, no browser console errors, and the selected journeys driven.
3. **Captured.** The validated decision — the verdict and the question it settled — folds back into where the decision lives: the owning effort's `spec.md` and `decisions.tsv` when one exists, otherwise the real code or decision record. The prototype is archived as a primary source on a throwaway branch, out of main, with a context pointer to that branch left where the decision lands (the spec, the issue, or the commit). REDLINE applies the winner and archives the losing variants with their reports. Main keeps only the validated decision. Later implementation is a separate explicit operator invocation, never a continuation of this run.

Capture is idempotent: re-running it amends the archive commit, updates the pointer in place, and REDLINE's fold-back checks the winner is already applied before reapplying.

## Verify with a browser

Every branch's evidence comes from driving the real artifact. Reuse [playwright-cli](../playwright-cli/SKILL.md) for the browser pass.

- **Server lifecycle belongs to Playwright.** Where a server exists, start it through Playwright's `webServer` — it runs the start command, waits for readiness, and tears the server down. The options are documented in the [playwright-expert configuration reference](../playwright-expert/references/configuration.md).
- **Static artifacts need no server.** A single HTML file opens directly.
- **A server started outside Playwright** obeys three rules: drain the server's stdout and stderr pipes (a full pipe buffer stalls the server), probe HTTP rather than the TCP port (a bound socket is not readiness), and kill the whole process group rather than the parent PID.
