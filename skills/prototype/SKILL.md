---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user brings a design doc to turn into UI, an existing page or app to polish, appearance variants to compare, or logic and behavior to sanity-check before building.
---

# Prototype

A prototype is **throwaway code that answers a question**. The input the operator brings and the question being asked decide the branch; the table below is the whole discriminator.

## Direct invocation: spec-led by default

Invoked directly, `/prototype` builds a spec through questions and observed artifacts. It asks only for missing product decisions and researches facts itself. If the operator asks for "artifact only, no spec", skip the spec-led steps below. Run the [same construction sequence](../poteto-mode/playbooks/prototype.md) without a spec or interview, and capture the answer in the existing decision record or with the artifact. Paths below are relative to the pack root, two directories up from this file.

1. **Create or reuse one effort tree.** Resume an existing effort with a `spec.md`, a `map.md`, or a matching prototype before minting a new `.scratch/<effort>/`. A multi-repo effort names one owning repo and links the other repos and branches from that tree.
2. **Start or update `spec.md`** using the template in `skills/to-spec/SKILL.md`. Fill what the request, the code, and the environment already answer.
3. **Interview through `skills/grill-with-docs/SKILL.md`.** Follow its `grilling` and `domain-modeling` rules for interview order and glossary and ADR timing. Ask only the missing product decisions the template needs, batched by the current decision frontier, with a recommendation each. Use the harness's structured question tool when the active profile permits it.
4. **Run prototype-shaped questions through the six steps of `skills/poteto-mode/playbooks/prototype.md`.** These questions ask about layout, interaction, timing, or an approach that observation settles better than discussion. Route the input and question through the table below. Reading the playbook by path runs its steps without invoking `/poteto-mode`. Its step 1 scopes the actor, task, claim, and cheapest adequate fidelity for both this direct path and any caller-driven path; the interview above asks only the product choices that scoping cannot derive. Capture the selected direction, rejected alternatives, evidence, branch or commit, and remaining questions in `spec.md` and `decisions.tsv` before the dependent interview branch continues.
5. **Repeat until the spec frontier is clear.** Ask the operator to confirm the shared understanding and final spec. Do not publish to a tracker, chain into another workflow, or begin implementation.

The boundaries are:

- `/poteto-mode` and `/start-dev` are later, explicit human invocations. Direct `/prototype` invokes neither.
- Poteto uses the same sequence under its artifact-led contract. It does not start a second spec interview.
- A `wayfinder:prototype` ticket inherits the same sequence without a separate invocation. Carry map Notes into the brief and link the asset from the ticket. Capture into the effort's `spec.md` and `decisions.tsv`. Reuse a direction the operator already approved for this decision, but keep an unresolved ticket open until its human decision is recorded. Wayfinder resolves one non-research ticket per session.

Wayfinder maps stay optional. Reuse an existing `map.md` when one is present. A small direct prototype creates none. Chart or reuse a map only when discovery exposes fog that cannot be resolved safely in one session, then follow the HITL Prototype ticket contract in `skills/wayfinder/SKILL.md`.

Artifacts keep the existing layout. No map, manifest, coverage file, or checker is required:

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
| Existing page / app | [LOGIC](LOGIC.md) (extract the state) | [VARIANTS](VARIANTS.md) (sub-shape A) | [LOGIC](LOGIC.md) if behavior; [VARIANTS](VARIANTS.md) (sub-shape A) if layout/appearance | [REDLINE](REDLINE.md) |
| Bare question | [LOGIC](LOGIC.md) | [VARIANTS](VARIANTS.md) (sub-shape B) | [LOGIC](LOGIC.md) (behavior sub-shape) | [REDLINE](REDLINE.md) needs an existing page; without one route [VARIANTS](VARIANTS.md) and state the assumption |

On an ambiguous cell, the input decides the default branch: a design doc biases [DESIGN-DOC](DESIGN-DOC.md), an existing page biases [VARIANTS](VARIANTS.md) or [REDLINE](REDLINE.md) by question, a bare question biases [LOGIC](LOGIC.md) — and the artifact's top states the assumption in one line. Interaction questions route by what is uncertain: state transitions and behavior go to [LOGIC](LOGIC.md); layout, hierarchy, and appearance go to [VARIANTS](VARIANTS.md) or [DESIGN-DOC](DESIGN-DOC.md).

When the effort replaces or migrates an incumbent system, the incumbent's actual feature surface is the coverage baseline, not the decision map. Audit every user-visible workflow, unit, currency, published API, and displayed metric from source before any build, broadly enough to discover omitted audiences and dependencies. Then reproduce the equivalent incumbent workflows within the prototype's selected migration scope before extending. Fidelity here means workflow and semantic coverage, not pixel fidelity, and not whole-system construction; the operator may swap in the target UI/UX.

**Bounded revision.** Before editing an existing artifact, record its current entry, the requested change, and the journeys, content locks, and design conventions to preserve. Keep unrelated areas intact. Reuse the recorded direction if the choice and its constraints still hold. Verify the changed journey and re-drive one relevant unchanged journey. Return a reopened direction to shared comparison.

