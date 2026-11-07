# UI/UX principle-skill survey: candidates for a design-reference slot in this pack

**Question.** Which principle-style UI/UX skills could guide an agent or a user the way this pack's `principle-*` skills guide coding? For each candidate: what principles it covers, its structure (router / shared reference / checklist / scoring), its license verified from the source repo, a quality verdict, and its fit — which scenario branch of the prototype rework it feeds (design-doc→UI, redline/polish, UI variants) and whether it matches our principle-skill pattern. Ends with a shortlist ranked for ticket 06's adoption decision.

**Source of truth.** One canonical repo per candidate, verified by reading the files themselves. Where the ticket's URL is stale or the repo is gone, that is recorded as a finding, not papered over.

| # | Canonical source | Path read | License (verified in-repo) | Stars / last push |
|---|---|---|---|---|
| 1 | `blink-new/claude` | `skills/ux-design-principles/SKILL.md` + `text/*.md` | **Unverifiable — repo unreachable** (see §1) | n/a (404) |
| 2 | `wondelai/skills` | `ux-heuristics/SKILL.md`, `refactoring-ui/SKILL.md`, `web-typography/SKILL.md`, `references/*` | MIT (root `LICENSE`: "MIT License / Copyright (c) 2025 Wondel.ai sp. z o.o."; each skill frontmatter also says `license: MIT`) | 2,619 / 2026-11-02 |
| 3 | `the-vibey-project/vibey` | `src/vibey_tools/skills/plugins/ui-ux-design-principles/**` | MIT (GitHub API `license.spdx_id = MIT`; repo root `LICENSE`) | 3 / 2026-11-06 |
| 4 | `carmahhawwari/ui-design-brain` | `SKILL.md`, `components.md`, `LICENSE.txt` | MIT by file content (`LICENSE.txt`, "Copyright (c) 2026 UI Design Brain Contributors"); **GitHub API reports `NOASSERTION`** | 906 / 2026-02-28 |
| 5 | `Owl-Listener/designer-skills` | `interaction-design/skills/*/SKILL.md`, `ui-design/skills/*/SKILL.md`, `ux-strategy/skills/design-principles/SKILL.md`, root `LICENSE`, `INDEX.md` | MIT (root `LICENSE`: "MIT License / Copyright (c) 2026 MC Dean") | 3,276 / 2026-09-05 |
| 6 | `keysjoao/laws-of-ux-skills` | `laws-of-ux/SKILL.md`, `laws-of-ux-review/`, `laws-of-ux-checklist/`, `references/*` | MIT (root `LICENSE`: "MIT License / Copyright (c) 2026 keysjoao"); **but** the upstream law text it cites, `lawsofux.com`, is **CC BY-NC-ND 4.0** | 22 / 2026-05-08 |
| S | `GoogleChrome/modern-web-guidance` — **separate classification, not a ranked candidate** | installed copy: `skills/modern-web-guidance/SKILL.md` (136 lines) + `guides/` (193 files, 17 categories) + `plugin.json`; upstream `github.com/GoogleChrome/modern-web-guidance` | Apache-2.0 (local `LICENSE` = full Apache-2.0 text; `plugin.json` `"license": "Apache-2.0"`; `kimi.plugin.json` same) | v0.0.196 (`plugin.json`) / v0.0.197 (`kimi.plugin.json`) |

Candidate **S** was added to the ticket after the first six were surveyed. It is read from the local install at `/home/jason/.kimi-code/plugins/managed/modern-web-guidance/` — no network was used for it.

**Method.** `gh api` for repo metadata, licenses, and recursive git-tree listings; `raw.githubusercontent.com` reads for every file quoted below; `FetchURL` for the one page whose repo had vanished; `mcp__zread__get_repo_structure` as a cross-check on that same repo (it also returned "repo not found"). No upstream code was executed. Local grounding — `skills/principle-*/SKILL.md`, `skills/prototype/SKILL.md`, `skills/prototype/UI.md`, `skills/poteto-mode/playbooks/prototype.md`, `skills/how/SKILL.md`, `LICENSE`, `references/` — was read read-only from the main checkout.

## The answer in one paragraph

None of the six is a drop-in `principle-*` skill, but three are worth adopting, and they cover three different jobs. **`Owl-Listener/designer-skills`** (MIT) is the only candidate whose *shape* is already our principle shape: one law per short file (31–73 lines), frontmatter `{name, description}` with a sibling cross-link in the description, `The Principle` → `What It Does Not Cover` → `Common Design Applications` → `Best Practices`. Copy that shape and substance for the new design principles. **`wondelai/skills`** (MIT) has the best *content* for the two jobs our branches need most: a scored audit rubric (`ux-heuristics`, 10/10 across a 10-row diagnostic, plus a 0–4 severity scale) and a constrained craft set (`refactoring-ui`, grayscale-first, 4/8/16/24/32/48/64 spacing, 12→36 type scale) — but it is far too big to be a principle file, so it belongs in branch reference material. **`the-vibey-project/vibey`**'s `ui-ux-design-principles` plugin (MIT) is the most epistemically careful source of the six (every claim tagged `[DURABLE]` / `[PLATFORM]` / `[CONTESTED]`, contested questions answered on both sides, a dated currency snapshot) and it is the only one organised as "one shared reference split into named skills" — which is exactly our `skills/how` + `skills/how/references` idiom — so it is the natural *shared reference* to cite from the branch files. `keysjoao/laws-of-ux-skills` contributes one transferable *shape* only (a 12-point binary pre-ship checklist read against the real code — the redline branch's missing gate) because its content sits on a CC BY-NC-ND upstream. `blink-new/claude` is **gone** — GitHub API, `raw.githubusercontent`, plain `curl`, `zread`, and the Wayback Machine all fail on it, and no license can be verified, so it cannot be a dependency; its most valuable idea (a vocabulary of BAD/GOOD phrasing pairs for describing UI changes to an AI) survives in `valewnrt/design-skills` (MIT, with an explicit `CREDITS.md`). `carmahhawwari/ui-design-brain` is a component catalogue with taste presets, not a principle reference; it is optional crib material for design-doc→UI and nothing more.

