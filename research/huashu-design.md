# huashu-design: mechanics, provenance, and what a design-doc→UI branch can adopt

**Question.** What does https://github.com/alchaincyf/huashu-design actually do, mechanically? Extract (1) its design-document structure and how the doc drives UI generation; (2) its generation/iteration flow (steps, artifacts, checkpoints with the user); (3) variant and review strategy; (4) what is adoptable for a design-doc→UI prototype scenario branch (techniques, doc schema, stage gates), with provenance and license; (5) what is not worth adopting and why.

**Source of truth.** `alchaincyf/huashu-design` at tag **v3.2.0** (commit `62c936f1f15d27f67cd820be43879bf5e98e8e34`), read from a fresh shallow clone at `/tmp/huashu-design` whose HEAD is `b2460b0` ("docs: DSH 命令行安装前要先打开过一次桌面端"), i.e. one commit past the v3.2.0 tag. `SKILL.md` declares `metadata.version: "3.2.0"` and `metadata.author: "花叔"`. Tags present: `v2.0`, `v3.0.0`, `v3.1.0`, `v3.2.0`.

**Method.** Read every primary source in the repo: `SKILL.md`, `references/directions.md`, `references/workflow.md`, `references/critique-guide.md`, `references/multi-perspective-parallel-case-study.md`, `references/evolution.md`, `references/materials.md`, `references/design-context.md`, `references/tweaks-system.md`, `references/verification.md`, `references/app-prototype.md`, `references/modules/web.md`, `references/experience.md`, `scripts/design_lint.py`, `scripts/learn.py`, `scripts/capabilities.py`, `scripts/ref_board.py`, `scripts/design-gate-hook.sh`, `test-prompts.json`, `LICENSE`. Note: the zread MCP snapshot of this repo is stale (it serves the ~v2 SKILL.md without `references/modules/`, `scripts/design_lint.py`, `scripts/learn.py`, or `references/directions.md`); all claims below come from the local clone, not from zread.

**License.** **MIT**, `Copyright (c) 2026 alchaincyf (花叔 · 花生)` — `LICENSE`, 21 lines, unmodified MIT text. MIT requires the copyright notice and permission text to be included in copies or substantial portions; it does not require source disclosure for ideas, but any copied prose or code must carry the notice. Attribution is therefore cheap and mandatory for anything lifted verbatim.

## The answer in one paragraph

huashu-design is a single agent skill (one `SKILL.md` + ~40 reference files + ~20 scripts) that turns "make me a design" into a gated, mostly-mechanical pipeline whose output is a single-file HTML artifact. Its central mechanism is a **mandatory three-direction gate**: before any new visual design is executed, the agent must produce three *real rendered* candidates, show them, stop the turn, and record the user's verbatim choice in a file. Direction diversity is manufactured by three orthogonal "logics" (best-fit designer, verified real-world reference, random style draw from a 60-style library) each run twice, six cheap thumbnails first, then three full builds. The "design document" layer is thin and unusual: it is not a spec that compiles into UI, it is a set of **five small markdown artifacts written into the project directory** (`product-facts.md`, `brand-spec.md`, the Phase-3 spec, `directions.md` direction cards, `direction-approved.md`), where the *spec* deliberately says only WHAT to communicate and the *direction card* owns HOW it looks. Checkpoints are materialized as files ("文件不在 = 环节没做") and one is even machine-enforced by a Bash `PreToolUse` hook that blocks renders over 45 s. Review is a 6-dimension 0-10 rubric with a concept veto rule, applied per-scenario with different weightings. The reusable intellectual core for a design-doc→UI branch is: the spec/card split, the six-candidate→thumbnail→three-full-build funnel, the four pick criteria in fixed order, the gate-file protocol, the readability floors, and a deterministic lint script as a pre-delivery gate. What should be dropped: the random roulette, the designer-persona/reference-hunting logics, the 60-style library, the motion/PPTX/XHS export surface, the Claude-Code-specific hook, and the local `~/.huashu-design` ledger machinery.

---

## 1. Design-document structure and how the doc drives UI generation

### 1.1 There is no single design doc; there are five artifacts with different owners

| Artifact | Written when | Owner | What it contains | Source |
|---|---|---|---|---|
| `product-facts.md` | Before asking anything | agent | WebSearch-verified facts: existence, release status, version, key specs | `SKILL.md` 窄桥 §0; `references/workflow.md` step 1 |
| `brand-spec.md` | Asset protocol done | agent | logo / product shots / UI screenshots / palette / type / taboos / mood, all as paths | `SKILL.md` 窄桥 §2; `references/brand-asset-protocol.md` |
| **Phase-3 spec** | After clarification, before any build | agent | The single shared input to all direction workers | `references/directions.md` Phase 3 |
| **`directions.md` direction cards** | During candidate generation | agent (one card per candidate) | Six fields per candidate, incl. "what is borrowed" and "form comes from where" | `references/directions.md` 4b |
| `direction-approved.md` | After the user picks | agent, from user's words | Which versions were shown, screenshot paths, **user's verbatim choice** | `SKILL.md` 窄桥 §6 |

