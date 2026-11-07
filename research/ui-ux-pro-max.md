# ui-ux-pro-max — mechanisms behind the design loop

**Question.** What does `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` actually provide? Extract (1) its audit/checklist system (categories, severity, scoring); (2) its polish/redline iteration loop against an existing UI; (3) how findings become actionable changes; (4) what is adoptable for our redline/polish prototype scenario branch (variants explored on the real page via `?variant=`, winner folded back into real code), with provenance and license; (5) what to skip.

**Source.** `nextlevelbuilder/ui-ux-pro-max-skill` at commit `b7d5353e0130feb8c5574ef1251f8a1db1873ccb` (2026-11-05, branch `main`), read as a sparse shallow clone plus raw-file fetches. Every claim below cites the file that owns it. Repository-wide greps were run over all 706 tracked files to establish negative findings.

**Method.** Read every file that implements the loop: `stack/.claude/agents/design-review.md`, `stack/.claude/commands/design-review.md`, `stack/.claude/commands/design-plan.md`, `stack/scripts/design-audit.mjs`, `stack/CLAUDE.md`, `stack/docs/{WORKFLOW,STACK,SETUP}.md`, `stack/.github/workflows/design-review.yml`, `stack/examples/juniper-audit/`, `.claude/skills/ui-ux-pro-max/SKILL.md`, `references/{quick-reference,pro-rules}.md`, `scripts/reasoning_contract.py`, and the `data/` CSV schemas. Nothing in the upstream repo was executed (its script needs a browser and a live server); the schemas were parsed locally to compute category/severity distributions. No upstream file was modified.

**License.** MIT, `Copyright (c) 2024 Next Level Builder` (root `LICENSE`); `skill.json` declares `"license": "MIT"`, version `2.15.0`. The `stack/` directory carries no separate license and inherits the root MIT. One adjacent skill is *not* MIT: `.claude/skills/ui-styling/` ships its own Apache-2.0 `LICENSE.txt`.

## The answer in one paragraph

The repo is two different products wearing one name. The **knowledge half** (`ui-ux-pro-max` skill: a BM25-searchable CSV database of styles, palettes, font pairings, icons, charts, GSAP presets, and stack guidance, plus a design-system generator) is greenfield design-system machinery and is largely orthogonal to a polish branch over an existing page. The **loop half** (`stack/`: a headless heuristic audit script, a 7-phase taste-level reviewer subagent, and a CI gate) is the part that matters to us. That half has a real, cheap severity system — `high/medium/low` in the script, `Blockers/High/Medium/Nitpicks` in the reviewer, `Critical/High/Medium/Low` in the rule CSV — and **no numeric score anywhere**; the only `score` in the codebase is BM25 search relevance. The iteration loop is prose, not machinery: *see it → review it → fix it → re-screenshot it*, anchored on the rule "Never report UI work done without step 4" and "Re-screenshot after every fix". Findings become actionable because every finding must carry evidence and be written as observation → principle → fix, and because each finding maps onto a *named* rule id (`focus-not-obscured`, `tap-target-size`) that resolves to a Do/Don't row with working code examples. For our redline branch this yields four genuinely adoptable pieces (the severity taxonomy and gate policy, the per-URL audit script as a per-variant mechanical gate, the 7-phase review checklist, and the evidence discipline) and one critical gap: **upstream has no variant machinery at all** — no `?variant=`, no comparison, no winner selection, no fold-back — so the variant loop is ours to design, and the only upstream idea that transfers directly is the *per-URL audit script*, which we drive once per variant and compare ourselves.

## 1. The audit/checklist system

There are three distinct severity systems, deliberately layered. They do **not** share a scale.

### 1a. Heuristic audit script — `stack/scripts/design-audit.mjs`

A standalone Node + Playwright script ("standalone, MCP-free design audit"). It opens a page in Chromium, screenshots it across viewport tiers, and runs in-page heuristic checks.