A seventh item, **`GoogleChrome/modern-web-guidance`** (Apache-2.0, official Google Chrome), arrived in the ticket afterwards and is **classified separately, not ranked**: it is a *retrieval tool*, not a principle reference. Its role for the prototype rework is that of an **already-installed consulted skill** — its description mandates running it first for any HTML/CSS/client-side-JS task, so every UI-producing branch consults it before generating — and its *disciplines* (mandatory-first lookup; per-id disclosure that quotes the rule it applied) are patterns our gates should copy. Nothing in it is adopted, vendored, or re-licensed; see §7.

## The target pattern we are matching

Read from the pack, read-only.

- **Granularity and size.** All 24 `principle-*` skills are single files of **21–34 lines** (`principle-outcome-oriented-execution` 21 → `principle-boundary-discipline` 34). There is **no `references/` directory** under any `principle-*` skill — depth, when needed, is reached by linking to another principle (e.g. `principle-attack-the-premise` cites `../principle-build-the-lever/SKILL.md`, `../principle-fix-root-causes/SKILL.md`, `../principle-laziness-protocol/SKILL.md`).
- **Frontmatter.** `name` + `description` + `disable-model-invocation: true`. The description is written as a *trigger condition*, not a topic list: "Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase."
- **Body shape.** A one-line thesis, then optional `**Why:**` (reason, not restatement), then the rule list, then a named test/stop condition. `principle-prove-it-works` is the fullest example: thesis → `**Why:**` → `## The iron law` → bullets → a "check the real thing, not a proxy" list → attribution line.
- **Attribution.** Vendored or adapted material carries an inline credit: `principle-prove-it-works` ends "Adapted from superpowers' `verification-before-completion`, MIT, Jesse Vincent." The repo `LICENSE` carries an "Includes portions copyright …" line; `vendor-manifest.txt` is scoped to pstack paths only, so a non-pstack derivative needs its own inline credit and (if text is copied) an adjacent license copy.
- **Router + shared reference idiom.** `skills/how/SKILL.md` + `skills/how/references/{explorer-prompt,explainer-prompt}.md` is the pack's other pattern: a short router that decides and points into shared reference files. `skills/prototype/SKILL.md` is a router with two branch files (`LOGIC.md`, `UI.md`).
- **The gap.** No principle supplies *design knowledge*. `principle-experience-first` gestures at it ("Get the details right (transitions, alignment, spacing, feedback, error states)") and `principle-exhaust-the-design-space` names UI interaction, but neither tells an agent what a good spacing scale or a good error state is. That is the hole this survey is for.

## 1. `blink-new/claude` — `ux-design-principles`

**Reachability (a finding, not an obstacle to the survey).** As of 2026-11-07 the upstream repo does not resolve by any route tried:

- `gh api repos/blink-new/claude` → `{"message":"Not Found"}`; `gh api repos/blink-new/claude/git/trees/main?recursive=1` → 404.
- `raw.githubusercontent.com/blink-new/claude/main/skills/ux-design-principles/SKILL.md` → 404; `raw.githubusercontent.com/blink-new/claude/main/README.md` → 404.
- plain `curl https://github.com/blink-new/claude` → HTTP 404 (repo root, `/blob/main/skills/…`, and `/tree/main/skills`).
- `mcp__zread__get_repo_structure` → `{"msg":"target not found, error: repo not found"}`.
- Wayback: `archive.org/wayback/available` → `{"archived_snapshots":{}}`; the CDX query for `github.com/blink-new/claude*` returns nothing.
- `gh api users/blink-new/repos` lists `blink-plugin, browser-mcp, e2b-dashboard, hermes-agent, hyperframes, openclaw` — no `claude`, and no `ux-design-principles` path inside any of them.

The skill text is still readable through a web-page fetch of `github.com/blink-new/claude/blob/main/skills/ux-design-principles/SKILL.md` (the fetch layer serves it; a control fetch of a non-existent sibling path returns 404, so the render is not a blanket success page). The marketplace listing at `mcpfield.com/en/skills/ux-design-principles` reproduces the same content and still advertises `npx skills add https://github.com/blink-new/claude --skill ux-design-principles` — an install line that can no longer work. Conclusion: the repo was deleted, renamed, or made private after the search index captured it (the search index dated the file 2026-01-23).

**License.** Unverifiable from the source, because there is no reachable source. Nothing in the cached page states a license, and the frontmatter carries no `license:` field. Derivatives that exist are not the original and cannot license it: `majiayu000/claude-skill-registry` (MIT, 717★) keeps a pointer page and a snapshot in its data repo; `kayaman/skills` (CC0-1.0, 3★) carries a copy; `databricks-solutions/consort`, `mmccalla/coding-agent-skill-library`, `Wongsodillon/Warp-Frontend`, and others mirror it. **A skill with no verifiable license and no reachable upstream cannot be adopted into a MIT pack.**