The Phase-3 spec is explicitly required to cover: what the project is; target audience and usage scenario; core message and content points, itemized; emotional tone and mood keywords; **output format and dimensions (mandatory — all three versions must share them or they cannot be compared side by side)**; known constraints (brand colors, taboos, required elements); image needs; and the visual-motif hypothesis. The source is emphatic about one boundary: *"spec 只写「要说什么」，不写「长什么样」——长什么样是方向卡的事"* — the spec states what to say, the direction card owns what it looks like (`references/directions.md`, Phase 3). Earlier revisions stated the same as "≥500 words" (`SKILL.md`, older revision), the current revision states it as a content checklist without a word count.

### 1.2 The direction card is the real "how" document

`references/directions.md` §4b defines a fixed 6-field card, one per candidate, all written into the project directory as `directions.md`:

1. **Logic and source** — which designer / which work (with reference-board path) / which style number was drawn.
2. **What is borrowed** — the *concrete rules* extracted from that source: grid columns, headline-to-body type ratio, primary-color proportion, image-text relation.
3. **Protagonist material** — what carries the picture: real photo, generated image, procedural texture, data-as-image, giant type ("档位见 references/materials.md").
4. **Skeleton** — the layout structure in one sentence.
5. **Where the boldness goes** — the single boldest move; everything else serves the content.
6. **Form comes from where in the content** — one sentence naming the thing in *this* subject that another subject would not have.

Fields 5 and 6 are the load-bearing ones for a doc-driven flow: they force the design to be derived from the subject matter instead of from a style label. Field 6 is mirrored as a delivery obligation elsewhere: every delivery must contain one sentence "form 来自内容的哪里"; if you cannot write it, you are applying a template (`references/workflow.md` step 3; `references/critique-guide.md` dimension 0).

### 1.3 How the doc drives generation

The spec is copied verbatim into every direction worker; each worker additionally gets **only its own card** plus the shared material set. Workers run in parallel, with **independent contexts and no visibility of each other** — `references/directions.md` Phase 4: "三个 subagent 独立 context、互不参考（避免趋同）". The doc is thus a *fan-out contract*: one shared "what" document, N private "how" documents, one artifact per worker.

The reference-freeze is what makes the doc authoritative rather than advisory: the card, not the model, dictates the skeleton, the borrowed rules, and the protagonist material. The build step restates the same constraints as rules — real user content (never Lorem ipsum), same content across all versions so only design differs, three different skeletons, readability floors (§3.4), single-file HTML with base64-embedded images (`references/directions.md` Phase 5).

### 1.4 The UI module's own sequence

`references/modules/web.md` is the closest thing to a UI-generation contract:

1. Three directions: each version = 1 full HTML + first-screen screenshot + full-page long screenshot.
2. After selection: write assumptions + placeholder structure for the user first, then fill in components (`references/workflow.md`).
3. Only after structure and rhythm are settled, add Tweaks so the user can tune color, size, copy.

Hard rules there: body ≥14 px (mobile 16 px), tappable elements ≥44×44 px, body contrast ≥4.5:1; verify at least 1440 and 375 widths with `scripts/verify.py`; navigation/tab/expand/form states must actually work with zero console errors; no fabricated data, testimonials, or logo walls; motion should be one orchestrated page load rather than every section fading up.

---

## 2. Generation / iteration flow: steps, artifacts, checkpoints

### 2.1 Pre-flight (non-blocking, seconds)

`SKILL.md` "开工三件事":

```bash
python3 "$HD/scripts/learn.py" <topic words…>      # this user's stated preferences + past lessons
python3 "$HD/scripts/design_lint.py" ledger        # looks of recent deliveries — avoid repeating them
python3 "$HD/scripts/capabilities.py"              # what tools/skills/keys exist → which material tier
```

All three are explicitly non-blocking; a missing record just means "continue". `$HD` is the skill root, not the user's project directory — a detail the repo itself records as a hard-won pitfall (`references/evolution.md` 坑账本: relative `scripts/…` paths mean the evolution mechanism is silently skipped).

### 2.2 The shared "narrow bridge" (窄桥)

