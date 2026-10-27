# How pstack offers, mentions, and hands off its four verification skills

Research for the start-dev verification offering. Source: the pstack mirror at `/home/jason/projects/pstack`, commit `e44668c2aad92eacf4e84df47984121fefb11b82` (2026-10-20). The mirror is read-only here; every claim below quotes the file that owns it.

**The answer in one paragraph.** pstack offers the two *generators* exactly once, at the end of `/setup-pstack`, gated on project state rather than on user profile, and it stops at "no" without pushing. Everywhere else the four skills appear as routing text — a help table row, a guide section, a recipe, a mining signal — or as a create-to-maintain pointer between a generator and its maintainer. No poteto-mode playbook, reference, script, or role prompt names any of the four. A playbook can be *satisfied by* a verification skill the user names in the prompt, and the Multi-phase plan playbook structurally requires live proof, but nothing in the mode requires the capability to exist. The offer is the only enforcement point, and it is not enforcement: it is an optional prompt.

## What counts as "the four"

| Skill | Lifecycle role | Artifact it produces |
|---|---|---|
| `create-verification-skill` | generator — app-driving proof | `<skills>/verify-<app>/` with Launch, Doctor, Drive, Evidence, Cleanup, Helpers, and `features/` |
| `maintain-verification-skill` | upkeep — feature-map drift | at most one PR confined to the verify skill's own directory |
| `create-formal-verification-skill` | generator — property proof | a project-local skill that runs a model checker, prover, or code-level verifier |
| `maintain-formal-verification-skill` | upkeep — model/code drift | updated model, harness, or properties, plus a drift-versus-bug verdict |

The two kinds are deliberately separate. `09-make-it-yours.md:62` calls them "Two special cases [that] have their own generators", routing each away from the generic authoring playbook and pairing it with its maintainer in the same sentence.

## Every location, with classification

Classification key:

- **setup offer** — a one-time optional prompt at setup, gated on project state, that invokes on yes and moves on at no.
- **contextual mention** — names the skill as a routing answer, prerequisite, example, or signal. Offers nothing, invokes nothing.
- **create-to-maintain handoff** — a pointer from a generator to its maintainer or back, i.e. lifecycle pairing.
- **in-playbook capability** — a playbook step that runs the capability as part of its own sequence.

### `skills/setup-pstack/SKILL.md` — the only offer surface

| Line | Quote | Class |
|---|---|---|
| 78 | `### 7. Offer a verification skill (optional)` | setup offer |
| 80 | "Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: 'want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill.' On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing." | setup offer |
| 82 | `### 8. Offer a formal verification skill (optional)` | setup offer |
| 84 | "Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: 'want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill.' On yes, invoke `/create-formal-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing." | setup offer |

Both steps carry `(optional)` in the heading, both say "offer once", both end "On no, move on without pushing", and both resolve the slash command "wherever pstack is installed: workspace, user, or plugin" — the offer does not assume the plugin layout.

The two gates are not symmetric. Step 7 accepts "a `verify-*` skill, **or an existing harness**". Step 8 accepts only "a project skill that runs a model checker, a proof, or another verifier against the code" — an existing ad-hoc formal check that is not a skill does not satisfy it.

### `skills/poteto-help/SKILL.md` — state checks and table

| Line | Quote | Class |
|---|---|---|
| 28 | "No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/create-verification-skill` when the question is about proving a change works." | contextual mention |
| 29 | "No formal verification skill in the project means no property is checked past what tests reach. Mention `/create-formal-verification-skill` when the question is about a race, an invariant, or another case tests rarely hit. When one exists and the code it covers changed after the commit it records as last in sync, mention `/maintain-formal-verification-skill` if the question touches that code." | contextual mention |
| 39 | "Then it offers once each to generate a verification skill and a formal verification skill for the project, unless the project already has one." | contextual mention (describes the setup offer) |
| 87 | "\| Give agents a scripted way to drive the app and prove behavior \| [`/create-verification-skill`](../create-verification-skill/SKILL.md) \|" | contextual mention |
| 88 | "\| Bring a verification skill and its feature map back in line with the app \| [`/maintain-verification-skill`](../maintain-verification-skill/SKILL.md) \|" | contextual mention |
| 89 | "\| Formally verify a race, invariant, or other property that tests rarely reach \| [`/create-formal-verification-skill`](../create-formal-verification-skill/SKILL.md) \|" | contextual mention |
| 90 | "\| Bring a formal verification back in line after the code it covers changed, and learn whether a failure is drift or a bug \| [`/maintain-formal-verification-skill`](../maintain-formal-verification-skill/SKILL.md) \|" | contextual mention |