**What it covers.** One governing rule ("When a user does anything, there should be a response"), a chapter map of eleven topics (Affordances & Signifiers; Visual Hierarchy; Grids, Layouts & Spacing; Typography; Color Theory; Dark Mode; Shadows; Icons & Buttons; Feedback & States; Micro-interactions; Overlays), ten numbered "design laws" (every interaction needs a response; contrast creates hierarchy; whitespace is design; color carries meaning; one font is enough; match icon size to line-height; if the shadow is the first thing you notice it's too strong; images always improve hierarchy; dark mode = lighter surfaces for elevation; linear gradient beats solid overlay), and an "For Engineers: How to Talk to AI Assistants" section of BAD/GOOD phrasing pairs. Bundled `text/` holds 13 files: `affordances-signifiers, color-theory, dark-mode, engineering-rules, feedback-states, glossary, grids-layouts-spacing, icons-buttons, micro-interactions, overlays, shadows, typography, visual-hierarchy`.

**Structure.** Router (chapter map + deep-dive links) + shared reference files, with a glossary. That is our `how`/`why` idiom, and it is the same "one shared reference split into named files" move as candidate 3.

**Quality verdict.** Good vocabulary, thin reasoning. The source is credited in the file itself: "Every UI/UX Concept Explained in Under 10 Minutes" — Kole Jain (March 2026, 138K views). The rules are useful and opinionated; they are not argued, and several are taste ("images always improve hierarchy"). The most transferable part is the engineering-rules section — concrete phrasing for describing UI changes to an AI assistant, which is precisely the vocabulary our branch files lack.

**Fit.** redline/polish (feedback states, micro-interactions, dark mode, shadows) and UI variants (4-point grid, 32px between top-level sections). Not design-doc→UI: it says nothing about turning a document into an interface.

**Principle-pattern match.** Shape: yes (router + reference). Content granularity: no (eleven topic files, not one principle each). License: no.

**Legal-clean sibling.** `valewnrt/design-skills` (MIT, 2★) is an original synthesis from the same video set, with a `CREDITS.md` that names the written and video sources and states "No source text is reproduced here." If we want this material, that is the citable source — with its own attribution obligations.

**Marketplace derivatives noted.** MCP Field hosts the full content (install line dead). The Grade-A class of derivative the ticket mentions appears elsewhere: `skillsdirectory.com/skills/flagrare-design-review` is listed **Grade A** and explicitly rides on "design principles", "heuristics" and "the Refactoring UI playbook" — i.e. it is a derivative of candidate 2's family, not of this one.

## 2. `wondelai/skills` — `ux-heuristics`, `refactoring-ui`, and the design-relevant subset

**Repo shape.** 50 skills; each is a `SKILL.md` plus a `references/` directory. The repo root holds the skill directories, and `.claude/`, `.agents/`, `.cursor/`, `.pi/`, `.windsurf/` are symlink farms onto them; the same skills are republished as marketplace plugins `plugins/ux-design` and `plugins/wondelai-skills`. Root `LICENSE`: MIT, "Copyright (c) 2025 Wondel.ai sp. z o.o." Each skill's frontmatter independently declares `license: MIT` and a version (`ux-heuristics` 1.6.0, `refactoring-ui` 1.5.1).

**`ux-heuristics` — principles covered.** Krug's three laws of usability plus the Trunk Test as a fourth: (1) Don't Make Me Think, (2) It Doesn't Matter How Many Clicks, (3) Get Rid of Half the Words, (4) The Trunk Test. Then Nielsen's ten heuristics in full (visibility of system status; match between system and real world; user control and freedom; consistency and standards; error prevention; recognition rather than recall; flexibility and efficiency of use; aesthetic and minimalist design; help users recognize, diagnose and recover from errors; help and documentation). Then a 0–4 severity scale (0 not a problem → 4 catastrophic; weighted by frequency, impact, persistence), a 15-row "Common Mistakes" table, a 10-row "Quick Diagnostic" table, a "Heuristic Conflicts" resolution table (simplicity vs flexibility, consistency vs context, efficiency vs error prevention, discoverability vs minimalism), and dark-pattern recognition.

**`ux-heuristics` — structure.** Scoring skill with a hard target: "**Goal: 10/10.** Audit the interface, rate every issue on the severity scale below, then score the interface from its Quick Diagnostic results: start at 10 and subtract per failed diagnostic row, weighted by the worst severity it triggers… Always state the current score, the highest-severity issues, and the specific fixes needed to reach 10/10." Depth sits in seven on-demand references: `audit-template, cultural-ux, dark-patterns, heuristic-conflicts, krug-principles, nielsen-heuristics, wcag-checklist`. This is router-plus-references with a scoring spine — the closest existing thing to our principle-plus-playbook coupling.

**`refactoring-ui` — principles covered.** Seven: (1) Visual Hierarchy (size/weight/colour as three levers — combine, don't multiply), (2) Spacing & Sizing (constrained scale 4/8/16/24/32/48/64; start with too much white space then remove; constrain width to 45–75 characters), (3) Typography (modular scale 12/14/16/18/20/24/30/36; tight heading line-height 1.0–1.25, relaxed body 1.5–1.75; two fonts max), (4) Color (5–9 shades per colour; darkest `#111827` not `#000000`; tint greys; 4.5:1 body / 3:1 large contrast), (5) Depth & Shadows (shadow scale, two-part shadow, transparent-not-gray shadow colour), (6) Images & Icons, (7) Layout & Composition. The governing idea: "Design in grayscale first. Add color last."

**`refactoring-ui` — structure.** Same shape as `ux-heuristics`: a "Core Principle", a "**Goal: 10/10**" scoring rule computed mechanically (`score = round(satisfied / 8 × 10)` over an 8-row Quick Diagnostic), a "Common Mistakes" table, and five references (`accessibility-depth, advanced-patterns, animation-microinteractions, data-visualization, theming-dark-mode`).

**The design-relevant subset of the 50.** Roughly a third is design/UX-adjacent: `ux-heuristics`, `refactoring-ui`, `web-typography` (SKILL.md + 5 references: `css-implementation, evaluating-typefaces, pairing-strategies, responsive-typography, typeface-anatomy`), `ios-hig-design`, `top-design`, `design-code-architecture`, `hooked-ux`, `lean-ux`, `microinteractions`, `conversion-optimization`, `cro-methodology`, `design-sprint`, `design-everyday-things`, `steve-jobs-design-review`, `create-website`, `create-app`, `improve-website`, `improve-app`, `improve-retention`, `37signals-way`. The rest are business/product books (Blue Ocean, Good Strategy, High Output Management, …) — out of scope for this ticket.

**Quality verdict.** Highest craftsmanship of the six for the job it does. Each rule carries "Why it works", a table of product applications with concrete examples, and — unusually — an **ethical boundary** per rule ("Clarity should serve users — never use plain language as a veneer to hide unfavorable terms"; "Never use extra steps to bury cancellation flows"). The scoring is mechanical and reproducible from the stated diagnostic rows, not vibes. Two cautions: (a) the content is a book distillation — Krug, Nielsen, Wathan & Schogo — so the *prose* is wondelai's MIT but the *ideas* are theirs; adopting wondelai's prose is safe, lifting the books' prose is not. (b) The scoring target "10/10" invites grade inflation when the diagnostic is eight yes/no questions. The **shape** — "read the artifact, answer N fixed questions, subtract per failure, state the score and the fixes" — is directly reusable and matches our `principle-prove-it-works` ethos.

**Fit.** redline/polish: the strongest match of the six — `ux-heuristics` is an audit with a severity scale and a fix list, `refactoring-ui` is a fix method with constrained scales. UI variants: both skills supply the *shared floor* that makes variants differ structurally rather than cosmetically (spacing scale, type scale, one hierarchy per screen). design-doc→UI: weak; no document-to-interface pipeline.

**Principle-pattern match.** Content yes, shape no: each skill is a 250–400-line reference with seven references behind it, whereas our principles are 21–34 lines with no reference dir. Adopt as branch reference material, not as `principle-*` files.

## 3. `the-vibey-project/vibey` — the `ui-ux-design-principles` plugin

**Canonical location.** `the-vibey-project/vibey` (MIT per GitHub API, 3★, pushed 2026-11-06). The family is a plugin at `src/vibey_tools/skills/plugins/ui-ux-design-principles/` with `.claude-plugin/plugin.json` (`name: ui-ux-design-principles`, `version: 0.1.0`, author Adam Matthew Steinberger). It is mirrored into `docs/microslices/skills/ui-ux-design-principles/` as numbered slices. The plugin's own README states the design: "One reference, split into 5 skills along its section groups so a task loads only the part it needs."

**The five skills and their section ranges.**

| Skill | § | Covers |
|---|---|---|
| `ui-ux-cognition-heuristics-and-navigation` | §0–§3 | Routing; form-factor comparison (mobile/tablet/web/desktop); motor control (Fitts, Steering); decision and attention (Hick–Hyman, Miller); Gestalt; learning and expertise; Nielsen's 10 with failure modes; Norman's model (affordances, signifiers, the gulfs); confirmation vs undo; progressive disclosure and defaults; IA questions; navigation patterns; search; wayfinding |
| `ui-ux-interaction-layout-and-visual-design` | §4–§6 | Input and interaction per form factor; layout, responsiveness, adaptation (incl. foldables); visual design — typography, colour, spacing, elevation, iconography, motion |
| `ui-ux-design-systems-platforms-and-accessibility` | §7–§9 | Design systems and tokens; platform conventions (Apple HIG, Material 3, GNOME/KDE, Fluent); accessibility — principles, WCAG 2.2/3.0, EAA, ADA Title II, APCA |
| `ui-ux-writing-forms-research-and-ethics` | §10–§14 | Content and UX writing; forms, onboarding, conversion; research and evaluation (metrics, HEART, sample size); ethics, persuasion, dark patterns, regulation; AI-era interfaces |
| `ui-ux-reference` | §15–§20 | Anti-patterns table; contested questions; currency snapshot (verified August 2026); the canon; quick reference; sources and method |

**Structure.** A router inside §0 ("The question router" — a table mapping the ask to a section and, where needed, to a sibling skill) plus one shared reference with **shared § numbering** across the set; cross-skill pointers are written `§N → skill`. Three claim-durability markers are used throughout: `[DURABLE]` (grounded in perception/cognition/motor control or replicated research — "Does not expire. Trust it."), `[PLATFORM]` (a vendor convention — "Verify against the current HIG; these change."), `[CONTESTED]` ("competent practitioners disagree… Both cases given."). `⚠️ GOTCHA` boxes mark the mistakes that "survive design review and get caught in production, in court, or in the analytics." A dated currency snapshot flags what goes stale first. Every skill opens with the same framing sentence: "an interface is a *proposal about how a person should think*."

**Quality verdict.** The most rigorously sourced of the six, and the only one that argues against its own conclusions. Examples quoted from the source:

- On Hick: "**⚠️ Misuse:** 'Hick's Law says fewer menu items are always better' — false… **Categorization beats reduction.**"
- On Miller: "**Miller's '7±2' [DURABLE finding, WIDELY misapplied]**" and, in the anti-pattern table, "Quoting '7±2' as a menu-length rule → Miller said no such thing."
- On APCA vs WCAG 2, on hamburger menus, on disabled submit buttons, on design-system centralisation, on "UX = UI still holds", on A/B testing vs qualitative research: contested questions answered with both sides and a stated direction.
- The anti-pattern table (§15) is a 30-row do/don't list with a reason and a replacement for each row.

Cautions: one author, very low adoption signal (3★), and the §-coupling means a single section cannot be lifted without carrying the numbering convention or re-anchoring the cross-references.

**Fit.** design-doc→UI: §4–§6 (visual design, layout), §9 (accessibility), §11 (forms) — the "what principles apply when a document becomes an interface" half of the set. redline/polish: §15 anti-patterns table and §16 contested questions are the review checklist; §17's currency snapshot is the honesty check ("Is this still current?"). UI variants: §0.1's form-factor table and §16.9's design-system-centralisation answer are the parts that decide *where* a variant lives.

**Principle-pattern match.** Half. The "single source of truth that a playbook cites" half matches exactly (a shared reference cited by §, with a router). The "short, named, one principle per file" half does not: the unit is a topic cluster, not a principle. If we adopt it, we adopt it as **one shared reference file plus a pointer**, in the `skills/how` idiom — not as a family of new `principle-*` skills.

## 4. `carmahhawwari/ui-design-brain`

**Shape.** Four files only: `README.md`, `SKILL.md`, `components.md` (the 60+ component reference), `LICENSE.txt`. `SKILL.md` opens with six numbered "Core Principles" (restraint over decoration; typography carries hierarchy; one strong colour moment; spacing is structure — 8px grid; accessibility is non-negotiable; no generic AI aesthetics), a "Quality Bar" (a senior product designer at a top SaaS company), a four-step workflow (identify components → apply best practices → choose a design direction → generate code), a 15-component quick-reference table, and 10 anti-patterns to avoid (rainbow badges, modal inside modal, disabled submit with no explanation, spinner for predictable layouts, "click here" links, hamburger on desktop, auto-advancing carousels, placeholder-only form fields, equal-weight buttons, text under 12px). `components.md` holds the 60+ components with best practices, aliases, and layout examples, sourced from component.gallery.

**Structure.** One opinionated skill plus one large shared reference. No routing, no scoring, no per-concept files.

**License.** The root `LICENSE.txt` is the full MIT text, "Copyright (c) 2026 UI Design Brain Contributors", with a trailing note: "Component data sourced from component.gallery (https://component.gallery). Best practices and layout guidance are original enrichments." GitHub's license detector reports `NOASSERTION` — a detection failure (the `.txt` extension plus the trailing note), not a different license. Treat as MIT, and note the third-party component data explicitly.

**Quality verdict.** Good component craft, prescriptive taste. The numbers are concrete and usable (44px touch targets; 8px grid; toasts auto-dismiss 4–6s with undo for destructive ops; skeletons after a 300ms delay, not spinners; validation inline on blur; one primary button per section; 7±2 dropdown items). The five "style presets" (Modern SaaS, Apple-level Minimal, Enterprise/Corporate, Creative/Portfolio, Data Dashboard) are a usable axis for generating deliberately different variants. But nothing is evidenced — these are house rules, not principles — and the skill is prescriptive about output code ("Stack: React + Tailwind CSS (unless user specifies otherwise)") in a way that fights a pack that must work across stacks.

**Fit.** design-doc→UI: the component-identification step is a decent "what components does this document imply?" pass. UI variants: the style presets are a ready-made variant axis. redline/polish: weak — no scoring, no audit, no severity model.

**Principle-pattern match.** No. It is a component catalogue with a house style, not a principle reference.

## 5. "Designer Skills Collection" → `Owl-Listener/designer-skills`

**Identity.** The ~2.9k-star collection the ticket names is **`Owl-Listener/designer-skills`** — now 3,276★ (MIT, root `LICENSE`: "MIT License / Copyright (c) 2026 MC Dean"; pushed 2026-09-05). The repo's own README: "273 skills and 76 commands across 33 plugins, in five collections", of which the design-practice collection is "111 skills and 34 commands across 9 plugins". `afloresleal/designer-skills` (MIT, 0★) is a fork/derivative, not the original.

**The principle-like subset.** Two families inside `interaction-design` and `ui-design`:

- *Cognitive and motor laws* (`interaction-design/skills/`): `fitts-law`, `hicks-law`, `millers-law`, `jakobs-law`, `doherty-threshold`, `peak-end-rule`, `teslers-law`, `zeigarnik-effect`, `serial-position-effect`.
- *Perceptual laws* (`ui-design/skills/`): `law-of-closure`, `law-of-common-region`, `law-of-continuity`, `law-of-figure-ground`, `law-of-proximity`, `law-of-similarity`, `von-restorff-effect`.
- *Craft references* in the same collections: `visual-hierarchy`, `spacing-system`, `typography-scale`, `color-system`, `dark-mode-design`, `readable-measure`, `responsive-design`, `layout-grid`, `data-visualization`, `platform-conventions`, `aesthetic-usability`, `animation-principles`, `interfaces-that-feel`, `form-design`, `navigation-patterns`, `onboarding-design`, `error-handling-ux`, `feedback-patterns`, `loading-states`, `gesture-patterns`, `state-machine`, `search-ux`, `micro-interaction-spec`, `conversational-ux`, `illustration-style`.
- Separately, `ux-strategy/skills/design-principles/SKILL.md` teaches a team to *author* principles ("title (3–6 words), statement, rationale, application example, counter-example, trade-off"; qualities: opinionated, actionable, memorable, distinctive, testable, prioritized). It is about writing principles, not about design knowledge — a different thing, and the closest thing in this repo to our `principle-*` genre it does not fill.

**Structure — the reason this candidate ranks first.** Each law is one short file with exactly our shape:

```
---
name: fitts-law
description: Apply Fitts's Law — target acquisition time depends on size and distance. Use when sizing and positioning controls, especially for touch. For how many controls to show at once, use `hicks-law`.
---
# Fitts's Law
## What You Do
## The Principle          ← formula + "In plain terms" gloss
### Target Size / Target Distance
### What Fitts's Law Does Not Cover   ← explicit limits
### Common Design Applications        ← table
## Best Practices
```

The description carries a *sibling cross-link in the trigger text* ("For how many controls to show at once, use `hicks-law`"; "For explicit containers, use `law-of-common-region`"), so the set routes itself without a router file. Measured lengths: `hicks-law` 31, `millers-law` 31, `doherty-threshold` 43, `fitts-law` 44, `teslers-law` 60, `zeigarnik-effect` 61, `peak-end-rule` 64, `jakobs-law` 67, `serial-position-effect` 64, `law-of-closure` 73, `law-of-proximity` 36 lines. Compare our 21–34.

The "What It Does Not Cover" section is the tell: it is our `**Why:**` and boundary-discipline idiom, expressed as scope limits — "Cognitive cost: it models motor time, not the time to decide what to tap. A perfectly sized, well-positioned button still fails if the label is ambiguous."

**Quality verdict.** High and consistent. Each law states its formula, its plain-terms gloss, its target sizes (44×44pt Apple HIG / 48×48dp Material), its failure modes, and its limits. The laws are the standard, well-attested set — Fitts, Hick–Hyman, Jakob's, Doherty, Miller, Zeigarnik, Serial Position, Peak-End, Tesler — plus the five Gestalt laws, all with decades of research behind them. The collection does not oversell: `hicks-law` says "the log is cheap", `millers-law` is careful about 7±2, `peak-end-rule` explains duration neglect rather than asserting "end on a high note".

**Fit.** redline/polish: the primary feed — each law is a line item in a redline audit, and the "does not cover" section tells the reviewer where a law stops applying. UI variants: each variant can be held to the same law set, which is exactly the "variants must be structurally different" rule in `skills/prototype/UI.md` given teeth. design-doc→UI: indirect — the laws constrain what a document-to-UI pass may produce (touch targets, contrast, focus), but there is no doc→UI pipeline here.

**Principle-pattern match.** Best of the six, on both shape and granularity. Adopting a named subset as the basis for new `principle-*` design skills is a paraphrase-and-rename job with a credit line, not a rewrite.

## 6. Laws-of-UX pattern skills

**The canonical original is the site, not a repo.** The 30 laws originate at `lawsofux.com` (Kenton Kaji). The site's footer links its licence to `https://creativecommons.org/licenses/by-nc-nd/4.0/` — **CC BY-NC-ND 4.0**. That is a hard constraint: attribution yes, **non-commercial**, **no derivatives**. We may quote the law *names* (facts and short titles are not copyrightable) and write our own prose, but we may not adapt the site's text into new files, and we may not use it commercially.

**Representative skill original: `keysjoao/laws-of-ux-skills`** (MIT, 22★, created 2026-05-05, pushed 2026-05-08). Three skills plus two references:

- `laws-of-ux/SKILL.md` — the advisor. Routes by intent (building → proactive advisor; "review"/"audit" → review skill; "checklist"/"pre-ship" → checklist skill), classifies the component (form, dashboard, navigation, wizard, list/table, modal, card layout, landing/hero, empty/error state, settings), surfaces only the 5–8 laws that apply, and emits `**[Law Name]** — [one-line rule]` / `→ DO: [pattern]` / `→ DON'T: [violation]` with real code. Its critical rules are good: "Never list all 30 laws at once", "Always provide code", "Violations > Suggestions", "Respect the user's stack".
- `laws-of-ux-review/SKILL.md` — scores all 30 laws 0/1/2/N-A for a max of 60, grades A–F, and buckets findings into CRITICAL / WARNING / SUGGESTION with before/after code.
- `laws-of-ux-checklist/SKILL.md` — a 12-point binary pre-ship check, each row naming the law it comes from, with a verdict ladder (12/12 SHIP IT → 0–6 BLOCK) and a one-line fix per failure.
- `references/ux-laws-complete.md` — all 30 laws as definition / when to apply / violation signals / code fix; the file header reads "Source: lawsofux.com." `references/code-patterns.md` — component-type → law map.

Alternatives: `els6x/laws-of-ux-skills` (MIT, 0★) — "turns 30 UX laws into rules an agent can execute. Bring your own design system"; `Arcynox/laws-of-ux-skill` (license "Other", 1★). `keysjoao` is the representative original with real use.

**Structure.** Workflow-oriented, not principle-oriented: route → detect → surface → fix. Three different entry points with a command surface (`/laws-of-ux`, `/laws-of-ux review`, `/laws-of-ux checklist`). The scoring model (0–60 across 30 laws) is a rubric, not a principle set.

**Quality verdict.** Medium, with one genuinely transferable shape. The strengths: the advisor's "never dump all 30" discipline and its code-level output; the checklist's binary rows naming the law behind each check. The weaknesses: a 0–60 score over 30 laws is theatre for a prototype — most of the 30 are N/A for any given component, and the score invites false precision; several laws in the set are classic misapplications (Parkinson's Law as a UX rule, Miller's 7±2 as a menu limit); and the law definitions inherit a licence chain we cannot cleanly relicense. `lawsofux.com` being ND also means the reference file's own "Source: lawsofux.com" header makes the MIT claim on that file questionable for verbatim reuse.

**Fit.** redline/polish: the checklist's *shape* — 12 fixed questions, read against the real artifact, binary result, one fix per failure — is the gate the redline branch does not have yet. Its *content* is the weakest of the six.

**Principle-pattern match.** No.

## 7. Separate classification: `GoogleChrome/modern-web-guidance` (already installed)

**What it is.** Not a principle reference and not design knowledge: a **retrieval tool** over a curated catalog of modern web-platform practices, delivered as a CLI (`npx -y modern-web-guidance@latest search|retrieve|list`) with a skill file that tells the agent how to drive it. Read from the installed copy at `/home/jason/.kimi-code/plugins/managed/modern-web-guidance/`; upstream `github.com/GoogleChrome/modern-web-guidance` (official Google Chrome).

**Structure — a skill over a catalog, not a reference.**

- `skills/modern-web-guidance/SKILL.md` — 136 lines, four steps: (1) **search** with a 2–5 word action-oriented query, one platform capability per query, framework names and app nouns excluded; (2) **retrieve** the matching guide ids plus any broader discipline guide (`html`, `css`, `forms`, `accessibility`, `color`, `performance`, `security`); (3) **verify** the implementation against the retrieved guide; (4) **disclose** skill usage.
- `skills/modern-web-guidance/guides/` — the shipped catalog snapshot: **193 guide files across 17 categories** — accessibility 4, built-in-ai 5, css 18, forms 19, html 8, js 5, performance 26, privacy 1, pwa 1, security 17, ui-atoms 12, ui-behaviors 37, ui-components 14, visual-design 22, wasm 1, webmcp 3.
- Each guide is a short Markdown file with a bolded rule, a DO/DO-NOT framing, and code samples — e.g. `ui-behaviors/light-dismiss-a-dialog.md` ("**MANDATORY: Use `closedby="any"` to enable light-dismiss behavior**") and `visual-design/color.md` ("**Don't use color alone to indicate the presence of a user interface component or its state**").

So the rules it holds are **web-platform implementation rules** (dialog semantics, View Transitions, container queries, `oklch`, focus handling, contrast floors), not **design principles** (hierarchy, spacing, affordance). It answers "what is the modern correct way to build this", not "what should this look like". That is why it cannot be ranked against the six: it fills a different slot.

**License.** Apache-2.0 — the local `LICENSE` is the full Apache-2.0 text, `plugin.json` and `kimi.plugin.json` both carry `"license": "Apache-2.0"`, publisher `GoogleChrome`. Versions on disk: `plugin.json` 0.0.196, `kimi.plugin.json` 0.0.197. Because nothing is being adopted, the licence only bites if we ever copy a rule verbatim, in which case Apache-2.0 §4(a)–(c) apply (ship the notice, mark modifications, retain attribution).

**Quality verdict.** High for its job, and the only candidate with a *living* catalog — its own opening claim is that "web APIs evolve rapidly and training weights contain obsolete patterns". Rule ids make a change traceable to the rule that caused it. Two operational cautions: it needs network plus `npx` (the install ships `policies/modern-web-guidance.toml`, which gates any `modern-web` shell command with `decision = "ask_user"`), and it bans guessing ids from memory — "Never guess `<id>`s or quotes from memory after context compaction (re-run `search`/`retrieve` if needed)" — which is the same anti-proxy rule our `principle-prove-it-works` already states.

**(a) Role for the prototype scenario branches — consulted skill, not an adoption candidate.** Its description mandates running it first for any HTML/CSS/client-side-JS task ("MANDATORY: Execute FIRST for all HTML/CSS and clientside JS tasks"), so every UI-producing branch meets it before generating:

- **design-doc→UI** — the branch writes HTML/CSS/JS, so the lookup comes first: modern patterns instead of legacy workarounds, and no unnecessary dependencies.
- **UI variants** — generate every variant against the same retrieved guidance, so the variants differ in structure rather than in API vintage; and "Before creating or updating a component, to check if a standardized modern web pattern already exists" stops a variant from hand-rolling something the platform now ships natively.
- **redline/polish** — the skill's own scope includes "fixing UX symptoms (e.g., janky interactions, layout shifts)", so the redline branch's first move can be a lookup rather than a guess.

Because it is **already installed**, this needs no adoption decision, no new dependency, and no new skill in this pack: the branches cite the existing skill. Ticket 06 should record it as an *already-consulted* input, not as something to adopt.

**(b) Which disciplines transfer to our gates.**

1. **Mandatory-first lookup.** Our branches have no "look before you write" step for UI code. The pattern is cheap and enforceable: before generating variants, look up the platform capability in play ("light dismiss dialog", "responsive data table"), record the ids, and generate against them. Structurally it matches the map's completion gate — a named action with a recorded result rather than a self-report — and it keeps the pack from minting a second mechanism owner, since the tool and its catalog are already owned upstream.
2. **Per-id disclosure with verbatim quotes — the evidence pattern.** This is the more transferable one, and the closest external match to our `principle-prove-it-works` iron law. The skill's rule: when guides shaped the code, end with **one bullet per newly applied id** — 1–2 sentences, ≤75 words, first-person — naming the non-obvious choice or fallback applied and the pitfall it prevented, **anchored by a short verbatim quote of that specific rule**; when the lookup ran but nothing applied, say which topics were checked and why none applied. That is a completion record where every claim carries its source and a checkable quotation, which is stronger evidence than a screenshot alone: the quote is text, re-runnable, and names the rule that justified the change. Our redline gate can adopt the *form* without the content — **each claim in the branch's completion record names the source it came from and quotes it** (guide id + rule quote where a guide applied; screenshot or observed output where the claim is about behaviour). Note the failure mode the skill bans: guessing ids or quotes after context compaction — precisely the "a child's report is not evidence" case.
3. **Baseline fallback policy.** The default is that Baseline *Widely available* features need no fallback and anything else must follow the guide's fallback recommendation unless the project declares its own policy; the skill also suggests writing that policy into `CLAUDE.md`/`AGENTS.md` when the runtime is restricted. Our prototype branches throwaway code inside someone else's repo, so "no declared policy" is the normal case; the transferable discipline is **settle the browser-support target before choosing a modern API**, which for a throwaway prototype usually resolves to "newest features, feature-detected, degrade gracefully".

**What we should not take.** Do not vendor the guides — they are a versioned, network-fetched catalog with its own release cadence, so the pack consults rather than copies. Do not make `npx` a hard dependency of a branch: where network or approval is missing (the `ask_user` policy), the branch must say so and proceed, per `principle-never-block-on-the-human`, rather than stall on a lookup. Do not treat a retrieved guide as a design principle — it constrains implementation, not aesthetics, so it cannot feed the `principle-*` set. And do not import its "MANDATORY" trigger into our skills: our principles are `disable-model-invocation: true` and are cited by a playbook, not auto-triggered by topic.

## Fit against the three prototype-rework branches

The map's scenario families are design-doc→UI, webapp verify loop, redline/polish, and the rework of the existing LOGIC/UI branches. The branch surfaces are `skills/prototype/SKILL.md` (router), `skills/prototype/UI.md` (variants branch), and `skills/poteto-mode/playbooks/prototype.md` (playbook, which already cites the `exhaust-the-design-space` principle skill at step 4).

| Branch | What it needs | Best feed | Second | Skip |
|---|---|---|---|---|
| **design-doc→UI** | principles that decide hierarchy, layout, type, colour, accessibility while turning a document into an interface | vibey §4–§6 + §9 (with [DURABLE]/[PLATFORM] markers) | wondelai `refactoring-ui` constrained scales | blink-new (no license), laws-of-ux (no doc pipeline) |
| **redline/polish** | an audit with severity, a fix method, and a binary pre-ship gate | wondelai `ux-heuristics` (severity + 10/10 + 15 common mistakes) | designer-skills law subset (per-law review); keysjoao checklist *shape*; vibey §15 anti-patterns | ui-design-brain (no audit) |
| **UI variants** | a shared floor so variants differ structurally, and a per-variant review | wondelai `refactoring-ui` (scales, hierarchy, one primary CTA) | designer-skills law subset (same law set applied to each variant) | — |
| **cross-branch** | the "what does good look like" vocabulary | designer-skills law subset → new `principle-*` design skills | vibey §16 contested questions (for the honest edge cases) | — |
| **cross-branch (consulted, not adopted)** | modern web-platform implementation rules for anything the branch renders | `modern-web-guidance` — already installed, Apache-2.0; mandatory-first lookup before generating UI code | its per-id disclosure pattern as the evidence form for the completion gate | vendoring the guides; making `npx` a hard dependency; treating a guide as a design principle |

One structural finding worth recording for ticket 06: **the pack's `principle-*` family is the wrong home for most of this material.** The map already decided that "skills/prototype/ becomes the scenario router + branch files… No per-scenario standalone skills", and the sibling frontend-design research reached the same conclusion for the Anthropic skill. The right split is:

1. **New `principle-*` design skills** — only what is *principle-shaped*: one law, one short file, one trigger. Sourced from `Owl-Listener/designer-skills` (MIT), paraphrased, with an inline credit line and an entry in the repo `LICENSE` "Includes portions" line.
2. **One shared design reference** under `skills/prototype/references/` (or `skills/how/references/`) — the branch files cite it the way `skills/how/SKILL.md` cites `references/explainer-prompt.md`. Sourced from wondelai (MIT, with credit) and/or vibey (MIT, with credit), selected by §.
3. **A scoring rubric for the redline branch** — the branch's completion gate needs a fixed, reproducible check, not a vibe. wondelai's 10-row diagnostic and keysjoao's 12-row checklist are both candidates; the mechanism is ours either way.

## Shortlist for the adoption decision (ticket 06)

Ranked by fitness for this pack, not by star count.

1. **`Owl-Listener/designer-skills` — MIT — "Copyright (c) 2026 MC Dean".** Adopt the **shape and substance** of a named subset (the 9 cognitive/motor laws + the 6-7 Gestalt laws) as the model and source for new `principle-*` design skills. Best principle-pattern match of the six by a wide margin; the files are already 31–73 lines with self-routing cross-links. Feeds redline/polish and UI variants primarily, design-doc→UI indirectly. Attribution: MIT requires the notice in copies; paraphrase + inline credit.
2. **`wondelai/skills` — MIT — "Copyright (c) 2025 Wondel.ai sp. z o.o."** Adopt **the rubric and the constrained scales**, not the whole skill: `ux-heuristics` (severity 0–4, 10-row diagnostic, 15 common mistakes, 7 references) as the redline audit, `refactoring-ui` (7 principles, 4/8/16/24/32/48/64 spacing, 12→36 type, grayscale-first) as the shared floor for every UI variant. Too large to be a principle file, right size to be a shared reference. Feeds redline/polish and UI variants; design-doc→UI partially.
3. **`the-vibey-project/vibey` `ui-ux-design-principles` — MIT.** Adopt as the **single shared reference** for design reasoning: §4–§6 and §9 for design-doc→UI, §15 anti-patterns and §16 contested questions for redline/polish. Highest source quality — durability markers, contested-question honesty, dated currency snapshot. Two cautions: 3★ and one author (low validation), and the §-numbering couples the files (cite by §, don't copy sections loose). Feeds design-doc→UI and redline/polish.
4. **`keysjoao/laws-of-ux-skills` — MIT repo, but its upstream `lawsofux.com` is CC BY-NC-ND 4.0.** Adopt the **checklist shape only** — a small fixed set of binary questions read against the real artifact, one fix per failure — for the redline branch's completion gate. Do **not** lift law definitions from `references/ux-laws-complete.md`; write our own prose and cite the law names. Feeds redline/polish.
5. **`blink-new/claude` `ux-design-principles` — license unverifiable, upstream gone.** Do **not** adopt as a dependency. Salvage one idea: the "engineer vocabulary" of BAD/GOOD phrasing pairs for describing UI changes to an AI. If the underlying video content is wanted, take it from **`valewnrt/design-skills` — MIT**, whose `CREDITS.md` names the sources and asserts no source text is reproduced.
6. **`carmahhawwari/ui-design-brain` — MIT by file content (`LICENSE.txt`); GitHub API says `NOASSERTION`.** Optional crib for design-doc→UI: the component-identification pass and the five style presets as a variant axis. Note the component.gallery data attribution. Not a principle source.

**Not on the list, and why.** No candidate is adopted wholesale. Every one of the six is either too big (wondelai, vibey, designer-skills as a collection), too small in scope (ui-design-brain), licence-tainted (keysjoao's upstream), or unverifiable (blink-new). The adoption should be a **selection of principles plus one shared reference**, sourced from #1–#3, each with an inline credit and an "Includes portions" line in the repo `LICENSE`.

**Not ranked, by design: `GoogleChrome/modern-web-guidance` (Apache-2.0, already installed).** It is not an adoption candidate — it is a *retrieval tool* the branches consult, and its content is web-platform implementation rules rather than design principles. Ticket 06 should record it as an already-consulted input, and borrow two of its disciplines (mandatory-first lookup before generating UI code; per-id disclosure that quotes the rule it applied) as the shape of our completion record — see §7. Nothing is vendored and no new skill is created for it.

## What to skip

- **Any dependency on a dead or licence-unverifiable upstream.** `blink-new/claude` fails every access route we have; a skill we cannot re-read is a skill we cannot maintain or relicense.
- **The 30-law scoring ritual.** A 0–60 score over laws that are mostly N-A creates false precision where our gate needs a reproducible checklist. Take the shape, drop the arithmetic.
- **Copying `lawsofux.com` prose.** CC BY-NC-ND 4.0: attribution yes, commercial use no, derivatives no.
- **Copying the books.** Wondelai's MIT covers wondelai's prose, not Krug's, Nielsen's, or Wathan & Schogo's. Summarise; do not lift.
- **The "10/10" target as a quality claim.** A score computed from eight yes/no rows is a diagnostic, not a quality grade. If we adopt the diagnostic, drop the aspirational band names.
- **Vendor-prescriptive output rules.** `ui-design-brain`'s "Stack: React + Tailwind CSS" and its taste presets belong to that project, not to a stack-agnostic pack.
- **A new standalone `ui-ux` skill.** The map forbids per-scenario standalone skills, and a mega-skill would compete for context with the branch files. Principles and one shared reference, cited from the branches.

## References

- `blink-new/claude` skill page (cached render only): <https://github.com/blink-new/claude/blob/main/skills/ux-design-principles/SKILL.md> — **404 at time of writing**
- Marketplace mirror of the same content: <https://mcpfield.com/en/skills/ux-design-principles>
- `wondelai/skills`: <https://github.com/wondelai/skills> — `ux-heuristics/SKILL.md`, `refactoring-ui/SKILL.md`, `web-typography/SKILL.md`, root `LICENSE`
- `the-vibey-project/vibey`: <https://github.com/the-vibey-project/vibey> — `src/vibey_tools/skills/plugins/ui-ux-design-principles/` (5 `SKILL.md` + `.claude-plugin/plugin.json` + `README.md`)
- `carmahhawwari/ui-design-brain`: <https://github.com/carmahhawwari/ui-design-brain> — `SKILL.md`, `components.md`, `LICENSE.txt`
- `Owl-Listener/designer-skills`: <https://github.com/Owl-Listener/designer-skills> — `interaction-design/skills/*/SKILL.md`, `ui-design/skills/*/SKILL.md`, `ux-strategy/skills/design-principles/SKILL.md`, `INDEX.md`, root `LICENSE`
- `keysjoao/laws-of-ux-skills`: <https://github.com/keysjoao/laws-of-ux-skills> — `laws-of-ux/SKILL.md`, `laws-of-ux-review/SKILL.md`, `laws-of-ux-checklist/SKILL.md`, `references/`
- `lawsofux.com` (upstream of the 30 laws), licence link: <https://lawsofux.com/> → <https://creativecommons.org/licenses/by-nc-nd/4.0/>
- Legal-clean derivative of the same video source: <https://github.com/valewnrt/design-skills> — `CREDITS.md`, `LICENSE`
- Grade-A marketplace derivative noted: <https://www.skillsdirectory.com/skills/flagrare-design-review>
- `GoogleChrome/modern-web-guidance` — local install (read, not fetched): `/home/jason/.kimi-code/plugins/managed/modern-web-guidance/` — `skills/modern-web-guidance/SKILL.md`, `skills/modern-web-guidance/guides/` (193 files, 17 categories), `plugin.json`, `kimi.plugin.json`, `policies/modern-web-guidance.toml`, root `LICENSE`
- Upstream repo for the same project: <https://github.com/GoogleChrome/modern-web-guidance>
- Local grounding: `skills/principle-*/SKILL.md`, `skills/prototype/SKILL.md`, `skills/prototype/UI.md`, `skills/poteto-mode/playbooks/prototype.md`, `skills/how/SKILL.md`, `skills/how/references/`, `LICENSE`, `references/`