All output modules (web/deck/infographic/XHS/motion/app) share the same seven-step bridge before any module-specific work (`SKILL.md` 窄桥):

0. Fact verification before assumption → `product-facts.md`.
1. Start from existing context (design system, codebase, live product, brand kit, competitor) — `references/design-context.md`.
2. Brand asset protocol → `brand-spec.md` (ask → search official channels → download → verify → freeze into the spec).
3. **The three-direction gate** (100%, no exemptions for a named style or brand).
4. Materials first, by capability tier T0/T1/T2 (`references/materials.md`).
5. Strip template decoration, keep content honest, enforce readability floors.
6. Gate files must exist.

### 2.3 The three-direction flow (references/directions.md, Phase 1-7)

- **Phase 1 — clarify + demand references.** One round only, max 3 questions (audience / core message / tone / output format), plus one message listing every asset wanted (logo, brand colors, VI, type spec, references). If the user never answers, do not wait: fill in assumptions and continue.
- **Phase 2 — consultant restatement.** Restate the underlying need in your own words (≥200 words in the older revision), ending with "I will make three real versions for you", explicitly *not* ending with "which direction do you want?" — a choice made before seeing anything is invalid.
- **Phase 3 — freeze the spec** (§1.1 above).
- **Phase 3.5 — materials first.** Decide whether images are content-required; fetch real images and every named product's official logo *before* spawning workers; embed as base64 for single-file delivery. Three-level fallback on fetch failure (public-domain → Unsplash/Pexels → generated → honest placeholder), and the rule that a fetch failure must never stall the flow.
- **Phase 4 — six candidates → six thumbnails → three full builds.**
  - 4a: three logics × two candidates each: **best designer** (which studio/designer would be ideal if budget were unlimited — two with different temperaments, e.g. one bold one restrained, one Western one East Asian), **real-world reference** (two verified, same-medium works — website reference for a website — screenshot them with `scripts/ref_board.py` and actually look at the board; if it cannot be captured, write "未亲眼看到" rather than pretending), **seconds roulette** (`date +%S` → index into the style library partition).
  - 4b: write six direction cards (the six fields above).
  - 4c: one `design-demos/thumbs.html` with six ~480×300 cells, real fonts, real palette, real skeleton, real headline. This is the cheap iteration stage: a thumbnail that looks wrong is redrawn, not discovered after a full build.
  - 4d: pick three, in this fixed order of criteria: (1) good on its own; (2) mutually different (skeleton, temperament, not all in one appearance family); (3) not colliding with the appearance ledger of recent deliveries; (4) not overdone — at most one of the three may be a "prop" page (page dressed as a subway map / terminal / newspaper), and the test is *"if I remove the device, is the information clearer or murkier? clearer ⇒ it's overdone."* The three need not be one per logic.
- **Phase 5 — parallel build + machine self-check.** Each worker: spec + its own card + shared materials only. Then:
  ```bash
  python3 "$HD/scripts/design_lint.py" check design-demos/dir-*.html        # red = must fix
  python3 "$HD/scripts/design_lint.py" compare design-demos/dir-*.html      # two versions colliding?
  python3 "$HD/scripts/design_lint.py" ledger check design-demos/dir-*.html # collides with recent projects?
  ```
  Naming is fixed: `design-demos/dir-1.html` … `dir-3.html`, thumbnails in `design-demos/thumbs.html`.
