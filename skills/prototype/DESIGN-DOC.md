# Design-Doc Prototype

The input is a **design document** — a brief the user hands you — and the question is what the result should look like. This branch grounds itself in that brief, writes the plan down, gates the plan against the brief, narrows a field of directions to three, builds them, and lets the user pick one.

If there is no brief in hand, this is the wrong branch: options on an existing page → [VARIANTS.md](VARIANTS.md); logic or state questions → [LOGIC.md](LOGIC.md); the artifact already exists and the question is polish → [REDLINE.md](REDLINE.md).

The stages run in order; each one's output is the next one's input:

1. **Ground** — three named facts read out of the brief.
2. **Plan** — a written spec, a token plan, and direction cards.
3. **Gate** — the plan reviewed against the brief, revisions stated.
4. **Funnel** — six cheap thumbnails, three full builds.
5. **Pick** — show, stop, record the user's verbatim choice.

## Process

### 1. Ground in the subject

*The grounding stage is adapted from Anthropic's `frontend-design` skill (Apache-2.0), paraphrased.*

Read the brief before designing anything. **The brief's own words win**: where it pins a visual direction — a palette, a typeface, a look — follow it exactly, including when it asks for something stage 3 would flag as a common default.

The grounding stage terminates in three named outputs, one line each:

- **The concrete subject** — what the thing actually is.
- **The audience** — who it is for.
- **The page's single job** — what the surface must accomplish.

When the brief is silent on any of the three, propose your best reading and confirm it with the user; if the user is away, continue on the proposal and state the assumption at the top of the prototype. Recall of past conversations with this user is a hint, not a constraint.

Distinctive choices come from the subject's world — its industry, materials, and vernacular — so mine the brief for real vocabulary, and **build with the brief's real content throughout**: real headings, real labels, real data shapes. Placeholder copy hides exactly the design problems this branch exists to expose.

Done when: the three outputs each fit on a line, and every choice made later can point back at one of them.

### 2. Write the plan

*The spec/card split is adapted from `alchaincyf/huashu-design` (MIT), paraphrased; the token plan from `frontend-design` (Apache-2.0), paraphrased.*

The plan is three short written artifacts, kept next to the prototype code: a file present is proof the step ran; a file missing means the step didn't.

- **The spec — what to communicate.** The product, the audience, the scenario of use, the content points itemized, the tone, the output format and dimensions (mandatory: everything built later must share them, or nothing can be compared side by side), known constraints (brand colors, taboos, required elements), and image needs. The spec says **what to say**; how it looks belongs to the cards.
- **The token plan — how it looks, compactly.** Four slots: **color** as 4–6 named hex values; **type** as the typefaces and their roles (one or two clearly distinct families, chosen for this brief rather than reached for by habit); **layout** as one-sentence prose plus ASCII wireframes, including alignment guidance (left, center, justified); **principles** as the short statement of what makes this page unique.
- **Direction cards — one per candidate direction.** Six fields: (1) the **source** the direction comes from; (2) the **borrowed rules** — the concrete rules taken from that source: grid columns, headline-to-body type ratio, primary-color proportion, image-text relation; (3) the **protagonist material** — what carries the picture: photography, data-as-image, giant type, texture; (4) the **skeleton** in one sentence; (5) **where the boldness goes** — the single boldest move, everything else serving the content; (6) one sentence naming what in *this* subject another subject would not have. If field 6 won't come, the card is a template wearing a palette — redraw it.

Ground each slot in stage 1: sketch each screen's content against `design-laws.md`'s `#load` so a screen carries only the chunks it can hold, and let the boldness slot name the one element that gets noticed (`#salience`).

Done when: the spec, the token plan, and one card per direction exist on disk.

### 3. Gate the plan before coding

*Adapted from `frontend-design` (Apache-2.0), paraphrased.*

Review the whole plan against the brief **before writing any UI code**. For each part, work through a similar prompt for a similar page: if you would arrive at the same choice for any subject — the same palette, the same card grid, the same headline treatment — that part is a default, not a decision. Revise it, and **say what you changed and why**. A revision with no stated reason is an unmade decision.

The AI-tells list (warm cream plus a high-contrast serif plus a terracotta accent; near-black plus one acid accent; broadsheet hairlines; the identical-card kit; template chrome — all-caps eyebrows, middle-dot meta strings, `→` on every link) is a **convergence detector, never a ban list**: every trait is legitimate for some brief, and the brief outranks the list. The list tells you when you have converged on the model-average look; it does not forbid the look.