The branches:

- [LOGIC](LOGIC.md) — exercise a state model with a script or a shareable HTML file.
- [VARIANTS](VARIANTS.md) — make runnable alternatives reviewable behind one switcher.
- [DESIGN-DOC](DESIGN-DOC.md) — ground a brief, prepare a visual plan, and shape the evidence for a direction choice.
- [REDLINE](REDLINE.md) — audit an existing draft or its variants for polish and record the decision.

## Rules that apply to every branch

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious, but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure. A prototype answering a ticket (wayfinder ticket or plan unit) lives in that effort's tree at `.scratch/<effort>/prototype/<slug>/`; a standalone prototype gets its own effort tree with the same shape. When the seat is a worktree inside the effort's own artifact root, place the artifact at the worktree-local effort root once and pass that path by variable; never re-derive a doubled `.scratch/.../.scratch/...` path at each consumer. The artifact and its evidence never live in `/tmp` — `/tmp` holds only disposable process scratch (trunk worktrees, browser profiles), whose evidence files still save into the effort tree.
2. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE, wipe me" name.
3. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
4. **Share the same grounding.** Carry the effort's UI locale, domain wording, units, and currency into the artifact and Arena briefs. The review language can differ from the UI locale. When an existing product, brand package, or measured reference supplies constraints, resolve its [design context](references/design-context.md) before making candidates. Give each candidate the same context path and any compatible `tokens.css` path.
5. **Plan state evidence when the UI is stateful.** Before building, use the [surface states](references/design-principles.md#461-surface-states) to name the states relevant to the declared journey and the claim under test. Scope coverage to the stateful component, not the whole page.

How a prototype starts, proves itself, and closes is not a rule per branch — it is the [completion gate](#completion-gate) below, the single authority for all four branches. The branch files point at it and repeat none of it.

## Completion gate

A prototype is done only when all three clauses hold. Every branch closes through this one gate; no branch file restates it.

1. **Runnable with one command.** Playwright's `webServer` starts a server-backed prototype, a static artifact opens as a file, and REDLINE uses the existing app's own start command. No thinking required to start it. The same one-command runnability belongs to the operator's review: hand over the file path or a restart command the operator runs themselves, and offer a served localhost URL proactively at handoff. A live server the agent owns serves only the agent's own verification pass; review availability never depends on the agent's uptime.
2. **Verified with the branch's evidence.** Drive each planned state and link the observation, including recovery and preserved input where relevant. An appearance-only prototype records why state coverage does not apply. LOGIC records observed state output or a walkthrough. VARIANTS renders the relevant state on each switch and records screenshots and applied-guide disclosure. DESIGN-DOC records the approved direction and a screenshot. REDLINE records reports and `winner.json`. Add driven evidence when these records alone do not show the relevant behavior.

   For a single-file HTML deliverable, open the exact export through `file://`. Verify a non-empty mount, no browser console errors, and the selected journeys. HTTP evidence does not substitute. Distinguish directly verified behavior, operator-approved direction, and representative-user observation. A driven journey does not show that users understand it. If a suitable participant is available, record task completion, assistance, errors, navigation and context switches, and where the participant struggled. Otherwise leave the usability claim unresolved.
3. **Captured.** Record the question, supported conclusion, and unsupported claims in the owning `spec.md` and `decisions.tsv` when they exist. Otherwise use the existing decision record or keep the decision with the artifact. In the existing rationale and evidence fields, name the alternative or assumption each material choice displaced. Link the observation that supports or limits the choice. Cite a principle, design law, or guide when it actually changed the choice. An observation-led choice needs no invented citation.

   Archive the prototype on a throwaway branch out of main, with a pointer from the spec, issue, or decision record. Keep losing REDLINE variants with their reports. An unresolved or rejected hypothesis is a valid outcome. Applying the winner or starting implementation requires a separate operator invocation.

Capture is idempotent: re-running it amends the archive commit and updates the pointer in place. REDLINE's later application checks whether the winner is already applied before reapplying it, outside this run.

## Verify with a browser

Browser evidence comes from driving the real browser artifact; a script-only LOGIC run is evidenced by its observed output, not a browser pass. Reuse [playwright-cli](../playwright-cli/SKILL.md) for the browser pass.

- **Server lifecycle belongs to Playwright.** Where a server exists, start it through Playwright's `webServer` — it runs the start command, waits for readiness, and tears the server down. The options are documented in the [playwright-expert configuration reference](../playwright-expert/references/configuration.md).
- **Static artifacts need no server.** A single HTML file opens directly.
- **A server started outside Playwright** obeys three rules: drain the server's stdout and stderr pipes (a full pipe buffer stalls the server), probe HTTP rather than the TCP port (a bound socket is not readiness), and kill the whole process group rather than the parent PID.
- **One journey per command, evidence read back separately.** Run one browser code step per journey and read its output file in a separate step; chaining the assert into the next browser command re-runs everything on each failure. Separate "the run failed" (diagnose the timeout or selector) from "the evidence file is malformed" (fix the harness). An identical failure twice is a stop-and-diagnose signal, never a retry input.