- **Phase 6 — show, then stop.** Present the three full screenshots plus the card summary and the "form comes from where" sentence, plus the three unused thumbnails as alternates. The turn ends here and waits — explicitly including unattended/autonomous sessions.
- **Phase 7 — after the user chooses.** Write `direction-approved.md` (which versions, screenshot paths, the user's verbatim words). If the user's words contain an explicit taste judgment ("完全不 AI 感", "太素了", "要更像杂志"), record it verbatim via `learn.py add --kind preference` with its scope. If they mixed ("A's layout + C's colors"), record *which fields* were mixed — more useful than the color itself. Then `design_lint.py ledger add <final file> --project <name> --note "<source: designer/work/style>"`.

### 2.4 The main trunk after the direction is chosen (references/workflow.md)

Eight steps with 🛑 checkpoints where the agent must stop and wait:

1. Understand the need (facts already verified at bridge step 0; do not re-ask what Phase 1 asked).
2. Explore resources and extract core assets → `brand-spec.md`.
3. **Answer the form five questions before planning the system**, per page/screen/shot: narrative role (hero/transition/data/quote/ending), audience distance (10 cm phone / 1 m laptop / 10 m projection → decides type size and density), visual temperature (quiet/excited/calm/authoritative/gentle/sad), capacity estimate (sketch three 5-second thumbnails to check overflow), **visual motif** (the element/structure/metaphor unique to this content). Then state the design system aloud. 🛑 Wait for the user's nod.
4. Create the project folder structure.
5. **Alignment pass**: write assumptions + placeholders + reasoning comments at the top of the HTML, show it (grey blocks + labels are enough), wait before writing components.
6. **Full pass**: fill placeholders, make variations, add Tweaks; show again halfway, not only at the end.
7. **Verify**: Playwright screenshots, console-error check, `design_lint.py check` (red must be fixed), 🛑 eyeball the browser yourself.
8. **Deliver and feed back**: summary states only caveats and next steps; `design_lint.py ledger add`; `learn.py harvest`.

Exception table worth stealing verbatim in spirit: if the user says "stop asking, just do it" — questions may be skipped (fill assumptions yourself) but the direction gate still runs; only an explicit "give me one version" downgrades to 1 main + 1 variant, and the user's words must be recorded in `direction-approved.md`. If time is short, skip the alignment pass, do one option, and label the result "未经早期确认".

### 2.5 Checkpoints as files, and the one machine-enforced gate

`SKILL.md` 窄桥 §6: three gate files — `brand-spec.md`, `direction-approved.md`, `导演稿.md` (the last one only for ≥20 s animation). The rule that makes them work: *"文件不在 = 环节没做"* (if the file isn't there, the step didn't happen), and *"「用户说继续」授权的是进入下一步，不是跳过这一步里的 gate"* — "continue" authorizes the next step, not skipping the gate inside it. Any skip must be the user's explicit words, written into the gate file.

The one hard enforcement is `scripts/design-gate-hook.sh`: a Bash `PreToolUse` hook that blocks render commands (`hyperframes render`, `render-video.js`, `render-video-seek.js`, `render-narration.sh`, `npm run render`) of **≥45 s** unless `direction-approved.md` exists in the project directory or two levels up; an auditable escape hatch is `SKIP_DESIGN_GATE=1` in the command. Rationale given in the file: skipping direction confirmation and rendering a 210 s film caused a full-film rework (2026-07-17, B00). The hook is not auto-installed by the skill and never writes files or touches the network.

### 2.6 The three "ledgers" (references/evolution.md)

| Ledger | Content | Where | Written by |
|---|---|---|---|
| Taste profile | the user's verbatim preferences + what he picked/mixed | `~/.huashu-design/experience.md` | `learn.py add` |
| Appearance ledger | fingerprint of every delivery: background class, palette, headline font, layout skeleton | `~/.huashu-design/ledger.jsonl` | `design_lint.py ledger add` |
| Experience & pitfalls | `observed` (one project) / `verified` (reproduced or measured) | same, plus distributed `references/experience.md` | `learn.py add` |

Promotion ladder: record (observed) → reproduce (verified) → reference or must-check → script detection (+ test) → engine default. A lesson that a script can catch becomes a check in `design_lint.py` **with a test**, not prose. The repo ships `scripts/tests/test_design_lint.py` and `test_compare_failures.py`. `learn.py` enforces its own discipline in code: a `preference` entry must quote the user and is rejected if it does not contain a quote mark.

---

## 3. Variant and review strategy

### 3.1 Variants are structural, not cosmetic

The three-direction gate *is* the variant strategy. Three logics, each ×2 = six candidates:

- **Best designer** — "if budget were unlimited, who is the world's best studio for this user and this product?"; invoke their design thinking, do not imitate a specific work.
- **Real-world reference** — a verified, award-winning work **in the same medium** (website → website, app → app, deck → publication), cross-checked with WebSearch, captured with `ref_board.py` into `refs/board.jpg`, then *looked at*; the borrowed content must be written as concrete rules (grid columns, type ratio, color proportion, image-text relation). The repo records the failure mode it fixed: naming a reference produces the model's average impression of that work ("参照写成名字，模型做出来的是它对那个作品的平均印象", `references/evolution.md`).
- **Seconds roulette** — `date +%S` → style index in the matching partition of the 60-style library (web 20 / PPT 20 / infographic 20, plus app, XHS and East-Asian partitions), with specimen images so the agent sees what "done well" looks like before coding.

Non-negotiable parallel constraints: three different skeletons ("不许两版共用同一骨架只换色换字体"), the same real content in all versions, and independent contexts so the workers cannot converge.

### 3.2 The anti-"reskin" machinery is script-based

`scripts/design_lint.py` computes, per rendered page: a 32×20 grayscale layout vector, a 6-color palette in OKLab, heading/body font families, border radius and hairline counts, card-kit repetition, and per-text contrast. From that:

- `compare` flags two versions whose layout vectors correlate too highly (same skeleton = reskin) and warns when all three land in the same **appearance family** — the families it detects are literally "暖奶油底＋衬线大标题", "深底单点缀", "细线报纸", "卡片套件" (`design_lint.py`, `families()`).
- `ledger check` flags a candidate colliding with a recent delivery (same look as last three projects).
- `check` produces **red** (must fix) and **yellow** (template decoration) findings.

The design of the family check is itself a lesson: `references/experience.md` S1 records that the "warm cream + serif + clay accent" family is the *model's own default* (Anthropic's interaction palette), and that the repo's own citation for it is Anthropic's `frontend-design` skill. The family is not banned — only *three-in-one* is.