Line 25 frames the whole block: "Check the state that changes the answer, and mention it only when it does". Line 28's gate is the same one step 7 uses. Line 29 adds a *staleness* condition step 8 never checks — "changed after the commit it records as last in sync" — which routes an existing formal verification to its maintainer rather than offering a new one.

`skills/poteto-help/references/recipes.md:37` adds a contextual mention in example form: "`/create-formal-verification-skill prove <property> holds in <module>, even when <steps> interleave or retry.` After merges or refactors in that code: `/maintain-formal-verification-skill`." That single line is both a contextual mention and a create-to-maintain handoff.

### `docs/guide/01-setup.md` — the offer, written for a human

| Line | Quote | Class |
|---|---|---|
| 33 | `## Accept the verification offers, or don't` | setup offer (documented) |
| 35 | "At the end of setup, `/setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`]." | setup offer (documented) |
| 37 | "Say yes and it writes `.cursor/skills/verify-<app>/` … It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time." | setup offer (documented) |
| 41 | "Then setup offers once to generate a formal verification skill with [`/create-formal-verification-skill`], unless the project already has one." | setup offer (documented) |

Line 37 names the escape hatch explicitly — "You can run `/create-verification-skill` yourself any time" — which is what makes declining low-cost.

### `docs/guide/06-verify-and-ship.md` — the how-to, all human-invoked

| Line | Quote | Class |
|---|---|---|
| 51 | `## Create a project verification skill` | contextual mention |
| 53 | "The UI bullet above hides a real requirement. The agent needs a scripted way to drive your app. If your project has one, great. If not, run:" | contextual mention |
| 63 | "From then on, 'verify it in the app' is a step any agent can execute, in this repo, with no setup conversation. Name it in the prompt when you want the proof in a specific form:" | contextual mention |
| 66 | `/poteto-mode build the bulk-archive action. use /verify-<app> to verify your changes and show me a video and screenshots as proof.` | contextual mention (user names the artifact) |
| 70 | `/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.` | contextual mention (user names the artifact) |
| 73 | "Once the verify skill works, a [`/swarm`] can split a full pass by feature-map entry and aggregate the results." | contextual mention |
| 88 | "Apps change, and feature maps go out of date. Run this at least once a day, ideally from a scheduled automation so nobody has to remember:" | create-to-maintain handoff |
| 91 | `/maintain-verification-skill` | create-to-maintain handoff |
| 94 | "…audits the generated skill: one read-only source reader per feature in parallel, then one live pass that drives every mapped feature." | create-to-maintain handoff |
| 98 | "A verification skill proves the paths you drive. Some bugs live on paths nobody drives: two retries that overlap, a lock that expires mid-write, a state change that arrives out of order." | contextual mention |
| 101 | `/create-formal-verification-skill` | contextual mention |
| 116 | "After them, run [`/maintain-formal-verification-skill`]. It updates the verification from the code, reruns it, shows that each updated check can still fail, and tells you whether each failure is drift in the verification or a bug in the code." | create-to-maintain handoff |

None of these is a setup offer: each is the guide telling the reader to type the command now. Line 66 and line 70 are the closest thing to an in-playbook capability, and they are not one — the *user* names `/verify-<app>` in the prompt; the playbook does not.

### `docs/guide/09-make-it-yours.md`

