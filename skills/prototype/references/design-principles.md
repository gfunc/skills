# Design Principles — the vibey craft reference

> Adapted from the-vibey-project/vibey, plugin `ui-ux-design-principles` (v0.1.0, author Adam Matthew Steinberger), MIT license. The MIT notice, included as required for copies: "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY."
>
> Trimmed to §4–§6, §9, §15–§16, and the §17 currency snapshot, per the adopting survey. Prose is tightened; section numbering, claim markers, tables, and cross-references are intact. Pointers written `§N → <upstream skill>` name sections of the upstream five-skill set that this file does not include.

**How to read this.** Reference, not tutorial. Three markers: **[DURABLE]** — grounded in perception, cognition, motor control, or replicated research; does not expire, trust it. **[PLATFORM]** — a convention of Apple, Google, Microsoft, GNOME/KDE, or the web; verify against the current HIG, these change. **[CONTESTED]** — competent practitioners disagree, or the evidence is thinner than usually asserted; both cases given. **⚠️ GOTCHA** boxes mark mistakes that survive design review and get caught in production, in court, or in the analytics. The framing that organizes everything below: an interface is a *proposal about how a person should think*; good design makes the proposal match how they already think.

---

## §4. Input and Interaction

### 4.1 The input models are genuinely different

| | Touch | Mouse/trackpad | Keyboard | Voice | Stylus |
|---|---|---|---|---|---|
| Precision | Low (~9 mm) | High (1 px) | N/A (discrete) | N/A | Very high |
| Hover state | **None** | Yes | Focus | No | Hover on some |
| Right-click / secondary | Long-press | Yes | Context key | No | Barrel button |
| Multi-select | Awkward; needs a mode | Shift/Ctrl-click, marquee | Shift+arrows | No | Lasso |
| Precision editing | Painful | Good | Excellent | Poor | Excellent |
| Occlusion | **Hand covers content** | None | None | None | Hand covers |
| Discoverability | Poor (gestures invisible) | Medium | Poor without hints | Very poor | Poor |

**[DURABLE] The absence of hover on touch is a structural problem, not a detail.** Every tooltip, hover-reveal, or hover preview has no touch equivalent — designing hover-dependent affordances is designing a desktop-only feature. On hybrid devices both are possible at once, so design for the capability (`@media (hover: hover)`, `(pointer: coarse|fine)`).

### 4.2 Touch targets — the numbers

| Standard | Minimum | Nature |
|---|---|---|
| **WCAG 2.2 SC 2.5.8 (AA)** | **24 × 24 CSS px** — or smaller with ≥24 px spacing | Legal floor for web |
| **WCAG 2.2 SC 2.5.5 (AAA)** | 44 × 44 CSS px | Aspirational |
| **Apple HIG** | **44 × 44 pt** | Platform convention (iOS/iPadOS); visionOS ~60 pt (gaze+pinch is less precise) |
| **Material Design** | **48 × 48 dp** (~9 mm physical) | Platform convention |
| Automotive (Google Design for Driving) | ~76 dp | Context raises the bar |

**Practical rule: design to 44–48 px minimum for anything touchable; treat WCAG's 24 px as a floor you never actually approach.** The visual element can be smaller than the hit target — pad it (`min-height: 44px` with the icon at 24 px inside is the standard fix). Spacing matters as much as size: adjacent targets need ≥8 px of gap; destructive actions need ≥16 px of separation.

### 4.3 Reach and the thumb zone

**[DURABLE, with caveats]** One-handed phone use concentrates comfortable reach in the lower-center of the screen; the opposite top corner is hardest. Primary actions belong at the **bottom** on mobile (bottom sheets, bottom tab bars, bottom-anchored primary buttons); destructive or rarely-used actions can live up top. **⚠️ Caveat:** circulating "thumb zone" heat maps are illustrative, not measured law — grip varies and screens have grown. Use as a prior, not a proof.

### 4.4 Gestures

**[DURABLE] Gestures are invisible, unlabeled, and unmemorable.** Every gesture needs: 1. a **visible alternative** (a button that does the same thing), *always*; 2. a **discovery mechanism** (hint animation on first use, a peeking affordance, a coach mark used sparingly); 3. **reversibility** — swipe-to-delete without undo is a design defect. Reserve system gestures (edge swipes, pull-to-refresh at scroll top, pinch-zoom); overloading them produces conflicts users experience as "the app is broken."