### 3.3 Post-selection variants: Tweaks

`references/tweaks-system.md`: a floating, collapsible panel bound to `localStorage` (portable across agents, unlike a host `postMessage` integration), with color pickers, size sliders, density selects, and reset. Default recommendation is **2-3 tweaks per design even if the user did not ask**, "so the user can see the possibility space". For purely static comparisons, `assets/design_canvas.jsx` renders labeled side-by-side cells.

The deeper principle is in `references/workflow.md` ("Variations 的深度逻辑"): variations must have an explicit dimension, a gradient from by-the-book to novel, and a short label naming what each explores; the exploration matrix lists seven axes (visual, color, type, layout, density, interaction, material).

### 3.4 Review: a 6-dimension rubric with a veto

`references/critique-guide.md` (v1.0, 2026-02-13) scores 0-10 on six dimensions:

| Dimension | Core test |
|---|---|
| **0. Concept** (weight highest) | "Can you say the idea in one sentence?"; "does it still read with all text and logos covered?"; **"would it still work with a different client name? if yes, it is a template and this dimension caps at 5"** |
| 1. Philosophy alignment | Does it use the chosen designer's/ studio's signature moves, coherently? |
| 2. Visual hierarchy | Headline-to-body ratio ≥2.5×, 3-4 clear levels, squint test |
| 3. Craft quality | 8-pt spacing system, ≤3-4 colors, ≤2 font families, exact alignment |
| 4. Functionality | "Delete any element — does the design get worse? if not, delete it." |
| 5. Originality | Avoids clichés; unexpected but justified decisions |

**Veto rule:** if concept ≤5, the total score is capped at 6.0 — execution cannot rescue a hollow idea. A per-scenario weighting table then shifts emphasis (infographic → functionality + hierarchy; PPT → hierarchy + functionality, originality may be relaxed; landing page → no relaxation; app UI → usability first; XHS → originality + hierarchy).

Output format: total score + band (优秀 ≥8 / 良好 6-7.9 / 需改进 4-5.9 / 不合格 <4), per-dimension one-liners, **Keep**, **Fix** ranked by severity (⚠️致命 / 💡重要 / 🔡优化) each with current state, why it's a problem, and the concrete fix including numbers, plus **Quick Wins** — the top three things to do in five minutes. It also ships a Top-10 problem checklist (AI-tech cliché, insufficient type hierarchy, too many colors, inconsistent spacing, insufficient whitespace, too many fonts, misaligned elements, decoration > content, cyber-neon abuse, density/carrier mismatch) each with a numeric repair.

### 3.5 The multi-perspective case study (6 viewpoints)

`references/multi-perspective-parallel-case-study.md` documents a real 30-second launch-film experiment: 6 artist viewpoints (Wes Anderson, Saul Bass, Wong Kar-wai, Massimo Vignelli, Kenya Hara, Yayoi Kusama) selected for maximal visual distance — 3 geographies, 3 eras, 3 media, each with a signature opposite to generic SaaS aesthetics. Each got an independent **8-field brief** (background, shared reference, deliverables, artist DNA with 6 sub-fields, structure, destination cards, hard constraints, verification checklist + report format), each ran as a parallel subagent with the explicit instruction "do not repeat v5's aesthetics". Facts recorded: 6/6 produced 4000-12000 word director's notes; **~16% subagent failure rate was tolerated** (one socket error, recovered by re-dispatch + a 5-minute simplified brief); parallel delivery took 12-15 minutes vs 90+ minutes sequential. Review used 5 dimensions (distinctiveness, coherence, anti-slop, story arc, pause-and-look) + 3 top-level questions ("screenshot-worthy?", "one line memorable?", "still good in five years?") + use-case allocation. The stated key insight is not "pick a winner" but *"marketing is not single-shot, it is platform-specific multiplex"* — the real value of parallel variants is giving a project several differentiated weapons.

### 3.6 Verification discipline

