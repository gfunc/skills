# Anthropic `frontend-design`: what it actually prescribes, and what we can adopt

**Question.** What does the anthropic claude-code `frontend-design` skill prescribe — (1) design principles and exploration loop, (2) role of brand/context gathering before generation, (3) iteration and critique structure, (4) what is adoptable for our design-doc→UI and other prototype scenario branches, with provenance and license, (5) what to skip?

**Source of truth.** Two upstream copies exist, and they are not the same document.

| | `anthropics/claude-code` @ `main` (the URL in the ticket) | `anthropics/claude-plugins-official` @ `main` (canonical) |
|---|---|---|
| path | `plugins/frontend-design/skills/frontend-design/SKILL.md` | same relative path |
| blob sha | `decdff43d05908b4c1fc2cfd2d80fc5743440934` | `a5333457c414d20d625f307df945842c0952ecc3` |
| size | 8,260 B | 9,390 B |
| shape | "Design Thinking" + "Frontend Aesthetics Guidelines" | "Ground your designs in the subject matter" + "Design principles" + "Process: plan, review against the brief, build, critique" + "Restraint and self-critique" + "More on writing in design" |
| repo license | `LICENSE.md` (150 B): "© Anthropic PBC. All rights reserved. Use is subject to Anthropic's [Commercial Terms of Service]" — **proprietary** | root `LICENSE` (11,358 B) and `plugins/frontend-design/skills/frontend-design/LICENSE.txt` (10,174 B): **Apache-2.0** |
| plugin manifest | unreadable (raw + contents API both 404 for `plugins/frontend-design/.claude-plugin/plugin.json`) | `.claude-plugin/plugin.json` (202 B): `name: frontend-design`, `version: 1.1.1`, `author: Anthropic <support@anthropic.com>` |

The `claude-code` copy at `main` is stale. That repo's own `plugins/README.md` says so outright: "Anthropic's plugins are developed in [claude-plugins-official] … Most plugins here are stale copies … and the copies here are deleted." The migration commit is `10a5141d` (2026-10-26, "Install marketplace plugins from claude-plugins-official"). The stale copy in `claude-code` also misdirects on licensing: its frontmatter says `license: Complete terms in LICENSE.txt`, but that repo has no `LICENSE.txt` — only the proprietary `LICENSE.md`. **Provenance must come from `claude-plugins-official`, not from the URL in the ticket.**

**Method.** `mcp__zread__read_file` and `mcp__zread__get_repo_structure` timed out (60 s each) and raw `curl` to `raw.githubusercontent.com` / `api.github.com` returned 404 from this machine's proxy, so every upstream fact below comes from the GitHub REST API and `raw.githubusercontent.com` via `FetchURL`: contents API for path listings and blob shas/sizes, the git-tree API (recursive) for full file sets, the commits API for provenance, and raw file reads for the documents themselves. Line-level quoting is from the raw reads. Nothing upstream was executed. Local grounding (`skills/prototype/`, `skills/poteto-mode/playbooks/prototype.md`, `vendor-manifest.txt`, `LICENSE`) was read read-only from the main checkout.

## The answer in one paragraph