### 4.5 Keyboard — the accessibility and the power-user story at once

**[DURABLE] Full keyboard operability is simultaneously an accessibility requirement (WCAG 2.1.1, Level A) and the single biggest efficiency win for expert users.** **Logical tab order** matching visual order; `tabindex` above 0 is almost always a bug. **Visible focus indicator** — WCAG 2.2 added SC 2.4.11 *Focus Not Obscured* and SC 2.4.13 *Focus Appearance*; removing `:focus` outlines without a replacement is a Level A failure, use `:focus-visible`. **Escape closes; Enter confirms**, universally expected. **No keyboard traps** (WCAG 2.1.2) — modals must trap *deliberately* and release on close. **Skip links** on the web; shortcuts match platform conventions (⌘ vs Ctrl), are shown in menus/tooltips, and never override browser/OS reserved combinations.

### 4.6 Feedback and state

Every interactive element needs a designed **default, hover, focus, active, disabled, loading, error, and selected** state. Missing states are where interfaces feel cheap. **On disabled buttons [CONTESTED]:** classic guidance disables submit until the form is valid; the counter-position — now the majority view among accessibility practitioners — is that disabled buttons are invisible to some assistive tech and give no explanation. **Preferred pattern: keep the button enabled, and on click validate, focus the first error, and announce it.** Reserve `disabled` for states genuinely unavailable for reasons the user already understands.

---

## §5. Layout, Responsiveness, and Adaptation

### 5.1 The layout primitives

- **Grid** — a shared coordinate system. 12-column is a convention, not a law; what matters is that everything aligns to *something*.
- **Spacing scale** — geometric or 4/8-px-based (4, 8, 12, 16, 24, 32, 48, 64). **The value of a scale is that it removes decisions and makes proximity consistent.** Arbitrary spacing is the visual signature of an unsystematized product.
- **Alignment** — the cheapest way to look designed. Left-align text; avoid center-aligning long text (ragged left edges slow reading).
- **Measure (line length)** — **45–75 characters** for body text; ~66 is the classic optimum; beyond ~90 the eye loses the line return. Full-width text at 1600 px is unreadable, hence a max-width or a multi-column structure.
- **White space is not empty** — it is the mechanism of grouping and hierarchy. "Reducing white space to fit more" reliably makes things harder to find.

### 5.2 Responsive vs. adaptive, and the modern toolkit

**Responsive** = one fluid layout that reflows continuously; **adaptive** = discrete layouts swapped at breakpoints. In 2026 the practical answer is layered: media queries for page-level structure; **container queries for component-level adaptation** (a card responds to *its own* available space, not the viewport; Baseline Widely Available since August 2025, ~93% support — the biggest shift in responsive layout since media queries); `clamp()` for fluid type/space; intrinsic layouts (`repeat(auto-fit, minmax(…, 1fr))`, Flexbox wrap); `dvh`/`svh`/`lvh` for the mobile-100vh problem; `prefers-reduced-motion` / `prefers-color-scheme` / `prefers-contrast` for user settings. Fluid type must include a rem component — a pure-vw font size fails WCAG SC 1.4.4 (Resize Text) by ignoring browser zoom.

**[DURABLE] Breakpoints come from your content, not from a device list.** Resize slowly and put a breakpoint where the layout *breaks* — measure too long, columns too narrow, nav wraps. A breakpoint at 768 "because iPad" is a coincidence. Useful starting ranges, then adjust: ~360–480 (phone portrait), ~481–767 (phone landscape), ~768–1023 (tablet), ~1024–1279 (small laptop), 1280+ (desktop). The 768–1024 band is genuinely awkward: two columns, or one column with generous side padding, is usually right.

### 5.3 Tablet — the form factor everyone under-designs

**[DURABLE] A tablet is not a big phone and not a small laptop.** The common failure is a stretched phone layout — a 1024 px-wide single column with a 900 px measure. The tablet-specific moves: **split view / master–detail** is the defining pattern, use it; support **multitasking** (Split View / Slide Over / Stage Manager, Android freeform) so the app can be any width at any time and orientation can change mid-session; support keyboard, trackpad, and stylus when attached without requiring them.