| Line | Quote | Class |
|---|---|---|
| 62 | "Two special cases have their own generators. A skill that must drive your app and prove behavior is a verification skill, so use [`/create-verification-skill`] and [`/maintain-verification-skill`] instead. A skill that checks a property of your code with a model checker, a proof, or another verifier is a formal verification skill, so use [`/create-formal-verification-skill`] and [`/maintain-formal-verification-skill`]." | create-to-maintain handoff |

This is the page's guardrail against freehand authoring (`10-recipes-and-pitfalls.md:176` repeats it). It couples each generator to its maintainer in one sentence, twice.

### `docs/guide/10-recipes-and-pitfalls.md`

| Line | Quote | Class |
|---|---|---|
| 79 | `## Repro and fix a report with proof` | contextual mention |
| 82 | `/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.` | contextual mention |
| 87 | `## Prove a property tests rarely reach` | contextual mention |
| 90 | `/create-formal-verification-skill the retry queue. a message must never be delivered twice.` | contextual mention |
| 93 | "You get one property checked in every case within a stated scope, a counterexample in your code's terms if the code already breaks it, and a project skill the next agent runs on any change to that code." | contextual mention |
| 169 | "**Looping before you trust the loop.** A loop that can't verify its own work only makes unchecked work faster. Get the verification skill working first." | contextual mention (prerequisite) |

Line 169 is the strongest stated dependency anywhere outside setup, and it still does not name a skill or a playbook — it makes the verification skill a precondition for *trusting a loop*, not a step in one.

### `skills/automate-me/SKILL.md`

| Line | Quote | Class |
|---|---|---|
| 43 | "- Verification posture (what 'done' means, unit tests vs live repro, reviewers)" | contextual mention (mining signal) |
| 67 | "- **Review and verify**: repro posture, verification skills, live-testing tools." | contextual mention (section template) |

`automate-me` treats verification as *evidence about the user*, never as a capability to install. It never names one of the four. Its output is a `-mode` skill; it does not create or offer a verification skill.

### `README.md`

| Line | Quote | Class |
|---|---|---|
| 35 | "\| `create-verification-skill` \| `maintain-verification-skill` \|" | create-to-maintain handoff |
| 36 | "\| `create-formal-verification-skill` \| `maintain-formal-verification-skill` \|" | create-to-maintain handoff |
| 88 | "new here? the [pstack guide] walks you through a first real task, from setup and prompting through verification and overnight runs." | contextual mention |
| 199 | "\| [`/create-verification-skill`] \| your project has no scripted way to prove app behavior. generates a project-local verify skill with a feature map, for any language or platform. \|" | contextual mention |
| 200 | "\| [`/maintain-verification-skill`] \| your verify skill's feature map has drifted from the app. source wave + one live pass, at most one PR of proven corrections. \|" | contextual mention |
| 201 | "\| [`/create-formal-verification-skill`] \| tests can't reach the case that breaks a race, retry, state machine, parser, or unsafe code. verifies one property with the tool that fits and generates a project-local skill to recheck it on every change. \|" | contextual mention |
| 202 | "\| [`/maintain-formal-verification-skill`] \| code your formal verification covers has changed since it was last checked. updates the model, harness, or properties to match the code, reruns, and says whether each failure is drift in the verification or a bug in the code. \|" | contextual mention |

Lines 35-36 sit under the heading "Some skills call other skills. Install these together" (`README.md:26`), so the pairing is an *install* dependency, not a runtime one: the maintainer is named so the pair installs together, not because the generator calls it. `create-verification-skill/SKILL.md:44` points at the maintainer only as a closing suggestion ("Suggest a cadence only if they ask"), and `maintain-verification-skill/SKILL.md:25` points back ("none → stop and point at `/create-verification-skill`"). That is a soft handoff in both directions, not an invocation.

### Role prompts and playbooks

Neither `agents/poteto-agent.md` nor `agents/comment-sicko.md` contains a hit. `poteto-agent.md:9` instructs the subagent to "Read the `poteto-mode` skill's `SKILL.md` in full", so it inherits the absence recorded below. There is no `codex-agents/` directory in this mirror.