Before building, check the plan's interaction, layout, and visual choices against `design-principles.md` §4-§6, and its accessibility floor against §9.

Done when: every part of the plan carries either a stated reason tied to the brief or a revision with what changed and why. Only then start coding.

### 4. Narrow with the six-thumbnail funnel

*Adapted from `huashu-design` (MIT), paraphrased.*

Build cheap before building real: render **six thumbnails** of the carded directions on one page — small cells (~480×300) with the real palette, real type, real skeleton, and the real headline. A thumbnail that looks wrong is redrawn here, where a redraw costs minutes, not after a full build.

Pick three of the six to build fully, by the four criteria **in this fixed order** — an earlier criterion dominates a later one:

1. **Good on its own** — it holds up as the page, not just as an idea.
2. **Mutually different** — different skeletons, different temperaments, not three members of one appearance family.
3. **Not colliding with the project's recent look** — if the host app already ships a look, one direction may rhyme with it; three may not.
4. **Not overdone** — at most one "prop" direction (a page dressed as a subway map, a terminal, a newspaper). Test: remove the device — is the information clearer? Clearer means it's overdone.

The three need not come from three different sources; they need to pass all four.

Shortcut the funnel only when the brief pins the look: one faithful build plus one alternative, with the pinned parts recorded in `direction-approved.md`.

### 5. Build three, show, stop

Build the three chosen directions as the prototype artifact, under the [SKILL](SKILL.md) rules: throwaway and named as such, trivial to run, no persistence, state surfaced. On an existing page, mount them behind `?variant=` the way [VARIANTS.md](VARIANTS.md) describes; standalone, one file that opens by double-click.

Hold the builds to the floors: body text ≥14px (16 on mobile), tap targets ≥44px, contrast ≥4.5:1 — `design-principles.md` §4-§6 carries the craft detail, §9 the accessibility floor. Motion is one orchestrated moment, not every section fading up.

As you build, **critique your own work with screenshots**; spend the boldness in the one place the card named, and before handing over, remove one accessory.

Then **show, and stop**: present the three builds — screenshots, their cards, each card's field 6 sentence, the unused thumbnails as alternates — and end the turn. The pick belongs to the user, including when the user is away; the turn ends and waits. If the brief itself pre-approves a direction, that counts as the choice — record it as the brief's words.

Record the choice verbatim in `direction-approved.md` next to the prototype: which directions were shown, the screenshot paths, and the user's words as they said them. Mixed picks are recorded as fields — "B's layout with C's color" names the fields, which is more useful than the result.

## Evidence and capture

This branch's evidence form, captured through the [router's completion gate](SKILL.md):

1. **`direction-approved.md`** — the user's verbatim choice, the directions shown, the screenshot paths.
2. **A screenshot of the built artifact** — the approved direction as actually rendered.

Then capture through the [completion gate](SKILL.md#completion-gate). Fold the approved design decision into the owning spec or real code as appropriate, and archive the plan files, cards, thumbnails, and builds on the throwaway branch with a pointer. Production implementation is a later explicit operator invocation.

## Anti-patterns

- **One doc, re-rendered three times.** Three builds that share a skeleton and swap colors are one build with skins. Cards must disagree about structure, or the funnel is theatre.
- **Skipping the gate because the brief is clear.** The gate tests convergence, not comprehension: a clear brief still produces default choices when nobody checks them against it.
- **Treating the tells as bans.** The list detects convergence; the brief outranks it. Dropping a brief-requested trait to satisfy the list fails the brief twice.
- **Starting from a style label.** "Make it brutalist" is a starting point only when field 6 can name what in this subject earns it; otherwise it is a template with square corners.
- **Building all six.** Thumbnails are cheap because they are small; full builds are expensive, which is why the funnel picks three and the user picks one.

---

Mechanisms credited: the grounding stage, the token plan, the pre-code review gate, and the screenshot self-critique are adapted from Anthropic's `frontend-design` skill (`anthropics/claude-plugins-official`, Apache-2.0), paraphrased; the spec/card split, the six-thumbnail funnel, the four ordered pick criteria, and the verbatim `direction-approved.md` record are adapted from `alchaincyf/huashu-design` (MIT, © 2026 alchaincyf · 花叔), paraphrased — no upstream text is reproduced in this pack. Craft floors cite the sibling reference `design-principles.md` (§4-§6, §9); law citations use `design-laws.md` anchors (`#load`, `#salience`).