### 5.4 Foldables and novel form factors

Foldables add square-ish aspect ratios, ultra-wide unfolded states, a **hinge content must not straddle**, and **continuity** across fold/unfold mid-task. Use adaptive layout driven by available size (not device identity), handle configuration changes without recreating state, keep interactive elements off the fold, and test the fold transition explicitly. Container queries handle much of this without device detection.

### 5.5 Density and platform expectations

Provide density *options* in data-heavy desktop and web apps (comfortable / compact). Users of professional tools genuinely want more rows per screen; consumer users don't. One of the few places where a preference toggle beats a designer's judgment.

---

## §6. Visual Design

### 6.1 Typography

**[DURABLE] Typography is 90% of most interfaces, and hierarchy is 90% of typography.** **Type scale**: modular (ratios ~1.125 → 1.5); fewer sizes is better — 5–7 steps covers nearly everything; every extra size is a decision someone will make inconsistently. **Hierarchy comes from size + weight + color + space — not size alone**; two sizes can be perfectly clear. **Body text**: ≥16 px on web (smaller triggers mobile zoom and fails low-vision users); line-height ~1.4–1.6 for body, 1.1–1.25 for large headings; measure 45–75 characters (§5.1). **Never disable user font scaling** — iOS Dynamic Type and Android font scale are used by many, and a layout that breaks at 200% text is a WCAG 1.4.4 failure (Level AA) and an ordinary usability failure for anyone over 45. **All-caps** reduces reading speed beyond a couple of words — fine for a label, wrong for a sentence; letter-spacing increases slightly for all-caps and small text, decreases for large display text. **System fonts** (SF Pro, Roboto, Segoe, Inter, `system-ui`) load instantly and render optimally; custom fonts cost LCP — subset, `preload` the critical weight, use `font-display: swap` (or `optional`); an invisible-text flash is a CLS problem.

### 6.2 Color