`skills/poteto-mode/SKILL.md:64` has a section headed `**Verification**`, but its five bullets are principle skills (`Prove It Works`, `Fix Root Causes`, `Sequence Work into Verifiable Units`, `Test Behavior, Not Implementation`, `Explain the Number`). No verification *skill* is named.

## Does any poteto-mode playbook require either skill?

**No.** Not one of the 23 playbooks requires, invokes, or names any of the four. The **in-playbook capability** class is empty for all four skills.

Search run from `/home/jason/projects/pstack`:

```
grep -rnE "create-verification-skill|maintain-verification-skill|create-formal-verification-skill|maintain-formal-verification-skill" .
```

Repo-wide, every hit is one of: `docs/guide/01-setup.md:35,37,41`, `docs/guide/06-verify-and-ship.md:56,59,61,91,94,101,104,107,116`, `docs/guide/09-make-it-yours.md:62`, `docs/guide/10-recipes-and-pitfalls.md:90`, `README.md:35,36,199,200,201,202`, `skills/setup-pstack/SKILL.md:80,84`, `skills/poteto-help/SKILL.md:28,29,87,88,89,90`, `skills/poteto-help/references/recipes.md:37`, or a file belonging to one of the four skills themselves. **Zero hits under `skills/poteto-mode/` and zero under `agents/`.**

Two follow-up searches confirm the absence is not an alias problem:

```
grep -rniE "verification|verify-|formal verif" skills/poteto-mode   # 31 hits, none names a verification skill
grep -rniE "verif|prove|formal" agents                              # 2 hits, both "proven" in comment-sicko prose; none in poteto-agent.md
```

The first returns verification *concepts* (the `**Verification**` principle bucket, a `## Verification` PR-body section in `opening-a-pr.md:20`, a verification ledger in `orchestrate.md:29`, `verify-recent-chat` as a worktree-cleanup bucket at `worktree-cleanup.md:5`). None is one of the four skills.

**The nearest thing to a requirement, and why it is not one.** The Multi-phase plan playbook mandates live proof but never names a tool:

> "**Verification.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked (the **prove-it-works** principle skill). That sentence is the verification rule." — `skills/poteto-mode/playbooks/multi-phase-plan.md:13`

> "**Verify, live.** … Ten lanes on `<swarm workers model>` at the PR head, per the boot recipe." — `multi-phase-plan.md:100`

Its validator enforces the shape, not the capability: `skills/poteto-mode/scripts/check-plan.mjs:6` holds the same rule string, and line 7 requires the literal phrase `Ten lanes on … at the PR head`, with any model name. A plan can pass with hand-written Playwright scripts, a control CLI, or no harness at all — the boxes must exist and name evidence, but nothing checks *how* the lane drives the app. So pstack requires the **outcome** the verification skill produces while refusing to require the **skill** that produces it.

**Contrast that proves the wiring is a choice.** `docs/guide/06-verify-and-ship.md:49` says "`/poteto-mode` already runs the checklist inside the Perf issue and Hillclimb playbooks" about `/benchmark-checklist`. pstack does put capabilities inside playbooks when it wants to. It did not do so for the four verification skills.

**How a verify skill actually enters a run.** Only two ways, both human: the user types `/verify-<app>` in the prompt (`06:66`, `06:70`, `10:82`), or the user invokes the generator directly. There is no mode-level path.

## The offer mechanism, as four rules

1. **Setup is the only offer surface.** Steps 7 and 8 of `/setup-pstack` are the only places that ask. Every other mention is routing text.
2. **The gate is project state, not user profile.** "Check whether the project has a way to drive the real app for proof" (`setup-pstack:80`). No question about experience, intent, or repo size. The absence of a `verify-*` skill *is* the trigger.
3. **One offer, no push, no persistence.** "offer once" and "On no, move on without pushing" appear in both steps. Nothing records a decline; nothing re-offers next session. The state check is re-derivable, so memory is unnecessary — but a user who declines and later changes their mind is only re-offered on the next `/setup-pstack` run.
4. **Creation is paired with maintenance.** The guide tells you to run the maintainer "at least once a day, ideally from a scheduled automation" (`06:88`), and the README lists each generator with its maintainer as an install pair (`README:35-36`). The maintenance loop is not offered at setup; only the generator is.