`references/verification.md` opens with a rule worth stealing: **verify the verifier first**. Before trusting any render, confirm the renderer itself is correct — by rendering a known-good file through the same renderer as a control. Two recorded failures: macOS `qlmanage -t` thumbnails passed 4 text-overlap bugs that appeared in real PowerPoint; LibreOffice rendered Chinese PPTX as tofu boxes. A renderer-independent mechanical check is also specified (character-by-character text comparison, per-page element counts). For HTML: `scripts/verify.py` (headless Chromium, screenshot, console errors), multi-viewport runs, interaction recording, and a final human eyeball pass.

---

## 4. What is adoptable for a design-doc→UI prototype branch

### 4.1 Adoptable techniques (high value, low cost)

| # | Technique | Why it fits a doc-driven branch | Source |
|---|---|---|---|
| A1 | **Spec/card split** — a shared document stating WHAT (product, audience, content points, tone, output format + dimensions, constraints, image needs) and per-variant cards stating HOW (skeleton, borrowed rules, protagonist material, boldness, form-from-content) | The design doc a user hands us is exactly the "what" half; it becomes the fan-out contract for N variant workers instead of being compiled by one worker | `references/directions.md` Phases 3-4b |
| A2 | **Six candidates → six cheap thumbnails → three full builds** | Funnels a large variant space into a cheap stage; thumbnails are redrawn, not discovered late | `references/directions.md` 4c-4d |
| A3 | **Four pick criteria in fixed order** (good alone → mutually different → not colliding with recent work → not overdone), plus the "remove the device and is it clearer?" test | Deterministic selection instead of taste arbitration; "at most one prop page" prevents all variants collapsing into the same conceit | `references/directions.md` 4d |
| A4 | **Gate files as materialized checkpoints** with the "file absent ⇒ step not done" rule and "continue ≠ skip" rule | Fits the wayfinder's "triple completion gate" goal: a gate that is a file is checkable by any agent or script, not just a promise | `SKILL.md` 窄桥 §6 |
| A5 | **`direction-approved.md` containing the user's verbatim words** | Gives the later "capture step" real evidence and makes taste decisions replayable; matches the map's capture rule (fold the decision back + archive pointer) | `references/directions.md` Phase 7 |
| A6 | **The form five questions as a per-screen preflight** | Turns "the design doc says a dashboard" into concrete per-screen decisions (role, distance, temperature, capacity, motif) — the capacity question catches overflow mechanically | `references/workflow.md` step 3 |
| A7 | **Assumptions + placeholders alignment pass before building components** | Cheap early correction: "understanding wrong is 100× cheaper to fix early" | `references/workflow.md` early-alignment mode |
| A8 | **Readability floors as hard numbers** — body ≥14 px (mobile 16), label ≥12, tap target ≥44×44, contrast ≥4.5:1; deck ≥24/16; phone long-image ≥36/28 at canvas pixels | Objective, testable, no aesthetic argument needed — ideal gate content for an automated branch | `SKILL.md` 窄桥 §5; `references/modules/web.md`; `references/experience.md` S3 |
| A9 | **Deterministic lint as a pre-delivery gate** — red = broken images / console errors / font-size floors / insufficient contrast; yellow = template decoration, relative-path images, shared appearance family | Turns "looks good" into a command with an exit code; the repo backs it with unit tests (`scripts/tests/test_design_lint.py`) | `scripts/design_lint.py`, `judge()` |
| A10 | **"Show, then stop"** — after presenting variants the turn ends and waits, including in unattended sessions | Exactly the "one checkpoint with the user" the branch needs before expensive full builds | `references/directions.md` Phase 6 |
| A11 | **Single-file deliverable with base64-embedded assets; `file://` must open** | The prototype branch's deliverable is "open it and it runs" — no server step in the middle | `references/app-prototype.md` §0; `references/experience.md` S4 |
| A12 | **Three-interaction Playwright click test with `pageerror == 0` before delivery** | Minimum interaction evidence, cheap, and already the repo's own bar for UI prototypes | `references/app-prototype.md` §3 |
| A13 | **Verify the verifier** (control experiment with a known-good file) before trusting a render | Directly transferable to the webapp-verify branch as well; prevents "the checker is broken" false greens | `references/verification.md` §0 |
| A14 | **Appearance ledger** to stop a branch from re-delivering the same look repeatedly | Cheap, and the repo's own script already computes the fingerprint (bg class, palette, headline font, layout vector) | `scripts/design_lint.py` ledger commands; `references/evolution.md` |

### 4.2 Adoptable document schema (proposal for the branch)

Reusing huashu's vocabulary, a design-doc→UI branch could define:

```
design-doc.md          (input)  → parsed into:
  spec.md              the "what": product, audience, scenario, content points (itemized),
                                tone, output format + dimensions (mandatory), constraints,
                                assets, image needs
  cards/<variant>.md   the "how" per variant: source/logic, borrowed rules, protagonist
                                material, skeleton, where the boldness goes,
                                form comes from where
  direction-approved.md (gate)   shown variants + screenshot paths + user's verbatim words
```

with the hard rule that `spec.md` says what to say and the cards say how it looks, so a doc-driven branch never collapses into "one model re-rendering the same doc three times".

### 4.3 Adoptable stage gates

| Gate | Evidence required | Derived from |
|---|---|---|
| G0 facts/context | facts verified (or explicitly not applicable); existing design system / assets located | `SKILL.md` 窄桥 §0-1 |
| G1 assets | logos/product shots/UI screenshots present; `brand-spec.md` written if brands are involved | 窄桥 §2 |
| G2 variant selection | 6 thumbnails rendered; 3 chosen by the four criteria; machine checks `compare`/`ledger check` clean | `references/directions.md` 4c-4d |
| G3 user approval | `direction-approved.md` with the user's verbatim words | 窄桥 §6 |
| G4 alignment | assumptions+placeholders shown; form five questions answered per screen | `references/workflow.md` steps 3-5 |
| G5 delivery | lint red-clear, ≥44 px targets, contrast floors, 3 click tests with `pageerror == 0`, screenshots at 1440 and 375 | `references/modules/web.md`; `references/app-prototype.md` §3 |

Note the mapping to the wayfinder's planned triple gate (runnable with one command / verification executed with evidence / capture done): huashu's G5 covers "runnable + verified", and its `direction-approved.md` + ledger entry covers "capture done" (decision folded back and archived pointer).

### 4.4 Provenance and license for anything adopted

- Upstream: `https://github.com/alchaincyf/huashu-design`, tag **v3.2.0**, author 花叔 (`alchaincyf`), **MIT**, `Copyright (c) 2026 alchaincyf (花叔 · 花生)`.
- Any copied prose, a table, or a script must carry the MIT notice; safest practice for this repo is to **re-implement the mechanism in our own wording and cite** `alchaincyf/huashu-design` (MIT) at the point of adoption, exactly as the wayfinder map already requires ("each adoption carries provenance/license and a clear playbook reference path").
- Attribution chain is clean and one level deep: `references/experience.md` S1 cites Anthropic's `frontend-design` skill as the origin of the "warm cream + serif + clay accent is the model's default" observation, and that observation is what `design_lint.py`'s family detector implements. If we adopt the family detector concept, the honest chain is huashu-design (MIT) → anthropics/skills `frontend-design`.
- One caution: MIT covers the code and text; the *assets* are a separate question. `assets/style-specimens/*.jpg` (the style specimen sheets), `assets/sfx/*.mp3` (37 sound effects), and `assets/bgm-*.mp3` are not covered by the repo's LICENSE file as far as the LICENSE text goes — do not copy those media into gfunc. Copying `scripts/design_lint.py` or `references/directions.md` text is fine; copying `assets/` binaries is not clearly licensed.

### 4.5 One thing worth noting about the upstream's own evolution

huashu-design v3 moved from a ban-list to an options-list for the "three directions" stage, and recorded why (`references/directions.md`, "三轮问题与盲选的结论"): (1) three versions differing only by skin → fixed by making skeleton difference mandatory; (2) forcing a big metaphor per version → pages became props and blind selection scored 3/4 against them → fixed by capping at one overdone version; (3) too many constraints (e.g. "at most one warm-paper serif") made all three retreat to pale cool grid → user said "too regular, too boring" → fixed by turning appearance families from yellow-flags into hints and by expanding 3 candidates to 6. **Any adoption should take the current (post-blessing) form, not the older ban-based form.** The older form is still visible in the zread snapshot of the repo and in the Wayback-era `SKILL.md`; do not copy from it.

---

## 5. What is not worth adopting, and why