- **Build a semantic layer.** Never let a component reference `blue-500`; let it reference `color.action.primary`, which resolves to `blue-500` in light mode and `blue-300` in dark. Without this layer, dark mode and theming are a rewrite.
- **Perceptually uniform spaces (OKLCH/LCH)** make consistent ramps far easier than HSL, where equal lightness looks wildly different across hues.
- **Never encode meaning in color alone** (WCAG 1.4.1). ~8% of men have some color vision deficiency; pair color with icon, text, pattern, or position. "Red row = error" is a failure; "red row with an error icon and a message" is not.
- **Contrast** (§9.3 for the standards fight): WCAG 2.2 requires **4.5:1** body text, **3:1** large text (≥18 pt / 14 pt bold) and UI components (SC 1.4.11).
- **Dark mode is not inverted light mode.** Pure black/white causes halation; use very dark gray (~#121212) and slightly desaturated, lighter foregrounds. Elevation is expressed by *lighter* surfaces, not shadows (nearly invisible on dark). Desaturate brand colors or they vibrate.

### 6.3 Space, elevation, and depth

- **Spacing scale** (§5.1) — 4 or 8 px base, geometric growth.
- **Elevation** communicates layering and modality: content < raised card < sticky header < dropdown < modal < toast. Keep the z-index scale as **named tokens** (`z.modal: 1000`), or you will end up with `z-index: 99999`.
- Use **one** depth language; mixing shadows, borders, and fills to mean the same thing is visual noise.

### 6.4 Iconography

- **Icons are not universally understood.** Only a handful are (search, home, print, trash, back arrow, close ×, play); everything else — especially abstract product concepts — needs a **text label**. Icon-only toolbars are consistently outperformed by icon+label in findability testing.
- Consistent grid, stroke weight, corner radius, optical size across the set. Tooltips are not a solution on touch (§4.1). Meaning-bearing icons need accessible names; decorative ones need hiding (`aria-hidden="true"`, `alt=""`).

### 6.5 Motion

**[DURABLE] Motion's job is to explain, not to decorate.** Legitimate uses: **continuity** (where a thing came from and went), **feedback** (the tap registered), **attention** (direct the eye to a change), **perceived performance** (mask latency, show progress). Timing: **UI transitions 150–300 ms**; enter slightly slower than exit; larger objects slower. Easing: **ease-out for entering**, **ease-in for exiting**; linear looks mechanical and is almost always wrong. Spring/physics motion feels natural for direct manipulation because it preserves velocity continuity. **`prefers-reduced-motion` is not optional** — vestibular disorders make large parallax, zoom, and slide animations genuinely nauseating; replace motion with a cross-fade or an instant change, not by removing the feedback entirely.

### 6.6 Perceived performance is a design material

| Wait | Design response |
|---|---|
| < 100 ms | Feels instant. Do nothing. |
| 100 ms – 1 s | Users notice but stay in flow. Subtle state change. |
| 1 – 10 s | **Show progress.** Skeletons > spinners (they signal structure). Determinate > indeterminate. |
| > 10 s | Progress + estimate + **cancel** + ability to leave and be notified. |

**Optimistic UI** (apply immediately, reconcile later) is the most effective perceived-performance technique and the most botched: if you show success optimistically, you owe the user an honest, non-destructive recovery when it fails — silently reverting is worse than having waited. **Core Web Vitals** are field metrics (real Chrome users, 75th percentile, 28-day window): **LCP ≤ 2.5 s** (loading), **INP ≤ 200 ms** (responsiveness; replaced FID in March 2024), **CLS ≤ 0.1** (visual stability). INP is the one most sites fail (~43% miss) because fixing it requires JavaScript architecture changes, not image compression. **CLS is the most *design*-caused**: always set explicit `width`/`height` (or `aspect-ratio`) on images, videos, iframes, and ad slots, and reserve space for anything that loads late.

---

## §9. Accessibility

### 9.1 The frame

**[DURABLE] Accessibility is not a feature for a minority.** ~1.3 billion people live with significant disability; add situational (bright sun, one hand full, noisy room) and temporary (broken arm, eye dilation) impairments and the addressable population is everyone. In most markets a product ships to, it is also **the law**. The four WCAG principles, **POUR**: *Perceivable* (alt text, captions, contrast, not-color-alone), *Operable* (keyboard, enough time, no seizure triggers, adequate targets), *Understandable* (readable, predictable, error-preventing and error-explaining), *Robust* (works with assistive technologies; valid semantic markup).

### 9.2 The standards and the law (2026)

| Regime | Standard | Status |
|---|---|---|
| **WCAG 2.2** | Current W3C Recommendation (Oct 2023, updated Dec 2024) | **Approved as ISO/IEC 40500:2025** |
| **WCAG 3.0** | Working Draft only; Bronze/Silver/Gold outcome-based scoring | **Not a legal requirement anywhere.** Final Rec realistically 2028–2030. **Will not deprecate WCAG 2** |
| **EU — European Accessibility Act** | EN 301 549 (WCAG 2.1 AA; v4.1.1 expected 2026 moves to WCAG 2.2) | **Enforceable since 28 June 2025** for new products/services; applies to businesses anywhere selling to EU consumers |
| **US — ADA Title II** | WCAG 2.1 AA, DOJ final rule | ⚠️ **Deadlines extended one year on 20 April 2026** (50k+ population → 26 Apr 2027; under 50k → 26 Apr 2028). The obligation is in force now; people can sue today |
| **US — ADA Title III** | No explicit WCAG mandate | Courts apply WCAG anyway; 4,600+ suits in 2025 |

**[DURABLE, practical] Build to WCAG 2.2 AA.** It is a superset of 2.1 AA, so you exceed every current legal requirement and are positioned for whatever 3.0 becomes. **Do not wait for WCAG 3.0** — Bronze is expected to be roughly equivalent to today's 2.2 AA, so conforming now is the head start.

### 9.3 Contrast, and the APCA question

Current requirement (WCAG 2.x, therefore the law): 4.5:1 body text, 3:1 large text, 3:1 for UI components and graphical objects (SC 1.4.11). **[CONTESTED — with legal consequences.] APCA** is a perceptual model producing an `Lc` value that accounts for font size, weight, and polarity; its proponents argue, with real evidence, that WCAG 2's math systematically **overstates** contrast when both colors are dark (why WCAG-passing dark-mode palettes can be functionally unreadable) and **understates** some light-background pairs. **But:** APCA is a *candidate* method for WCAG 3, which is a Working Draft; no law anywhere references it; and practitioner analysis (notably Adrian Roselli, April 2026) warns that advising teams to *replace* WCAG 2 contrast with APCA creates legal risk. **The defensible position for 2026: conform to WCAG 2 contrast (what you'll be audited against), and optionally also check APCA to catch the cases WCAG 2's math misses — particularly in dark mode.** Do not present APCA conformance as legal compliance. Worth internalizing: contrast is the **most common accessibility failure on the web** — WebAIM Million 2026 found WCAG 2 contrast failures on **83.9%** of the top million home pages, up from 79.1%; the cheapest defect class to fix and the one most consistently shipped.