## Value and cost framing, quoted

The value claim is unusually direct:

> "If you're new to pstack, say yes. An agent that can check its own work keeps going until the check passes. An agent that can't hands every result back to you to check by hand. Of everything in this guide, the verification skill pays off the most." — `docs/guide/01-setup.md:39`

The mechanism behind that claim:

> "Verification is the slowest step in most agent work, because it's the step that usually waits on a human. Make the agent able to do it, and you stop being the bottleneck. Skip it, and running more agents only gets you more unchecked work to review." — `docs/guide/06-verify-and-ship.md:5`

The formal offer carries its own qualifier — the concurrency/parser caveat:

> "Tests check the cases someone thought to write. A formal verification skill checks one key property of your code, such as 'a job never runs twice at once', in every case within a stated scope. Say yes when your code has concurrency, retries, a state machine, or a parser, where a bug is costly and tests rarely reach the case that breaks. Otherwise say no, and run it later if that changes." — `docs/guide/01-setup.md:41`

Note the shape: the app offer says "say yes" to a newcomer; the formal offer says "say no" unless the code has one of four named traits. The two offers do not share a default.

Cost is framed as a separate, general budget concern, not as a cost of verification:

> "pstack spends extra tokens on subagents and review panels. That's the price of the rigor. To spend fewer: …" — `docs/guide/01-setup.md:47`, followed by rerunning setup at a smaller budget, `auto`/`inherit-parent` roles, shorter panel lists, and saving `/poteto-mode` for work that needs rigor (`01:49-52`).

The guide never prices the verification skills. Its only cost-side warning is a sequencing pitfall: "A loop that can't verify its own work only makes unchecked work faster. Get the verification skill working first." (`10:169`). So the offer is justified by payoff and gated by project state, with no cost estimate to weigh against it.

## What the record supports for start-dev

- **Copy the shape, not the wording.** State gate → one sentence naming the artifact → invoke on yes → explicit "you can run this yourself any time" → stop. The decline path is what keeps a one-time offer from feeling like a nag.
- **Decide the gate deliberately.** pstack widens the app gate to "a `verify-*` skill **or** an existing harness" and narrows the formal gate to "a project skill that runs a model checker, a proof, or another verifier". A start-dev equivalent needs the same explicit answer for each: is a non-skill harness enough?
- **Persistence is the open design question.** pstack has none. That works because the gate is cheap to re-check and `/setup-pstack` is re-runnable. If start-dev's gate is ambiguous or setup runs once per project lifetime, "offer once" silently becomes "offer never".
- **Do not expect a playbook to carry the offer.** In pstack the mode is a consumer of the artifact, never a producer or a requirement. If start-dev wants in-playbook use, that is new design, not a port — pstack's only comparable wiring is `/benchmark-checklist` inside Perf issue and Hillclimb (`06:49`).
- **Pair create with maintain in the install docs, but do not offer maintenance at setup.** pstack offers only the generators; the maintenance cadence is documentation and a scheduled automation.

## Evidence limits

- The mirror is at `e44668c`, 2026-10-20. Upstream pstack may have moved; this record describes the mirror, not `backnotprop/pstack` HEAD.
- Nothing here was executed. The analysis is textual: file contents plus `grep`. No offer was run against a live harness, so the *behavior* of the state checks (what counts as "an existing harness", how the agent detects a `verify-*` skill) is as written, not as observed.
- The repo contains no usage data, so acceptance rate, re-offer behavior after a decline, and whether users actually run the maintainer daily are unknown and not inferable from these files.
- `research/` is a new directory; the repo had no prior convention for research artifacts (`git ls-tree -r origin/main | grep '^research/'` returns nothing). This file establishes the location.