| # | Not adopting | Why |
|---|---|---|
| N1 | **Seconds roulette** as a variant generator | Non-deterministic and unrelated to the input document. A design-doc→UI branch should derive variants from *document axes* (audience emphasis, content density, hierarchy emphasis, brand warmth) so variants are comparable and explainable. Keep the roulette only as an escape hatch for "the doc doesn't constrain the look". |
| N2 | **Best-designer and real-world-reference logics** (WebSearch + `ref_board.py` + designer-persona briefs) | Expensive, network-dependent, and legally/provenance-wise messy (building a variant "in the style of" a living studio). A supplied design doc already encodes the client's visual intent; hunting external references adds variance, not fidelity. The *technique* worth keeping is the narrower one from N-adjacent A-lists: "if you name a reference, capture and look at it, don't work from its average impression" — that generalizes to "if the doc references a design system, read its tokens, don't approximate them" (already in `references/design-context.md`: read `theme.ts`/`tokens.css`, lift exact hex and spacing values, "read down 30+ concrete values before you claim to have lifted it"). |
| N3 | **The 60-style library and specimen sheets** (`references/design-styles.md`, 912 lines; `assets/style-specimens/*.jpg`) | Large context cost for a scenario where the look is already specified by a document. Also the most asset-heavy, least license-clean part of the repo. |
| N4 | **The anti-slop ban list as hard rules** | The repo itself concluded that bans produce worse output (§4.5). Also its aesthetic rulings are English/Western-market-centric (emoji, purple gradient, "GitHub-dark") and must yield to an existing design system. Adopt as *heuristics in the linter*, always overridable by the supplied brand/design system. |
| N5 | **"100% three directions, even when the user says 'just do it'"** | Proportionally wrong for a doc-driven branch: the user has already made the directional decision in the document. Keep the variant stage, but gate it on "the doc leaves the look open"; if the doc pins palette/type/layout, the gate becomes "one faithful build + one alternative" rather than six candidates. |
| N6 | **The whole motion / video / PPTX / XHS / deck surface** | Out of scope for a UI prototype branch; it is ~80% of the repo's file count and would dominate any spec. |
| N7 | **`design-gate-hook.sh` (Claude Code `PreToolUse` Bash hook) and `SKIP_DESIGN_GATE=1`** | The hook is Claude-Code-shaped and the escape hatch is a bypass flag; gfunc has its own harness-adapter and verification model (`references/adapters/`, `scripts/validate-harnesses`). The *principle* (a gate a machine can check, with the skip written into an artifact) is worth taking; the specific hook is not. |
| N8 | **`learn.py` / `design_lint.py ledger` / `capabilities.py` local machinery (`~/.huashu-design`)** | These assume the huashu skill's install layout, its own `HUASHU_DESIGN_HOME`, and a Claude-style plugin host. gfunc has a different harness and skill layout; re-implementing the minimum (a small fingerprint comparison) is cheaper than vendoring three scripts whose paths are hard-coded to another plugin. |
| N9 | **The Chinese-first prose, type-setting rules and 「」quote convention** | These are correct for Chinese-language design work and irrelevant as universal rules; if our branch is English-facing, they must be translated and re-scoped, not copied. |
| N10 | **"Ask the user first" as the entry condition** | In this branch the user has already supplied the design document; the entry condition is a document, not a conversation. Ask only for what the document is silent about (one batched round). |

---

## Source index

| Claim area | Primary file (v3.2.0) |
|---|---|
| Pipeline, bridge, gates, floors, output rules | `SKILL.md` |
| Three-direction phases, cards, pick criteria, self-check commands | `references/directions.md` |
| Trunk workflow, form five questions, early-alignment passes, variation matrix | `references/workflow.md` |
| Review rubric, veto rule, scenario weights, Top-10 defects | `references/critique-guide.md` |
| 6-perspective parallel experiment, briefs, failure rate, review framework | `references/multi-perspective-parallel-case-study.md` |
| Three ledgers, promotion ladder, pit ledger | `references/evolution.md` |
| Material tiers, truthfulness test, fetch fallbacks | `references/materials.md` |
| Design-context ladder, "read exact values" method | `references/design-context.md` |
| Tweaks implementation and rationale | `references/tweaks-system.md` |
| Verification ladder, verify-the-verifier rule | `references/verification.md` |
| App/UI prototype rules: architecture, density typing, click test, iOS frame | `references/app-prototype.md` |
| Web/UI module: build order, hard rules, responsive verification | `references/modules/web.md` |
| Machine checks: families, red/yellow judging, compare, ledger | `scripts/design_lint.py` |
| Preference ledger mechanics and quote enforcement | `scripts/learn.py` |
| Capability probe and material tiering | `scripts/capabilities.py` |
| Reference-board capture | `scripts/ref_board.py` |
| Machine-enforced gate | `scripts/design-gate-hook.sh` |
| Verified experience entries (S1-S6+) | `references/experience.md` |
| Expected behaviours per scenario (eval prompts) | `test-prompts.json` |
| License | `LICENSE` (MIT, © 2026 alchaincyf) |

*Research performed 2026-11-07 against `alchaincyf/huashu-design` @ v3.2.0. No upstream file was modified; the repository was cloned read-only to a scratch directory outside the working tree.*