### 9.4 The practical checklist

Beyond contrast, the failures on the overwhelming majority of sites are: missing alt text, unlabeled form inputs, empty links/buttons, and missing document language — those four plus contrast are ~95% of automatically-detectable issues. **Semantic structure** — real headings in order, landmarks, lists as lists, tables with headers; a screen-reader user navigates by headings, and a page of styled `<div>`s is a wall. **Every input has a persistent, programmatically associated `<label>`** — placeholder text is not a label: it disappears on focus, fails contrast, and breaks autofill and translation. **Alt text** describes *purpose*, not appearance; decorative images get `alt=""`; complex images need a longer description elsewhere. **Focus management** on route change, modal open/close, dynamic insertion; announce with a live region when appropriate. **ARIA rule zero: no ARIA is better than bad ARIA** — native `<button>` before `role="button"` with keyboard handlers. **Support 200% zoom and 320 px reflow** without horizontal scrolling (SC 1.4.10); don't rely on hover or precise timing.

### 9.5 Testing

- **Automated tools (axe, Lighthouse, WAVE, Pa11y) catch roughly a third of issues** — necessary and radically insufficient; run them in CI as a floor.
- **Manual keyboard pass** (unplug the mouse, do every task); **screen reader pass** (VoiceOver, NVDA or JAWS, TalkBack — at least one; behaviours differ meaningfully); **zoom to 200% and 400%** with OS-level larger text.
- **Test with users with disabilities** — the only method that finds the issues the other methods can't.
- **⚠️ Accessibility overlay widgets** (one-line "compliance" JavaScript) have repeatedly failed to provide a defense in litigation and drew FTC action; they are widely opposed by the accessibility community and screen-reader users. Not a remediation strategy.

---

## §15. Anti-Patterns

| Anti-pattern | Why it fails | Do instead |
|---|---|---|
| Placeholder text as the label | Disappears on focus, fails contrast, breaks autofill and translation, invisible to some AT | Persistent label above the field |
| Two primary buttons | Von Restorff: two emphases = none | One primary, rest secondary/tertiary |
| Icon-only controls without labels | Icons aren't universal; tooltips don't exist on touch | Icon + label, or label at minimum |
| Removing focus outlines | WCAG Level A failure; breaks keyboard use | `:focus-visible` with a designed indicator |
| Disabling zoom (`user-scalable=no`) | Hostile to low-vision users; WCAG failure | Never do this |
| Fixed pixel font sizes / ignoring OS text scale | Breaks for everyone over ~45 | Relative units; test at 200% |
| Color as the only signal | Fails ~8% of men and every grayscale/low-vision case | Color + icon + text |
| Confirmation dialogs everywhere | Habituation makes them useless | Undo (§2.3 → `ui-ux-cognition-heuristics-and-navigation`) |
| Hamburger for primary navigation | Measurably reduces discovery of hidden items | Tab bar for the top 3–5 |
| Modal for anything non-blocking | Interrupts, traps, and stacks | Inline, sheet, or side panel |
| Infinite scroll where users need to find and return | Destroys position memory; breaks the footer | Pagination or "load more" |
| Carousels for important content | Very low engagement past slide 1; auto-advance is an a11y failure | Show the content |
| Auto-playing audio/video | Universally hated; a11y violation | User-initiated |
| Hijacking scroll, Back, or system gestures | Breaks the trust users place in platform behaviour | Don't |
| Equal spacing above and below labels | Proximity ambiguity — the classic form bug | Tighter within groups than between |
| Centered long body text | Ragged left edge slows reading | Left-align |
| Full-width text on wide screens | Exceeds 75-character measure | max-width or multi-column |
| Skeleton/spinner with no context | Doesn't reduce anxiety, just delays it | Say what's loading; show progress |
| "Something went wrong" | Unactionable | What/why/what next (§10.2 → `ui-ux-writing-forms-research-and-ethics`) |
| Testing only the happy path | Real pain lives in errors and second sessions | Test failure and recovery |
| Designing only at 1440 px in Figma | Never sees the 375 px reality | Design mobile-first; open the small frame |
| Hiding content on mobile with `display:none` | Mobile users are not second-class | Reorganize, don't delete |
| Optimizing engagement metrics alone | Rewards confusion and manipulation | Pair with quality metrics (§12.4 → `ui-ux-writing-forms-research-and-ethics`) |
| Adding a preference for every disagreement | Pushes design decisions onto users | Choose a good default |
| Accessibility overlay widget | Doesn't work; no legal protection; opposed by AT users | Fix the underlying markup |
| Shipping WCAG 2.0 in 2026 | Below every current legal baseline | Build to 2.2 AA (§9.2 above) |
| Quoting "5 users is enough" as universal | Misreads the finding (§12.2 → `ui-ux-writing-forms-research-and-ethics`) | 5 per segment per round, 3 rounds |
| Quoting "7±2" as a menu-length rule | Miller said no such thing (§1.2 → `ui-ux-cognition-heuristics-and-navigation`) | Categorize; don't make people recall |