The skill that matters is the Apache-2.0 one in `anthropics/claude-plugins-official`, not the stale proprietary copy the ticket links to. It prescribes a four-stage loop — *ground the design in the subject matter*, *write a compact design plan (color / type / layout / principles) as a written artifact*, *review that plan against the brief before writing code and say what you changed and why*, *build, then critique your own work with screenshots*. It supplies a calibration list of five "AI-generated design" tells (cream + serif + terracotta, near-black + acid green, broadsheet, SaaS-card kit, template chrome) that it explicitly frames as *defaults, not banned looks*, and it says a brief's own words always win over its advice. Brand/context gathering is not a separate research phase in the skill; it is a short grounding step whose output is one concrete subject, its audience, and the page's single job. For us this maps cleanly: the grounding step and the written design plan belong **inside** the design-doc→UI branch (resolving the map's open question), the calibration list is the appearance-side checklist for the `?variant=` and redline/polish branches, and "critique your own work, taking screenshots" is the mechanism behind the verification-evidence gate. What we should not adopt: the studio-persona framing, the hero/thesis language where the surface is an app screen rather than a landing page, the hard-ban reading of the calibration list, the required external book, the intermediate version's "do your planning in your thinking" line (it fights our surface-the-variants rule), and any new standalone skill — the map says branch files, not per-scenario skills. The Apache-2.0 grant is permissive but carries attribution duties, so we paraphrase the principles and quote the two literal enumerations with a credit line, and we copy `LICENSE.txt` next to any file we derive from.

---

## 1. Design principles and the exploration loop

**Framing.** The canonical document opens by assigning a role and a commercial stake rather than by listing rules:

> "Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified."

**Principles** (section "Design principles"):

- **The hero is a thesis.** "Open with the most characteristic thing in the subject's world, in the form that is most appropriate: a headline, an image, an animation, a live demo, an interactive moment." The stock alternative — "a big number with a small label, supporting stats, and a gradient accent" — is named as "the default treatment, so only use it if that's truly the best option."
- **Typography carries personality.** One family or two; "if two, make them clearly distinct"; choose typefaces "deliberately, not the default families you would reach for on any other project"; a clear type scale "following the default guidance of The Elements of Typographic Style with intentional weights, widths, and spacing"; when type is a headline or visual element, "use the type treatment itself as an active part of the design, not a neutral delivery vehicle for the content."
- **Measure.** "Default to line lengths of less than 80 characters. Serif typefaces can have slightly longer line lengths; give serif body text slightly more line-height than a sans-serif."
- **Named generic tells to avoid:** accenting a single word or phrase in a headline (italic/bold/different color); all-caps labels; unnecessary typographic labels above content.
- **Visual structure is information.** Outlines, borders, numbering, eyebrows, dividers and labels "encode useful information about the content rather than decorate it." Numbered markers (01 / 02 / 03) are only appropriate "if the content actually is a sequence — like a stepped process or a timeline."
- **Motion sparingly.** "A single orchestrated moment — one page-load sequence or one reveal — lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated." Motion that answers a person's action is welcome "when it shows what changed."
- **Copy is design content** — deferred to section 6 below.

**The loop is two passes, with a written artifact between them** (section "Process: plan, review against the brief, build, critique"):

1. "First, brainstorm a short design plan based on the client's design brief: create a compact token system with color, type, layout, and principles."
   - *Color*: "describe the core base palette as 4–6 named hex values."
   - *Type*: "the typefaces and their roles."
   - *Layout*: "a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Include alignment guidance; should the content be left aligned, center aligned, justified?"
   - *Principles*: "the high-level guidance for what makes this page unique."
2. "Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, **say what you changed and why**. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan."

That is the whole "exploration" mechanism: it does **not** explore multiple aesthetics and pick one. It explores one plan against a uniqueness test, and it explains its reasoning in the open by naming what it changed and why. (The multi-variant exploration is ours, not Anthropic's — see `skills/prototype/UI.md` and `skills/poteto-mode/playbooks/prototype.md` step 4.)

**One implementation caveat, verbatim:** "When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like `.section` and an element-based selector like `.cta`)."

## 2. Brand and context gathering before generation

The canonical document has a dedicated section, "Ground your designs in the subject matter", and it is short and concrete:

> "If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal. If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from — a design for a toy for girls aged 8–11 will be very aesthetically different from a dashboard for financial analysts. Build with the brief's real content and subject matter throughout."

Read as a procedure, brand/context gathering is three outputs and one confirmation:

1. **One concrete subject** — the product or subject matter, named.
2. **The audience** — who it is for.
3. **The primary job** — what the surface must do.
4. **Confirm it with the client** — the skill asks for confirmation when *it* proposes the subject, and the plan-review pass (section 1) re-confirms the whole plan against the brief.
5. **Use real content throughout** — "Build with the brief's real content and subject matter throughout"; the source of visual vocabulary is "the subject's industry, subject matter, materials, and vernacular."

Two precedence rules keep it from overruling the user:

- "Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks."
- Memory of the client's preferences is "a hint", not a constraint.

There is **no** separate brand/moodboard research phase, no asset collection step, and no external brand-kit intake in the skill. Gathering is brief-driven and terminates in a stated subject + audience + job. (Anthropic points elsewhere for that: the plugin `README.md` links the *Frontend Aesthetics Cookbook* notebook, `anthropics/claude-cookbooks` → `coding/prompting_for_frontend_aesthetics.ipynb`, 63,896 B, blob `c27750f0d7e97bcc03d60950fadb9574c45ac02f` — not read for this ticket, cited as a pointer only.)

## 3. Iteration and critique

Three mechanisms, in the order they fire.

**(a) Calibration — what "generic" currently looks like.** The skill enumerates five traits that "AI-generated design right now clusters around":

1. a warm cream background (near `#F4F1EA`) with a high-contrast serif display and a terracotta or warm-clay accent (often near `#D97757`);
2. a near-black background with a single bright acid-green or vermilion accent;
3. a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns;
4. the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (`rgba(0,0,0,.1)`) under each, and gradient washes as decoration;
5. template chrome that appears whatever the subject: a tracked-out ALL-CAPS eyebrow label above every heading; meta strings joined with middle dots (`A · B · C`); labels built as `WORD — fragment` with a spaced em dash; tinted near-black (`#0B0B0B`, `#111`) standing in for black; a monospace face for small data labels; a `→` appended to link and button text.

Important qualifier, verbatim: "All traits are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject." So the list is a *convergence detector*, not a prohibition — and the brief outranks it.

**(b) The review gate.** The uniqueness test is operational, not aesthetic: "work through a similar prompt to see if you arrive somewhere similar." A part of the plan that fails the test is revised, and the revision is stated with a reason before code is written.

**(c) Restraint and self-critique** (section "Restraint and self-critique"):

- "Spend your boldness in one place. Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief."
- Quality floor, "without announcing it": responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes.
- "Critique your own work as you build, **taking screenshots to review if your environment supports it** — a picture is worth 1000 tokens."
- The Chanel rule: "before leaving the house, take a look in the mirror and remove one accessory."
- Memory aid: "if you have a space to quickly jot down notes about what you've tried, it can help you in future passes."

**(d) Copy discipline** (section "More on writing in design") is the other critique surface: words appear "to make it easier to understand and use"; write from the end user's perspective ("A user manages notifications, not webhook config"); active voice ("Save changes," not "Submit"); an action keeps one name through the whole flow (button "Publish" → toast "Published"); failures are explained, never apologized for, never vague; an empty screen is an invitation to act; register is conversational, plain verbs, sentence case, no filler, "tone matched to the brand and the audience"; "Let each written element do exactly one job."

## 4. What is adoptable for our branches — with provenance and license

**Provenance.** `anthropics/claude-plugins-official`, path `plugins/frontend-design/skills/frontend-design/SKILL.md`, blob `a5333457c414d20d625f307df945842c0952ecc3`, 9,390 B. Last changed by `44490cc` (2026-09-01, Barron Webster, "Updates to address manatee slop measures"), preceded by `d029127f` (2026-06-15, william qian, "Update frontend-design skill (#2540)") and the initial scaffolding `4ca561f` (2025-11-20, Noah Zweben).

**License.** Apache-2.0, twice over: repo-root `LICENSE` (11,358 B, full text with appendix) and a per-skill `plugins/frontend-design/skills/frontend-design/LICENSE.txt` (10,174 B) that the skill's frontmatter points at ("license: Complete terms in LICENSE.txt"). There is no `NOTICE` file in the repository, so Apache-2.0 §4(d) does not bite; §4(a)–(c) do:

- §4(a) ship a copy of the license with any redistributed copy or derivative;
- §4(b) "cause any modified files to carry prominent notices stating that you changed the files";
- §4(c) retain the copyright/patent/trademark/attribution notices in the source form of the derivative.

Our repo already has the precedent for third-party attribution: `LICENSE` is MIT with a trailing "Includes portions copyright (c) 2026 …" line, and `vendor-manifest.txt` carries "credited inline to its MIT source" hunks. **Note:** `vendor-manifest.txt` is explicitly scoped to pstack paths ("paths in this repo that originate from pstack"), so an Anthropic-derived file must not be added there without changing that rule — keep it as a first-party reference file with its own adjacent `LICENSE.txt` and an inline credit line, and add the credit to the repo `LICENSE` "Includes portions" line if we copy any text verbatim.

**Recommended adoption, mechanism by mechanism:**

| Anthropic mechanism | Where it lands for us | License handling |
|---|---|---|
| Grounding in the subject: subject + audience + single job, confirmed | A **stage inside** the design-doc→UI branch, before any UI is produced — answers the map's open question "whether reference/moodboard gathering becomes its own scenario or a stage inside design-doc→UI". The skill's gathering is brief-driven and terminates in three named outputs, so a standalone scenario would need a different owner. | paraphrase; no verbatim text |
| Written design plan (Color 4–6 named hex / Type roles / Layout prose + ASCII wireframe + alignment / Principles) | The doc→UI bridge artifact: a short plan the branch writes before coding. Cheap, reviewable, and it is the exact shape of the skill's "compact token system". | paraphrase the slot names; the four slots are generic |
| Review-against-the-brief gate ("revise that part, say what you changed and why") before code | Pre-code gate in the design-doc→UI branch; pairs with the map's triple completion gate but runs *before* the build, not after. | paraphrase |
| Calibration list of five AI tells | Appearance-side checklist for the `?variant=` generation (UI branch) and the redline/polish branch — the concrete "don't" list our current "structurally different, not wallpaper" rule lacks. | quote or closely paraphrase **with** an inline credit; if quoted verbatim, §4(a)+(c) apply |
| Typography specifics (one or two clearly distinct families, deliberate non-default faces, type scale, <80-char measure, serif tweaks, no all-caps eyebrows) | A short appearance checklist for reviewing a design doc and for critiquing a variant. | paraphrase; avoid copying the "Elements of Typographic Style" reference as a requirement |
| Motion discipline (one orchestrated moment; action-responding motion welcome) | Checkbox for the redline/polish branch and for variant critique. | paraphrase |
| Copy rules (end-user vocabulary, active voice, one name per action, errors explain and fix, empty state invites) | Shared UI-copy checklist; applies to every UI-producing branch. | paraphrase |
| "Spend your boldness in one place" / "remove one accessory" | A quality bar for each variant: one memorable element, the rest disciplined — pairs with `principle-exhaust-the-design-space` (N variants, each with one point of view, not N loud variants). | paraphrase |
| "Critique your own work as you build, taking screenshots to review if your environment supports it" | The mechanism behind the map's verification-evidence gate; `playwright-cli` is the control skill per `skills/poteto-mode/playbooks/prototype.md` step 5. | paraphrase |
| Quality floor: responsive to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious palettes | Shared floor for any branch that ships a visual artifact. | paraphrase |

**Do not create a new gfunc skill for this.** The map's decision is explicit: "`skills/prototype/` becomes the scenario router + branch files … No per-scenario standalone skills." The Anthropic material should land as a referenced mechanism inside the branch files (and, if a shared checklist is warranted, one reference file under `skills/prototype/`), not as a `frontend-design` skill.

**Copy-vs-paraphrase.** Apache-2.0 permits copying, so this is a style and maintenance call, not a legal one. Recommend: paraphrase every *principle* (they are ordinary design practice and our branch files must match our own voice and the `writing-for-agents` guidance), and quote only the two literal enumerations that lose value when paraphrased — the five calibration traits and the three default typographic treatments — each with a one-line credit to `anthropics/claude-plugins-official` (Apache-2.0). Whatever is copied verbatim must ship with §4(a) license copy and §4(c) attribution; if we edit a quoted block, §4(b) requires a "modified" notice.

## 5. What to skip

- **The `claude-code` copy entirely.** Wrong content (8,260 B stale variant) *and* proprietary licensing: that repo's `LICENSE.md` reads "© Anthropic PBC. All rights reserved. Use is subject to Anthropic's Commercial Terms of Service." Do not source from the URL in the ticket. Note also that its frontmatter's `license: Complete terms in LICENSE.txt` points at a file that does not exist in that repo.
- **Its content wholesale.** "Design Thinking" (Purpose / Tone / Constraints / Differentiation), "Frontend Aesthetics Guidelines" (Typography / Color & Theme / Motion / Spatial Composition / Backgrounds), the "NEVER use generic AI-generated aesthetics like … (Inter, Roboto, Arial, system fonts) … purple gradients on white backgrounds" list, and "NEVER converge on common choices (Space Grotesk, for example) across generations" are font-and-color bans from the older version. The canonical version replaced them with reason-bearing rules ("Structural devices … encode useful information … rather than decorate it"), which is what we want; a ban list reads as taste, a rule reads as a criterion.
- **The studio persona.** "You are the design lead at a design studio … This client has already rejected proposals … is paying for a distinctive point of view." Keep the operative rules; drop the role-play. Our agent is not a vendor bidding for a client.
- **"Take aesthetic risk if justified."** In our setting the aesthetic risk belongs to the user, who picks among `?variant=` options. The prototype's job is to make the choices legible, not to be bold on the user's behalf.
- **The hero/thesis framing where the surface is not a landing page.** "For web designs, the hero is the first thing viewers will see" is marketing-page logic. Our prototype branches often target an in-app screen or a component, where the analogue is the primary view. Adapt the principle ("open with the most characteristic thing in the subject's world"), drop the hero vocabulary.
- **The calibration list as a hard ban.** The skill itself says the traits are legitimate for some briefs and that the brief's words always win. Use it as a convergence detector, not a filter — and drop the parenthetical that ties terracotta `#D97757` to "Anthropic's own Claude-interaction accent", which is product trivia we have no use for.
- **"The Elements of Typographic Style" as a required reference.** Keep the concrete numbers (<80 characters, one or two families, serif line-height); do not require agents to own a typography book.
- **The intermediate version's planning-internals line.** The 2026-06-15 revision (`d029127f`) ended with "Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them." That directly conflicts with our rule that the user flips between variants and chooses — and with `skills/poteto-mode/playbooks/prototype.md` step 6, which requires presenting alternatives and a recommendation. The 2026-09-01 revision dropped the line; do not reintroduce it.
- **The intermediate version's four-slot plan.** `d029127f` used Color / Type / Layout / **Signature** (a single memorable element); the current version uses Color / Type / Layout / **Principles**. The current wording is better for us because it generalises (a prototype variant is not a landing page), but if the branch wants "the one memorable thing", that language already exists in the current "Restraint" section ("Let one element be the memorable thing"). Use the current text.
- **"Confirm with the client" as written.** Keep the confirmation *step* — our client is the user — but not the client relationship, and not a blocking gate that stalls a session where the user is away.

## Appendix: version lineage (what each revision changed)

| Date | Repo | Commit | Shape |
|---|---|---|---|
| 2025-11-12 | claude-code | `62c3cbc` (Thariq Shihipar) | plugin added to the marketplace: "a skill that generates creative, polished code avoiding generic AI aesthetics" |
| 2025-11-20 | claude-plugins-official | `4ca561f` (Noah Zweben) | initial plugin scaffolding |
| 2026-06-15 | claude-plugins-official | `d029127f` (william qian, #2540) | "Ground it in the subject"; heading **"Process: brainstorm, explore, plan, critique, build, critique again"**; three calibration looks; Color/Type/Layout/**Signature** plan; "planning in your thinking" line |
| 2026-06-18 | claude-code | `423563c` (william qian, #69226) | "Update frontend-design skill, bump plugin to 1.1.0" |
| 2026-09-01 | claude-plugins-official | `44490cc` (Barron Webster) | "Updates to address manatee slop measures" → current canonical text: "Ground your designs in the subject matter"; heading **"Process: plan, review against the brief, build, critique"**; five calibration traits; Color/Type/Layout/**Principles**; added line-length and typography detail, and "More on writing in design" |
| 2026-09-02 | claude-code | `dbdd79c` (william qian) | "Update /frontend-design SKILL.md" — content at this commit matches the current canonical text (verified by raw read at that sha) |
| 2026-10-26 | claude-code | `10a5141d` (claude) | "Install marketplace plugins from claude-plugins-official … Most plugins here are stale copies … the copies here are deleted" |

**One discrepancy worth recording.** `claude-code` @ `main` currently serves blob `decdff43` (8,260 B, the older "Design Thinking" text), even though that repo's own commit `dbdd79c` (2026-09-02) already carried the canonical 9,390-B text. The two repositories' `main` trees therefore disagree on this path, and the `claude-code` side is the older one — consistent with that repo's own statement that its copies are stale. Conclusion: cite `claude-plugins-official` as the source, treat `claude-code` as historical.

## References

- Canonical skill: <https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md>
- Skill license: <https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/LICENSE.txt>
- Repository license (Apache-2.0): <https://github.com/anthropics/claude-plugins-official/blob/main/LICENSE>
- Plugin manifest: <https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/.claude-plugin/plugin.json>
- Plugin README (identical blob in both repos, `00cd435c88bc23614422a12494488bd5b3bd255b`): <https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/README.md>
- Migration note ("plugins are developed in claude-plugins-official … copies here are stale"): <https://github.com/anthropics/claude-code/blob/main/plugins/README.md>
- Proprietary license of the stale copy: <https://github.com/anthropics/claude-code/blob/main/LICENSE.md>
- Ticket's URL (stale variant): <https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md>
- Companion notebook (pointer only, not read): <https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb>
- Local grounding: `skills/prototype/SKILL.md`, `skills/prototype/UI.md`, `skills/poteto-mode/playbooks/prototype.md`, `vendor-manifest.txt`, `LICENSE`