- **Viewports (6):** `mobile-360` (360×800), `mobile-390` (390×844), `tablet-768`, `laptop-1024`, `desktop-1440`, `wide-1920` (1920×1080).
- **Check ids (10):** `horizontal-overflow`, `unsized-media`, `img-alt`, `tap-target`, `focus-visible`, `accessible-name`, `headings`, `viewport-meta`, `html-lang`, `contrast`. Console errors and `pageerror` events are collected separately and reported as a distinct section.
- **Severity (3):** `high`, `medium`, `low`. Assigned per check, e.g. horizontal overflow is `high`, unsized media and tap targets and contrast are `medium`, multiple `<h1>` is `low`.
- **Scoring:** none. There is no number, no percentage, no pass rate. The output is a count per severity — `**Findings:** 2 high · 2 medium · 0 low` (see `stack/examples/juniper-audit/report.md`).
- **Deduplication:** findings are keyed by `check + message` and accumulate the list of viewports where they fired (`↳ seen at: mobile-360, mobile-390`), so one defect seen at 6 tiers is one finding with a viewport list, not six findings.
- **Gate:** `process.exit(counts.high > 0 ? 2 : 0)` — any `high` finding fails the run. This is a real CI gate, not advisory: `stack/.github/workflows/design-review.yml` runs the script on PRs touching `*.html|css|jsx|tsx|vue|svelte|astro`, uploads `report.md`/`report.json`/screenshots as an artifact, then has a second step "Fail on high-severity findings" that re-runs the script and fails the job on its exit code.
- **Outputs:** `report.md` (grouped by severity, per-finding viewport list), `report.json` (`{target, consoleErrors, findings[]}` — machine-readable), and one full-page PNG per viewport.
- **Honesty about its own limits**, stated in the file header: "Heuristic, not a substitute for the /design-review subagent (which also judges taste, interaction flows, and edge cases). Use this in CI and for a fast local pass." and "Contrast is approximate (nearest opaque background); treat as a lead, not a verdict."
- **One practical trick worth stealing:** `autoScroll()` scrolls the whole page before screenshotting, because without it "full-page screenshots of scroll-reveal sites capture blank sections (content still at opacity:0) — a common false 'blank section' reading."

### 1b. Taste-level reviewer — `stack/.claude/agents/design-review.md`

A senior-design-reviewer subagent (`model: sonnet`, tools `mcp__playwright, mcp__chrome-devtools, Read, Grep, Glob, Bash`). Its operating principle: "You do not guess from the code; you **open the page in a real browser and observe it**. Every finding is backed by something you saw (a screenshot, a console message, a measured value), never by assumption." Before reading source it interacts with the running UI like a user.