---

## §16. Contested Questions

**16.1 Minimalism vs. signifiers.** Flat/minimal design improved consistency, scalability, and noise; it also removed the cues that tell people what's clickable, with a documented cost concentrated in older and less experienced users. Neither "add bevels back" nor "clean is always better" is right. The resolution is *deliberate signification*: keep the aesthetic, ensure every interactive element is identifiable without hover, and test that with real users rather than your team.

**16.2 Expressive vs. neutral design.** Material 3 Expressive's research argues emotional expressiveness and usability are complementary — bolder shapes and bigger primary actions made key elements ~4× faster to spot and closed the usability age gap. The counterweight: these are vendor studies of vendor components, the mechanism is mostly "prominence helps" (already known), and expressiveness is genuinely wrong for some contexts (you may not want a playful UI for paying a parking ticket). Direction: well-supported. Specific numbers: don't generalize.

**16.3 Consistency vs. platform nativeness.** §8.5 → `ui-ux-design-systems-platforms-and-accessibility`.

**16.4 APCA vs. WCAG 2 contrast.** §9.3 above — this one has legal consequences, so precision matters more than usual.

**16.5 Chat vs. GUI for AI features.** §14.1 → `ui-ux-writing-forms-research-and-ethics`.

**16.6 Hamburger menus.** §3.2 → `ui-ux-cognition-heuristics-and-navigation`.

**16.7 Disabled submit buttons.** §4.6 above.

**16.8 A/B testing vs. qualitative research.** A/B tests answer "which is better" with statistical rigour but cannot tell you *why*, cannot evaluate options you didn't build, and systematically favour short-term engagement over long-term value (the classic failure: the variant that wins on click-through erodes trust over months). Qualitative research explains mechanism and generates options but can't quantify effect. **They answer different questions and neither substitutes for the other.** Teams using only A/B testing optimize into local maxima; teams using only qualitative research ship confident guesses.

**16.9 Design system centralization.** A single central team produces consistency and quality but becomes a bottleneck and drifts from product reality; a federated model produces adoption and relevance but drifts toward inconsistency. Most mature organizations end up with a small core team owning foundations plus a contribution model with review — and the governance, not the model, determines whether it works.

**16.10 Does "UX = UI" still hold?** NN/g's 2026 position is that UI is becoming less of a differentiator as design systems standardize components and AI mediation sits above the interface. The counterargument: this has been predicted before, most software in the world is still mediocre at basic interface craft, and declaring UI solved while 83.9% of top sites fail color contrast is premature. Both can be true: the *ceiling* on UI differentiation may be falling while the *floor* remains unmet.

---

## §17. Currency Snapshot — verified August 2026

| Thing | Status as of Aug 2026 | Decay risk |
|---|---|---|
| **WCAG 2.2** | Current W3C Rec (Oct 2023; updated Dec 2024); ISO/IEC 40500:2025; Dec-2024 text expected as ISO/IEC 40500:2026 by late 2026 | Low |
| **WCAG 3.0** | Working Draft only (~174 requirements, Mar 2026); Bronze/Silver/Gold outcome-based conformance; Candidate Rec ~Q4 2027; final 2028–2030; not legally required anywhere; will not deprecate WCAG 2 | Medium |
| **EU Accessibility Act** | Enforceable since 28 Jun 2025; EN 301 549 currently WCAG 2.1 AA, v4.1.1 expected 2026 → 2.2; existing services to 28 Jun 2030; enforcement intensifying per-member-state | Medium |
| **ADA Title II** | ⚠️ Deadlines extended one year on 20 Apr 2026 (Interim Final Rule): 50k+ → 26 Apr 2027; under 50k and special districts → 26 Apr 2028. WCAG 2.1 AA; obligation in force now, only the date moved | **High** |
| **Section 504 / HHS** | Extended 7 May 2026: ≥15 employees → 11 May 2027; <15 → 10 May 2028 | High |
| **APCA** | Candidate contrast method for WCAG 3; in Chrome DevTools (experimental); referenced by no law; satisfy WCAG 2 and optionally also APCA | Medium |
| **Contrast failure rate** | WebAIM Million 2026: 83.9% of top 1M home pages have WCAG 2 contrast failures (up from 79.1%), ~34 instances/page | Annual |
| **Core Web Vitals** | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile of real Chrome users over 28 days; INP replaced FID Mar 2024; ~43% of sites fail INP — the most commonly failed metric | Medium |
| **Container queries** | Baseline Widely Available since Aug 2025 (~93% support); now the default tool for component-level responsiveness | Low |
| **Design Tokens (DTCG)** | First stable spec v2025.10 (28 Oct 2025) — a W3C Community Group spec, *not* a Recommendation; Style Dictionary v4+ first-class support; Figma Variables export; ~84% team adoption | Low |
| **Material 3 Expressive** | Announced May 2025 as an M3 enhancement (not "M4"); 46 studies / 18,000+ participants; reported up to 4× faster key-element identification and closure of the usability age gap; rolling out | Medium |
| **Apple Liquid Glass** | macOS 26 / iOS 26 (Sept 2025); free on recompile for framework chrome; custom components need work; Icon Composer required for icons; ongoing legibility criticism | Medium |
| **Dark-pattern regulation** | DSA Art. 25 and DMA in force; EDPB Guidelines 03/2022 (six categories); CRD financial-services ban applicable 19 Jun 2026; Digital Fairness Act proposal expected late 2026 (not law); FTC enforcing and naming executives | **High** |
| **Enforcement scale** | FTC 2024: 76% of 642 sites/apps used ≥1 possible deceptive pattern; EU 2022: 97%. Fines: Amazon $2.5B (FTC) and €746M (EU), Epic $245M, TikTok €345M, Google €150M | Medium |
| **Cart abandonment** | Baymard meta-analysis (50 studies, Sept 2025): 70.22%; ~35.26% conversion uplift available from checkout design (upper bound, not a promise); ~23.5 form elements typical vs 12–14 achievable | Low |
| **Design tooling** | Figma Config 2026: code layers, design agents, MCP server; State of the Designer 2026 (n=906): 72% use gen-AI, 98% increased usage YoY, 91% report quality gains; Penpot shipped MCP server and native DTCG tokens | **High** |
| **NN/g position** | State of UX 2026: UI becoming less of a differentiator; AI mediation above the interface; 36% of surveyed designers fear AI-normalized dark patterns | Medium |

**Goes stale fastest:** legal deadlines (ADA Title II moved *this year*), design-tool feature sets, AI-interface conventions, platform design-language versions. **Essentially never stale:** the perception/cognition/heuristics/IA material (§1–§3 of the upstream set), input physics (§4.1–4.2), layout primitives (§5.1), typography (§6.1), UX writing (§10), anti-patterns (§15).