- **Phases (7):** Phase 0 setup (open at 1440×900, baseline screenshot, note console errors immediately) → Phase 1 interaction & user flows (hover/active/disabled states exist and differ; destructive actions guarded; loading/empty/error states handled) → Phase 2 responsiveness (screenshot each tier; horizontal scroll, clipping, shrinking images, tap targets <44×44, nav that doesn't collapse) → Phase 3 visual polish (spacing rhythm, alignment, type scale, radii/shadows/borders token discipline, colour harmony, "decoration that serves nothing") → Phase 4 accessibility WCAG 2.1 AA (focus visible and ordered, no keyboard traps, one `h1`, landmarks, labels, `alt`, contrast ≥4.5:1 body / ≥3:1 large text & UI, `prefers-reduced-motion`) → Phase 5 robustness/edge cases (long strings, empty data, slow network, invalid input) → Phase 6 console & health (errors, failed requests, 404 assets, layout shift, oversized payloads).
- **Severity (4):** `Blockers` (breaks usability or fails AA — must fix), `High` (significant, fix before merge), `Medium` (polish; noticeably better if fixed), `Nitpicks` (each prefixed "Nit:"). A fifth section, **"What's working"**, calls out good decisions so they are preserved.
- **Scoring:** none. A categorical **verdict** instead: `Ship` / `Ship with fixes` / `Needs work`, alongside "Viewports checked: 375/768/1024/1440/1920".
- **Gate policy:** "Distinguish 'broken' from 'I'd prefer.' Only Blockers/High should gate merging." The command file (`stack/.claude/commands/design-review.md`) repeats it: "Fix Blockers and High-severity findings before reporting the work as complete."
- **Fallback:** "If you could not open the page, say so plainly and report only the heuristic-script results — never invent findings."

**Discrepancy to note:** the reviewer checks 5 viewport tiers starting at **375**, while the heuristic script uses 6 tiers starting at **360 and 390**. They are not the same ladder. Any adoption must pick one list or state the mapping.

### 1c. Rule/checklist data — `data/ux-guidelines.csv` and `references/quick-reference.md`

`ux-guidelines.csv` has **119 rows** with columns `No, Category, Issue, Platform, Description, Do, Don't, Code Example Good, Code Example Bad, Severity`.

- **Categories (20):** Accessibility, Animation, AI Interaction, Content, Data Entry, Feedback, Forms, Forms / Accessibility, Interaction, Layout, Navigation, Onboarding, Performance, Responsive, Search, Security / Accessibility, Spatial UI, Sustainability, Touch, Typography.
- **Severity (4):** `Critical` 4, `High` 44, `Medium` 62, `Low` 9.
- **Platform:** `All`, `Mobile`, `VisionOS`, `Web`.
- Each rule ships a positive and a negative code example, so a finding resolves to a concrete before/after snippet.

`references/quick-reference.md` is the static index of the same rules, organised into the **10 priority categories** with an impact tier each — 1 Accessibility (CRITICAL), 2 Touch & Interaction (CRITICAL), 3 Performance (HIGH), 4 Style Selection (HIGH), 5 Layout & Responsive (HIGH), 6 Typography & Color (MEDIUM), 7 Animation (MEDIUM), 8 Forms & Feedback (MEDIUM), 9 Navigation Patterns (HIGH), 10 Charts & Data (LOW) — each listing "Key Checks (Must Have)" and "Anti-Patterns (Avoid)". Rules are addressed by kebab-case id (`focus-not-obscured`, `tap-target-size`, `color-contrast`, `skip-links`, `reduced-motion`) with an authority citation inline (WCAG 2.2 AA/AAA, Apple HIG, Material, WAI). The file's own header states its purpose for us: "Load this file when doing a UI review/audit pass."

`references/pro-rules.md` adds a **"Pre-Delivery Checklist (canonical — the only one)"** of ~35 boolean checkboxes in six areas (Process, Visual Quality, Interaction, Light/Dark Mode, Layout, Accessibility). It is boolean, not scored — and it is explicitly **scoped to native/mobile app UI** (safe areas, 44pt/48dp, Dynamic Type, iOS/Android); its scope notice says "For web/desktop interaction patterns, use `references/quick-reference.md` … instead".

`SKILL.md` carries the same 10-category table as the "Rule Categories by Priority" and states the search discipline: `--domain ux` / `--domain web` for the rule corpus, one dominant intent per query, retry once if empty, and **never present a 0-result search as if it returned data**.

## 2. The polish/redline iteration loop against an existing UI

The loop is documented in three places and is entirely **prose instructions to the agent**, not an automated harness.

- `stack/CLAUDE.md` — "The design loop (follow in order)": 1 **PLAN with data** (`ui-ux-pro-max` design-system generator) → 2 **COMMIT to an aesthetic** (`frontend-design`) → 3 **BUILD** → 4 **SEE IT** (Playwright / Chrome DevTools MCP) → 5 **REVIEW** (`/design-review`). Step 4 is the pivot: "You are not done when the code compiles. Open the page in a real browser, screenshot it, read the console, exercise interactive states (hover, focus, open menus, submit forms), and resize the viewport. Fix what you see — z-index, animation timing, layout shift, overflow. This feedback loop is the whole point of the stack; a change you have not looked at is not finished."
- `stack/docs/WORKFLOW.md` — the same loop as a worked example on a pricing section, ending in "It fixes each and re-screenshots." Its "Rules of thumb" are the loop's contract: "**Never report UI work 'done' without step 4.** If you didn't look at it, it isn't finished."; "**Blockers/High gate merging; Medium/Nit don't.** Keep momentum; don't bikeshed nitpicks."; "**Re-screenshot after every fix.** The loop is cheap; regressions are not."; and the division of labour "Let `ui-ux-pro-max` set tokens, `frontend-design` set attitude. Data for correctness, taste for distinctiveness."
- `stack/docs/WORKFLOW.md` also has the explicit "same loop for an existing site" section — `npm run audit -- --url https://your-site.com` (fast heuristic pass + screenshots) and `/design-review https://your-site.com/pricing` (full review with taste + flows). This is the closest upstream analogue to our redline branch: auditing something already deployed.

**What the loop is not.** There is no "redline" concept in the repository at all (`git grep -in "redline"` → zero hits). There is no variant mechanism: `git grep -in "\bvariant"` across all 706 tracked files returns only *design-token and component-state* variants (`states-and-variants.md`, `--{category}-{item}-{variant}-{state}` token names, logo/banner variant sets) — never an experiment variant, an A/B arm, or a `?variant=` query parameter. There is no comparison between two renders, no winner selection, no fold-back, no iteration cap, and no automatic fix loop: the reviewer reports, and the *main* agent applies the fixes and re-screenshots.

**How the loop terminates.** Blockers and High are fixed before the work is called complete; Medium and Nit are explicitly allowed to survive. Re-screenshotting after every fix is the regression guard.

## 3. How findings become actionable changes

Three mechanisms, in ascending strength.

**(a) Evidence binding.** "Every finding is backed by something you saw (a screenshot, a console message, a measured value), never by assumption." Screenshots are anchored per phase ("Take a screenshot at the start of each visual phase so findings are anchored to evidence"). Findings that cannot be evidenced must not be reported at all: "If you could not open the page, say so plainly … never invent findings."

**(b) A fixed finding shape.** The report template is:

```
### Blockers        (breaks usability or fails AA — must fix)
- [What you observed] → [why it fails] → [the fix]  · evidence: <screenshot/console>
```

with the rule "Start every problem with the **observation**, then the principle, then the fix. Assume competence — explain the *why*, don't prescribe pixel values unless asked." So a finding is not a complaint; it is an observation plus a rule plus a remedy, and it is already written in the shape of a work item.

**(c) A nameable rule behind the finding.** The rule corpus is addressed by id, so a finding is not free-form taste: `focus-not-obscured` (WCAG 2.2 AA), `tap-target-size` (Apple HIG / Material), `color-contrast`, `reduced-motion`, `web-target-size`, `dragging-alternative`, `auto-rotation-controls`. Each id resolves to a `ux-guidelines.csv` row with `Do`, `Don't`, and good/bad code examples. That is what makes a finding actionable rather than arguable: the reviewer observes a defect, the rule corpus names the standard it violates, and the row supplies the replacement code.

A fourth, separate mechanism — the **closed reasoning contract** (`scripts/reasoning_contract.py`) — is the repo's one instance of findings-to-machine-checkable-output, but it belongs to the design-system half, not the audit half. It parses `ui-reasoning.csv`'s `Decision_Rules` JSON as a *non-executable grammar*: conditions (`must_have` plus 35 signal conditions such as `if_checkout`, `if_dashboard`, `if_trust_needed`, `if_low_performance`) map to actions with fixed prefixes `style:` / `constraint:` / `pattern:` / `mode:`, values are validated against a token regex, and `apply_decision_rules()` returns a deterministic mutation plus an audit trail — "Return deterministic mutations and an audit trail; never execute data." The docstring calls it a "Closed, non-executable grammar for design-system decision rules." Worth noting as a pattern for how our branch could make its own winner-selection rule deterministic and inspectable.

## 4. What is adoptable for our redline/polish branch

Our branch's shape, per the wayfinder map: explore variants on the real page via `?variant=` (throwaway), fold the winner back into real code (kept), with a triple completion gate — runnable with one command / verification executed with evidence / capture done.

### Adopt (with provenance)

| # | Mechanic | Source | Why it fits our branch |
|---|---|---|---|
| A1 | **Severity taxonomy + gate policy**: `Blockers/High` gate the merge; `Medium/Nit` do not. | `stack/.claude/agents/design-review.md` ("Only Blockers/High should gate merging"); `stack/docs/WORKFLOW.md` | Text-only, MIT, and it gives our branch the same "keep momentum, don't bikeshed" rule that stops a polish loop from never terminating. |
| A2 | **Heuristic audit as a per-variant mechanical gate.** | `stack/scripts/design-audit.mjs` + `stack/.github/workflows/design-review.yml` | The script takes `--url` and does **not** care what the URL contains, so `?variant=a` and `?variant=b` are just two URLs. Each variant gets its own `report.json`; the `high > 0 → exit 2` rule becomes a per-variant pass/fail, and the JSON is the comparison input. This is the single highest-value adoptable piece. |
| A3 | **7-phase review checklist** as the reviewer's phase list for one variant. | `stack/.claude/agents/design-review.md` | Phases 1–6 are written as observable checks on a live page, which is exactly what a variant page affords. Phase 3 (visual polish) and Phase 4 (WCAG AA) are the ones that discriminate between variants. |
| A4 | **Evidence discipline**: every finding anchored to a screenshot / console / measured value; "never invent findings"; a "What's working" section to preserve good decisions. | same file | Maps directly onto our gate "verification executed with evidence (screenshot or observed output)". The "What's working" section also protects the parts of the current page a variant must not regress. |
| A5 | **"Re-screenshot after every fix"** + **"never report UI work done without step 4"**. | `stack/docs/WORKFLOW.md`, `stack/CLAUDE.md` step 4 | This is our capture gate's counterpart: every fix to the winner must be re-verified against the live page before the variant switch is removed. |
| A6 | **Rule corpus as the checklist content**: 10 priority categories + severity-tagged 119-rule CSV, addressed by rule id. | `SKILL.md` priority table, `data/ux-guidelines.csv`, `references/quick-reference.md` | Gives our branch a checklist that is (i) severity-tagged, (ii) citable by id, (iii) resolvable to Do/Don't code examples — i.e. findings land as work items with a known standard. |
| A7 | **Rule-locating discipline**: search one dominant intent per query, retry once with a narrower rewrite, and never present a 0-result search as if it returned data. | `SKILL.md` "If a search returns 0 results" | A discipline we can state in our branch file as-is; it prevents fabricated checklist hits. |
| A8 | **autoScroll before screenshot** to avoid false "blank section" readings on scroll-reveal pages. | `stack/scripts/design-audit.mjs` (`autoScroll`) | A one-function fix that prevents a whole class of false findings in our variant screenshots. |
| A9 | **A deterministic, auditable decision grammar.** | `stack/scripts/reasoning_contract.py` | Not for audits — a *pattern*. If our branch needs a machine-checkable "which variant wins" rule, this shows how to encode conditions → actions in a closed grammar with an audit trail instead of prose. |

**Provenance and license obligations for the above.**

- Root `LICENSE`: MIT, `Copyright (c) 2024 Next Level Builder`. MIT requires the copyright notice and permission notice to be included in "all copies or substantial portions of the Software". So **copying** `design-audit.mjs` or the `ux-guidelines.csv` into our repo means shipping the MIT notice with it (our repo's `vendor-manifest.txt` / inline-credit convention applies — same discipline the pack already uses for vendored pstack content).
- **Referencing without copying** — running the script from an upstream checkout, or citing rule ids and thresholds in our branch file — does not trigger the notice requirement, but we should still credit the source by URL, license and commit, exactly as our repo requires for external references.
- The `stack/` half inherits the root MIT; it has no separate license file.
- **Not MIT:** the `frontend-design` taste skill that `stack/` depends on is Anthropic's, from `anthropics/claude-code` (`stack/docs/STACK.md`), so its text must not be vendored under the MIT umbrella. The `.claude/skills/ui-styling/` skill in the same repo ships its own **Apache-2.0** `LICENSE.txt`.
- The knowledge half's `data/` CSVs also carry per-asset provenance of their own (`data/data-provenance.json`, `data/google-font-licenses.json`, `data/phosphor-icons-upstream.json`) — check those before copying any palette, font, or icon data.

**A concrete shape for our branch, using only adopted pieces.** For each candidate variant id: (1) run the heuristic audit against `?variant=<id>` → per-variant `report.json` + screenshots; (2) run the 7-phase review against the same URL; (3) fix, then re-screenshot (A5); (4) compare variants on the gate policy (A1) plus the review's severity counts; (5) fold the winner into real code, remove the `?variant=` switch, re-audit the folded page; (6) archive the decision and a pointer to the evidence. The one step upstream does **not** supply is the comparison-and-winner rule in (4) — see the gap below.

### Do not adopt (skip list)

- **The whole knowledge half as a mechanism.** The 80 styles / 192 palettes / 74 font pairings / 105 icons / 17 GSAP presets / 25 chart types / 22 stacks database, its BM25 `search.py` CLI, and the `--design-system` generator exist to *mint* a design system for new surfaces. Our redline branch works on an existing page that already has its tokens. Adopting the search tool would create a second mechanism owner, which the wayfinder map forbids ("Webapp verification … reuses `playwright-cli`; no new mechanism owner"), and would require shipping a Python CLI plus CSVs.
- **`--design-system --persist`** and its `design-system/<slug>/MASTER.md` + `pages/<page>.md` override convention. This mints a competing source of truth for tokens; a polish branch must not create one.
- **`/design-plan` and the `frontend-design` aesthetic step** (purpose/tone/constraints/differentiation, one signature element, rejecting the three "AI-slop" defaults). That is the design-doc→UI branch's job; a polish branch must *not* re-commit the aesthetic, or every polish becomes a redesign.
- **Third-party tool bindings**: shadcn MCP, `@playwright/mcp`, `chrome-devtools-mcp`, 21st.dev Magic MCP, Figma Dev Mode MCP. The reviewer subagent's `tools:` frontmatter hard-binds `mcp__playwright` and `mcp__chrome-devtools`; our harness has `playwright-cli` instead. Port the *checklist*, not the tool binding — that belongs in our harness/adapter layer, not the skill content.
- **`references/pro-rules.md`** (the canonical native-app pre-delivery checklist). It is explicitly scoped to iOS/Android/React Native/Flutter — safe areas, 44pt/48dp targets, Dynamic Type, platform gestures — and says so itself. For web, use the priority table plus `ux-guidelines.csv`. Adopting it would import an inapplicable standard.
- **`stack/scripts/design-audit.mjs`'s single-target assumption** as *our* branch mechanism: it audits one URL and reports; it does not compare two runs. We drive it once per variant and compare ourselves. Also keep its contrast result as "a lead, not a verdict" — nearest-opaque-background estimation will produce false contrast findings on gradients, images, and translucent overlays.
- **The repo's other bundled skills** (`brand`, `design`, `slides`, `banner-design`, `design-system`, `ui-styling`) and the gallery/Next.js showcase, the `cli/` npm packaging, and the seven translated READMEs. All irrelevant to a polish branch.

### The gap we must design ourselves

Upstream provides **no** variant exploration, comparison, winner selection, or fold-back mechanism — verified by grep over all 706 tracked files, where "variant" appears only as design-token/component-state variants and "redline" appears zero times. Nor does it provide a numeric score (the only `score` in the codebase is BM25 search relevance in `scripts/core.py`). Consequently our branch needs its own:

- **Winner-selection rule.** The upstream policy is severity-based and binary ("Blockers/High gate"), which is enough to *reject* a variant but not to *rank* two survivors. A workable candidate: reject any variant with an open Blocker/High; among survivors prefer the one with fewer Medium findings, then the one with no console errors and no horizontal overflow at any tier; break a remaining tie by an explicitly recorded human/agent pick, written into the capture note. **This is our design decision, not an upstream one, and must be labelled as such in the branch file.**
- **A comparison artifact.** Upstream produces one report per target and never compares them. We need a variant-comparison record (per-variant `report.json` paths, screenshot paths, the selection rule, and the winner) — which fits our capture gate ("decision folded back + archived pointer").
- **Fold-back verification.** Upstream never edits code inside the review loop, so it has no notion of "the winner is now the real page". Our gate must require re-auditing the page *after* the variant switch is removed, since folding back can itself introduce regressions.

## 5. Summary table

| Question | Answer |
|---|---|
| Audit categories | 10 heuristic check ids (script); 7 review phases (reviewer); 10 priority categories + 20 CSV categories (rule corpus) |
| Severity | 3 (`high/medium/low`, script) · 4 (`Blockers/High/Medium/Nitpicks`, reviewer) · 4 (`Critical/High/Medium/Low`, 119-rule CSV) · impact tiers `CRITICAL/HIGH/MEDIUM/LOW` (SKILL.md table) |
| Scoring | **None.** Counts per severity + a categorical verdict (`Ship` / `Ship with fixes` / `Needs work`). Only numeric `score` in the repo is BM25 search relevance |
| Iteration loop | Prose: see → review → fix → re-screenshot; gate on Blockers/High; Medium/Nit allowed to survive; no automation, no cap |
| Findings → changes | Evidence-bound (screenshot/console/measured value); fixed shape observation → principle → fix; each resolves to a named rule id with Do/Don't and code examples; design-system half adds a closed non-executable condition→action grammar |
| Adopt for redline | Severity taxonomy + gate policy; the per-URL audit script as a per-variant gate; the 7-phase checklist; evidence discipline; re-screenshot rule; rule corpus as checklist content; autoScroll trick; the closed-grammar pattern for our winner rule |
| Skip | Knowledge half and `search.py` CLI; `--design-system`/`--persist` token minting; `frontend-design` aesthetic step; shadcn/Playwright-MCP/Chrome-DevTools/21st.dev/Figma tool bindings; `pro-rules.md` native-app checklist; the script's single-target assumption as our mechanism; the other bundled skills and the gallery/CLI packaging |
| License | MIT (root `LICENSE`, `skill.json`), © 2024 Next Level Builder — notice required on copies. `stack/` inherits it. `frontend-design` is Anthropic's; `ui-styling` is Apache-2.0 |

## Provenance of this note

- Upstream: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` @ `b7d5353e0130feb8c5574ef1251f8a1db1873ccb` (2026-11-05), MIT.
- Files read in full: `stack/.claude/agents/design-review.md`, `stack/.claude/commands/{design-review,design-plan}.md`, `stack/scripts/design-audit.mjs`, `stack/CLAUDE.md`, `stack/docs/{WORKFLOW,STACK}.md`, `stack/.github/workflows/design-review.yml`, `stack/examples/juniper-audit/{report.md,README.md}`, `.claude/skills/ui-ux-pro-max/SKILL.md`, `.claude/skills/ui-ux-pro-max/references/{quick-reference,pro-rules}.md`, `.claude/skills/ui-ux-pro-max/scripts/reasoning_contract.py`, `LICENSE`, `skill.json`.
- Schemas computed locally: `data/ux-guidelines.csv` (119 rows, 20 categories, severity histogram), `data/ui-reasoning.csv` (192 rows, column schema).
- Greps over all 706 tracked files: `redline` (0 hits), `\bvariant` (design-token/component-state only), `score` (BM25 relevance only).
- Nothing upstream was executed or modified.
