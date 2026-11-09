# poteto-mode reference inventory

Research ticket: `.scratch/two-front-doors/issues/01-poteto-mode-inventory.md`.
Branch: `research/poteto-mode-inventory`. Worktree: `.scratch/two-front-doors/lanes/research-poteto-mode-inventory`.

Question: everything that references `poteto-mode` outside `skills/poteto-mode/` itself, classified by the action the retirement sweep must take.

## Method

Searched every tracked file in the repo at `8fc02e7` for `poteto-mode`, `Poteto mode`, and the phrase `front door`, plus a case-insensitive sweep for `poteto` to catch adjacent spellings. Read every hit in context. Cross-checked the vendored-path list against `vendor-manifest.txt` and diffed the vendored files against the pstack mirror at `~/projects/pstack` to see which local diffs already exist.

Result: **37 files hold 179 literal `poteto-mode` references**. Three further rows are adjacent mentions that do not contain the string but that the sweep must still act on (`README.md:34` "Three front doors.", `README.md:100`, `docker/rig/lib-kimi.sh:127`). **182 rows below, across 38 files.**

## Corrections to the ticket brief

Four things in the brief are wrong, and each one changes what the sweep touches.

1. **No manifest has a per-skill registration list.** `plugin.json:13`, `.claude-plugin/plugin.json:13`, and `.cursor-plugin/plugin.json:15` are all `keywords` array entries, not `skills` arrays. Skill discovery is directory-based (`kimi.plugin.json` and `.cursor-plugin/plugin.json` both carry `"skills": "./skills/"`). "Unregistering" therefore means editing `description` + `keywords`; the actual unregistration is deleting `skills/poteto-mode/`, which the map puts out of scope. The manifest edit is the *advertisement* removal, not a registry removal.
2. **There are five manifests, not four.** `.claude-plugin/marketplace.json` also names `poteto-mode` — in its `plugins[0].description` and its `keywords`. It is not version-managed by `scripts/version` (it has no `version` key), so it needs its own edit and will not be caught by the release version check.
3. **`kimi.plugin.json` has no `hooks` or `commands` section.** Its only keys are `name`, `description`, `version`, `author`, `license`, `skills`, `agents`, `systemPromptPath`. There is nothing to inspect there beyond the one description line.
4. **The brief's file list understates the surface by 6 files.** Missing from the ticket: `skills/poteto-help/SKILL.md` + `references/recipes.md` (43 references — the single largest block), `skills/automate-me/SKILL.md`, `skills/figure-it-out/SKILL.md`, `codex-agents/poteto-agent.toml`, `.claude-plugin/marketplace.json`. Also: `docs/issue-tracker.md` does not exist in this repo (the tracker defaults live in `references/trackers/`), and `skills/wayfinder/` contains **zero** `poteto-mode` references, so there is nothing to remove from wayfinder.

## Classification rule

- **(a) unregister** — the surface advertises `poteto-mode` as a front door. Removing it takes the door off the pack's surface.
- **(b) rewrite** — prose that describes `poteto-mode`'s mechanics as how work gets done. It must be rewritten to teach the two-door chain.
- **(c) remove-suggestion** — the text routes or recommends `poteto-mode` as the answer. The recommendation goes; the two-door routing takes its place.
- **(d) keep** — by-path reads of files that stay in-tree, provenance records, and vendored-tree listings. No edit.
- **(e) investigate** — needs a decision before it can be classified.

---

## (a) unregister — 11 references, 7 files

| file:line | quote | action | note |
|---|---|---|---|
| `kimi.plugin.json:3` | `"description": "gfunc's own agent stack: original pstack vendored, with the wayfinder planning chain and a start-dev execution front door. Three front doors (/poteto-mode, /wayfinder, /start-dev)."` | unregister | The "Three front doors" description. Becomes "Two front doors (/wayfinder, /start-dev)". |
| `plugin.json:5` | `"description": "…Three front doors (/poteto-mode, /wayfinder, /start-dev)."` | unregister | Same string as `kimi.plugin.json:3`; the two must stay identical. |
| `plugin.json:13` | `"poteto-mode",` | unregister | `keywords` array, **not** a skills list. Drop the entry. |
| `.claude-plugin/plugin.json:4` | `"description": "…Three front doors (/poteto-mode, /wayfinder, /start-dev)."` | unregister | Same string again; three of the four share it verbatim. |
| `.claude-plugin/plugin.json:13` | `"poteto-mode",` | unregister | `keywords` array. |
| `.cursor-plugin/plugin.json:5` | `"description": "…Three front doors (/poteto-mode, /wayfinder, /start-dev)."` | unregister | Same string; this file is vendored (see Constraints). |
| `.cursor-plugin/plugin.json:15` | `"poteto-mode",` | unregister | `keywords` array. |
| `.claude-plugin/marketplace.json:11` | `"description": "pstack vendored and modified, with the wayfinder planning chain integrated. Two front doors (/poteto-mode automatic, /wayfinder HITL), one executor (autopilot-stack)."` | unregister | **Already stale.** Says "Two front doors" while the other four say three, and names `autopilot-stack` as the executor when the executor is now `start-dev` (`autopilot-stack` is a vendored poteto-mode playbook). Rewrite wholesale, not just de-list. |
| `.claude-plugin/marketplace.json:16` | `"poteto-mode",` | unregister | `keywords` array of `plugins[0]`. |
| `README.md:34` | `Three front doors.` | unregister | The heading above the door list. Does not name poteto-mode, so a literal search misses it. Becomes "Two front doors." |
| `README.md:36` | `- [`/poteto-mode`](skills/poteto-mode/SKILL.md) takes a goal and a check, selects a playbook, and runs it. This is the original pstack path, restored to upstream content.` | unregister | The door bullet. Remove the bullet; the vendored path itself stays (see `README.md:54`). |

## (b) rewrite — 131 references, 20 files

### Guide pages — 87 references, 11 files

The whole guide is written around one door. Two shapes of change: prompt examples retarget at `/start-dev` (clear task with a check) or `/wayfinder` (fog), and prose that explains poteto-mode's internals rewritten around the two-door chain. Every playbook link below points into `skills/poteto-mode/playbooks/`, which **stays in-tree**, so the links still resolve — the problem is that they teach a retired workflow, not that they break.

| file:line | quote | action | note |
|---|---|---|---|
| `docs/guide/README.md:3` | "`/poteto-mode` picks the playbook, runs the other skills as the steps need them, and shows you the evidence." | rewrite | Guide opening premise; must state the two-door split. |
| `docs/guide/README.md:8` | `2. [Route work through `/poteto-mode`](./02-poteto-mode.md). Give it a goal and watch it pick a playbook.` | rewrite | Nav entry 2. Points at the page that must be renamed (see Sweep order). |
| `docs/guide/README.md:33` | "`/poteto-mode` the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify." | rewrite | Example prompt. |
| `docs/guide/README.md:36` | `"repro first" and a checkable outcome are all the routing signal `/poteto-mode` needs.` | rewrite | Names the routing signal of the retired door. |
| `docs/guide/01-setup.md:52` | "- Save `/poteto-mode` for work that needs rigor. A small, obvious edit doesn't." | rewrite | |
| `docs/guide/01-setup.md:59` | "`/poteto-mode` add a --json flag to this command. text output stays byte-identical. verify both." | rewrite | Example prompt. |
| `docs/guide/01-setup.md:62` | "…the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`…" | rewrite | Describes poteto-mode's todo-list mechanics. |
| `docs/guide/01-setup.md:64` | "…To keep `/poteto-mode` on for the whole chat, pick it from the `/` menu with Option+Enter (Mac) or Alt+Enter (Windows)…" | rewrite | Cursor Custom Mode instructions for the retired door. |
| `docs/guide/01-setup.md:66` | "Next: [Route work through `/poteto-mode`](./02-poteto-mode.md)." | rewrite | Inbound link to the renamed page. |
| `docs/guide/02-poteto-mode.md:1` | "# Route work through `/poteto-mode`" | rewrite | Page title. **The filename must change too** — 4 inbound links point at `02-poteto-mode.md` (3 in the guide, 1 in `skills/poteto-help/SKILL.md:52`). |
| `docs/guide/02-poteto-mode.md:3` | "`/poteto-mode` is the front door. You give it a goal, it matches one of twenty-three playbooks…" | rewrite | The keystone sentence of the retirement. |
| `docs/guide/02-poteto-mode.md:5` | "![A dispatcher pulls a switch lever … under a /poteto-mode departure board listing BUG FIX, FEATURE, and INVESTIGATION.](./images/router.jpg)" | rewrite | Image alt text names the door. `images/router.jpg` itself needs no change. |
| `docs/guide/02-poteto-mode.md:11` | `A[Your prompt] --> B[poteto-mode]` | rewrite | Mermaid node label; the routing diagram is poteto-mode's playbook matcher. |
| `docs/guide/02-poteto-mode.md:28` | "…The [playbook directory](../../skills/poteto-mode/playbooks/) has the full set." | rewrite | Links the retired door's playbook set. |
| `docs/guide/02-poteto-mode.md:35` | "`/poteto-mode` users get two notifications after a retry. repro first, then fix and verify." | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:53` | "`/poteto-mode` the csv export drops its last row since yesterday's deploy…" | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:64` | "`/poteto-mode` read this thread. restate the underlying issue in your own words, in plain english. don't change any code yet." | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:82` | "`/poteto-mode` do it" | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:93` | "…Cursor's [Custom Mode](../../skills/poteto-help/SKILL.md#start-a-task-with-poteto-mode) keeps `/poteto-mode` in context on every turn." | rewrite | Two links in one line: the poteto-help anchor `#start-a-task-with-poteto-mode` also disappears when that heading changes. |
| `docs/guide/02-poteto-mode.md:100` | "`/poteto-mode` new task. figure out why the cache entry survives logout. don't change any code yet." | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:103` | `"new task" tells `/poteto-mode` to re-match rather than continue the prior playbook." | rewrite | |
| `docs/guide/02-poteto-mode.md:112` | "`/poteto-mode` new task. branch off <base> in a fresh worktree, then port the parser change there." | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:115` | "…The [Opening a PR playbook](../../skills/poteto-mode/playbooks/opening-a-pr.md) already works from a worktree for code changes…" | rewrite | Same file `start-dev` cites by path (see (d)); the guide should cite start-dev's own PR path. |
| `docs/guide/02-poteto-mode.md:120` | "`/poteto-mode` what's eating my disk? prune the worktrees that are safe to prune." | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:123` | "The [Worktree cleanup playbook](../../skills/poteto-mode/playbooks/worktree-cleanup.md) classifies every worktree…" | rewrite | `worktree-cleanup.md` is a vendored poteto-mode playbook; no start-dev equivalent exists. |
| `docs/guide/02-poteto-mode.md:130` | "`/poteto-mode` im stepping away. keep going until the migration check reports zero old callers. log your decisions." | rewrite | Example prompt. |
| `docs/guide/02-poteto-mode.md:137` | "Read [`poteto-mode`](../../skills/poteto-mode/SKILL.md) itself for the full routing rules." | rewrite | The explicit "read the retired skill" pointer. |
| `docs/guide/03-understand.md:3` | "[What goes in a prompt](./02-poteto-mode.md#what-goes-in-a-prompt) handles the first." | rewrite | Inbound link + anchor into the renamed page. |
| `docs/guide/03-understand.md:14` | "`/poteto-mode` investigate why background jobs time out every few hours…" | rewrite | Example prompt. |
| `docs/guide/03-understand.md:17` | "…routes this to the [Investigation playbook](../../skills/poteto-mode/playbooks/investigation.md)." | rewrite | Poteto-mode playbook link. |
| `docs/guide/03-understand.md:72` | "`/poteto-mode` take over this branch. read the decision log, figure out what's done, and continue from there." | rewrite | Example prompt. |
| `docs/guide/03-understand.md:75` | "The [Session pickup playbook](../../skills/poteto-mode/playbooks/session-pickup.md) treats the prior trail as authoritative." | rewrite | Poteto-mode playbook link. |
| `docs/guide/04-design.md:78` | "`/poteto-mode` prototype a few options for the new dropdown menu. take screenshots or videos for me to compare." | rewrite | Example prompt. |
| `docs/guide/04-design.md:81` | "The [Prototype playbook](../../skills/poteto-mode/playbooks/prototype.md) builds throwaway sketches in a scratch directory…" | rewrite | Poteto-mode playbook link. The gfunc `prototype` skill is a separate, non-vendored skill — see ticket 02 for where prototyping now runs. |
| `docs/guide/04-design.md:86` | "`/poteto-mode` we need rate limiting for external webhooks. /architect it first, and answer open questions with prototypes. let me review before proceeding." | rewrite | Example prompt. |
| `docs/guide/04-design.md:96` | "`/poteto-mode` write a tutorial for how i would use the new config package first. then /teach me why it beats the current one." | rewrite | Example prompt. |
| `docs/guide/04-design.md:106` | "`/poteto-mode` turn this design into a plan. small verifiable PRs, each with its own verification steps." | rewrite | Example prompt. |
| `docs/guide/04-design.md:109` | "The [Multi-phase plan playbook](../../skills/poteto-mode/playbooks/multi-phase-plan.md) settles any remaining open questions by prototype…" | rewrite | Poteto-mode playbook link. `start-dev` has its own rewrite at `skills/start-dev/playbooks/program-plan.md`. |
| `docs/guide/04-design.md:114` | "`/poteto-mode` plan the migration of our ui library to the new styling system…" | rewrite | Example prompt. |
| `docs/guide/04-design.md:131` | "`/poteto-mode` already applies this ladder. Boundary-crossing work triggers `/architect` on its own…" | rewrite | |
| `docs/guide/05-build-and-clean.md:10` | "`/poteto-mode` this command emits two records after a retry. repro first, then fix and verify." | rewrite | Example prompt. |
| `docs/guide/05-build-and-clean.md:16` | "`/poteto-mode` add a --json flag. text output stays byte-identical. verify both forms." | rewrite | Example prompt. |
| `docs/guide/05-build-and-clean.md:22` | "`/poteto-mode` move parsing into one module, zero behavior change…" | rewrite | Example prompt. |
| `docs/guide/05-build-and-clean.md:28` | "`/poteto-mode` startup takes 1.8s on this fixture. trace it, fix the measured cause, show me before and after." | rewrite | Example prompt. |
| `docs/guide/05-build-and-clean.md:31` | "Each of these routes to its playbook ([Bug fix](../../skills/poteto-mode/playbooks/bug-fix.md), [Feature](…/feature.md), [Refactoring](…/refactoring.md), [Perf issue](…/perf-issue.md))…" | rewrite | Four poteto-mode playbook links in one line. |
| `docs/guide/05-build-and-clean.md:33` | "For sustained improvement of one number, there's the [Hillclimb playbook](../../skills/poteto-mode/playbooks/hillclimb.md)." | rewrite | Poteto-mode playbook link; no start-dev equivalent. |
| `docs/guide/05-build-and-clean.md:37` | "…the [Runtime forensics playbook](../../skills/poteto-mode/playbooks/runtime-forensics.md) instruments the running process… the [Trace forensics playbook](../../skills/poteto-mode/playbooks/trace-forensics.md) reads the artifact…" | rewrite | Two poteto-mode playbook links. |
| `docs/guide/05-build-and-clean.md:40` | "`/poteto-mode` here's a cpuprofile from the slow startup. tell me where the time goes and which source lines own it. no fix yet." | rewrite | Example prompt. |
| `docs/guide/05-build-and-clean.md:59` | "The [Opening a PR playbook](../../skills/poteto-mode/playbooks/opening-a-pr.md) runs `/deslop` on the diff before each commit…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/06-verify-and-ship.md:14` | "`/poteto-mode` add json output to this command. text output stays byte-identical, the json parses, both run against the sample project. show me the evidence." | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:22` | "…the [Visual parity playbook](../../skills/poteto-mode/playbooks/visual-parity.md) diffs screenshots against a frozen baseline…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/06-verify-and-ship.md:49` | "…`/poteto-mode` already runs the checklist inside the Perf issue and Hillclimb playbooks…" | rewrite | |
| `docs/guide/06-verify-and-ship.md:66` | "`/poteto-mode` build the bulk-archive action. use /verify-<app> to verify your changes and show me a video and screenshots as proof." | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:70` | "`/poteto-mode` repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof." | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:121` | "`/poteto-mode` open the pr. small ordered commits, evidence in the description." | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:124` | "The [Opening a PR playbook](../../skills/poteto-mode/playbooks/opening-a-pr.md) works from a worktree, rebases the work into small ordered commits…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/06-verify-and-ship.md:128` | "…Hand that churn to the [Babysit playbook](../../skills/poteto-mode/playbooks/babysit.md):" | rewrite | Poteto-mode playbook link. |
| `docs/guide/06-verify-and-ship.md:131` | "`/poteto-mode` babysit this pr. get it green." | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:137` | "`/poteto-mode` check on pr 123. anything outstanding?" | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:147` | "`/poteto-mode` land the stack." | rewrite | Example prompt. |
| `docs/guide/06-verify-and-ship.md:150` | "The [Shipping playbook](../../skills/poteto-mode/playbooks/shipping.md) verifies each PR independently before it arms anything…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/07-overnight.md:23` | "`/poteto-mode` im going to bed. migrate every caller to the new parser in a fresh worktree off <base>." | rewrite | Example prompt. |
| `docs/guide/07-overnight.md:36` | "…The [Autonomous run playbook](../../skills/poteto-mode/playbooks/autonomous-run.md) uses it to re-check the finish condition on events or a heartbeat." | rewrite | Poteto-mode playbook link. |
| `docs/guide/07-overnight.md:39` | "…`/poteto-mode` routes it through [`/figure-it-out`](../../skills/figure-it-out/SKILL.md)…" | rewrite | Names the routing relationship that disappears with the door. |
| `docs/guide/07-overnight.md:41` | "…The [Pause safely playbook](../../skills/poteto-mode/playbooks/pause-safely.md) finishes or backs out of the current step…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/07-overnight.md:77` | "[Autopilot-full](../../skills/poteto-mode/playbooks/autopilot-full.md) runs a queue of independent PRs to merged…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/07-overnight.md:80` | "`/poteto-mode` full autopilot on this queue. each item is independent. i want them merged by morning." | rewrite | Example prompt. |
| `docs/guide/07-overnight.md:83` | "[Autopilot-stack](../../skills/poteto-mode/playbooks/autopilot-stack.md) runs the same owner loop but ships nothing…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/07-overnight.md:86` | "`/poteto-mode` autopilot these five changes but stack them, don't ship. i'll land the stack in the morning." | rewrite | Example prompt. |
| `docs/guide/07-overnight.md:89` | "[Orchestrate](../../skills/poteto-mode/playbooks/orchestrate.md) is for a program that outlives any single agent…" | rewrite | Poteto-mode playbook link. `skills/poteto-help/SKILL.md:116` names the same playbook as the reason `/orchestrate` is not a skill — both change together. |
| `docs/guide/07-overnight.md:92` | "`/poteto-mode` orchestrate the store migration. own it until every package is converted and merged. i'll check in twice a day." | rewrite | Example prompt. |
| `docs/guide/07-overnight.md:97` | "Start your prompts to the coordinator with `/poteto-mode`, and the subagents it spawns follow the playbooks." | rewrite | |
| `docs/guide/07-overnight.md:111` | "`/poteto-mode` refactor this repo so its architecture is more agent friendly. use /correct and /architect on past commits…" | rewrite | Example prompt. |
| `docs/guide/08-principles.md:3` | "`/poteto-mode` reads their index at the start of every multi-step task, applies the ones the task triggers, and names each applied principle in its reply…" | rewrite | Attributes the principles index to the retired door. `start-dev` has its own attributed copy at `skills/start-dev/references/principles.md`. |
| `docs/guide/09-make-it-yours.md:3` | "poteto-mode is one person's style. The playbooks, routing, and model roles underneath it work just as well with yours." | rewrite | The personal-mode framing of the retired door. |
| `docs/guide/09-make-it-yours.md:57` | "`/poteto-mode` write a skill for verifying database migrations in this repo" | rewrite | Example prompt. |
| `docs/guide/09-make-it-yours.md:60` | "Writing a skill matches the [Authoring or modifying a skill playbook](../../skills/poteto-mode/playbooks/authoring-a-skill.md)…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/09-make-it-yours.md:79` | "`/poteto-mode` run the eval playbook on this skill change. same task for both variants, candidates stay blind." | rewrite | Example prompt. |
| `docs/guide/09-make-it-yours.md:85` | "`/poteto-mode` update the review skill so it flags missing migrations, and eval the change." | rewrite | Example prompt. |
| `docs/guide/09-make-it-yours.md:90` | "The [Eval playbook](../../skills/poteto-mode/playbooks/eval.md) is built around one failure mode, the observer effect…" | rewrite | Poteto-mode playbook link. |
| `docs/guide/10-recipes-and-pitfalls.md:18` | "`/poteto-mode` read this thread. restate the underlying issue in your own words, in plain english. don't change any code yet." | rewrite | Example prompt. |
| `docs/guide/10-recipes-and-pitfalls.md:34` | "`/poteto-mode` prototype a few options for the settings layout. put them behind a switcher and send me screenshots of each." | rewrite | Example prompt. |
| `docs/guide/10-recipes-and-pitfalls.md:42` | "`/poteto-mode` turn this design into a plan. small verifiable PRs, each with its own proof." | rewrite | Example prompt. |
| `docs/guide/10-recipes-and-pitfalls.md:74` | "`/poteto-mode` repro the duplicate write first. if there's a cheap test path, /tdd it. then fix and rerun." | rewrite | Example prompt. |
| `docs/guide/10-recipes-and-pitfalls.md:82` | "`/poteto-mode` repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof." | rewrite | Example prompt. |
| `docs/guide/10-recipes-and-pitfalls.md:114` | "`/poteto-help how do i get poteto-mode to stay on every turn?`" | rewrite | The question a user would now ask about `/start-dev` or `/wayfinder`. |
| `docs/guide/10-recipes-and-pitfalls.md:176` | "- **Writing a `SKILL.md` freehand.** Route it through the [Authoring or modifying a skill playbook](../../skills/poteto-mode/playbooks/authoring-a-skill.md) so validation and review happen." | rewrite | Poteto-mode playbook link. |

### Harness profiles — 5 references, 5 files

| file:line | quote | action | note |
|---|---|---|---|
| `references/harnesses/claude.md:53` | "- **Optional runtimes:** bun (the `poteto-mode` skill's bundled `scripts/orch` bookkeeping; `scripts/watch-pr` is intentionally unused), Playwright (`skills/playwright-cli`), tmux or a PTY for driving CLIs…" | rewrite | The `bun` runtime requirement exists only for `skills/poteto-mode/scripts/orch`. Nothing outside `skills/poteto-mode/` invokes `scripts/orch` (verified repo-wide), and no other skill in the pack has a `bun` dependency. With the door retired, `bun` stops being a runtime any live path needs. |
| `references/harnesses/codex.md:53` | same line | rewrite | Same edit; the five profiles carry this line identically. |
| `references/harnesses/cursor.md:53` | same line | rewrite | Same edit. |
| `references/harnesses/kimi.md:88` | same line | rewrite | Same edit (line 88 here, not 53 — Kimi's profile is longer). |
| `references/harnesses/pi.md:53` | same line | rewrite | Same edit. |

### The help skill — 36 references, 2 files

`skills/poteto-help` is the pack's own "which skill do I use" router, and it answers `/poteto-mode` for every category. It is the largest single block in the inventory. **Whether `poteto-help` survives the retirement at all is not decided here** — the map's destination keeps it as an auxiliary door, but its entire body teaches one door. Ticket 04 must decide between rewriting it for the two doors and retiring it; the row actions below assume rewrite.

| file:line | quote | action | note |
|---|---|---|---|
| `skills/poteto-help/SKILL.md:3` | "description: Guides users through the gfunc pack, focused model setup, /poteto-mode, and picking a skill, playbook, or principle." | rewrite | Frontmatter description names the door. |
| `skills/poteto-help/SKILL.md:20` | "- Start a task with `/poteto-mode`" | rewrite | The multiple-choice menu the skill offers. Becomes the two-door choice. |
| `skills/poteto-help/SKILL.md:46` | "…each command takes a `pstack:` prefix, such as `/pstack:poteto-mode`." | rewrite | Harness-prefix example. |
| `skills/poteto-help/SKILL.md:48` | "The Harness section of [`poteto-mode`](../poteto-mode/SKILL.md) maps Cursor's subagent, question, transcript, and settings paths to the harness's own." | rewrite | Points at the retired skill's Harness section. The harness profile owns that mapping now. |
| `skills/poteto-help/SKILL.md:50` | "## Start a task with `/poteto-mode`" | rewrite | Section heading; the anchor `#start-a-task-with-poteto-mode` is linked from `docs/guide/02-poteto-mode.md:93`. |
| `skills/poteto-help/SKILL.md:52` | "`/poteto-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. … [Guide page 2](../../docs/guide/02-poteto-mode.md) has examples." | rewrite | Describes the retired matching mechanics and links guide page 2 by name. |
| `skills/poteto-help/SKILL.md:54` | "Whether `/poteto-mode` stays on depends on how the user starts it:" | rewrite | Section lead-in. |
| `skills/poteto-help/SKILL.md:56` | "- Enter on `/poteto-mode` attaches the skill to one message. It fades as the chat moves on." | rewrite | |
| `skills/poteto-help/SKILL.md:58` | "- Option+Enter on Mac or Alt+Enter on Windows, or Use as Mode from the skill entry, makes it a Custom Mode…" | rewrite | |
| `skills/poteto-help/SKILL.md:60` | "Mid-chat, \"new task\" makes the mode match a fresh playbook. `/poteto-mode` already uses `poteto-agent` for the subagents its playbook steps spawn. To get the same style from a subagent of your own, spawn it as the pack's `poteto-agent`…" | rewrite | Also routes to the `poteto-agent` delegate — couples this line to the (e) decision. |
| `skills/poteto-help/SKILL.md:116` | "pstack has no `/orchestrate` skill. Orchestrate is a `/poteto-mode` playbook. If the slash menu shows `/orchestrate`, another plugin provides it." | rewrite | Same fact as `docs/guide/07-overnight.md:89`. |
| `skills/poteto-help/SKILL.md:120` | "Playbooks are step lists inside `/poteto-mode`, not skills, so they have no slash command. Inside `/poteto-mode`, describing the task picks one…" | rewrite | |
| `skills/poteto-help/SKILL.md:129` | "Without `/poteto-mode`, a phrase such as \"babysit this pr\" can start the host's own skill for the same job instead. The Playbooks section of [`poteto-mode`](../poteto-mode/SKILL.md) lists every playbook…" | rewrite | |
| `skills/poteto-help/SKILL.md:131` | "pstack has no planning skill. Cursor's Plan Mode works alongside it. For work that spans phases or stacked PRs, asking `/poteto-mode` for a plan runs the [Multi-phase plan playbook](../poteto-mode/playbooks/multi-phase-plan.md)…" | rewrite | Contradicts the two-door chain (the pack *does* have planning skills: wayfinder, to-spec). |
| `skills/poteto-help/SKILL.md:133` | "Principles are one-rule skills that `/poteto-mode` reads and cites in its replies." | rewrite | |
| `skills/poteto-help/SKILL.md:143` | "| A skill didn't load on its own | Only `/setup-pstack` loads from the user's words. The others load when the user types them or when `/poteto-mode` runs them, and it doesn't run every skill. |" | rewrite | |
| `skills/poteto-help/references/recipes.md:7` | "- `/poteto-mode read <thread>. restate the underlying issue in your own words, in plain english.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:10` | "- `/poteto-mode investigate why <symptom>. give me what we know, what data you used, and your best hypotheses. don't change any code yet.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:14` | "- `/poteto-mode take over this branch. read the decision log, find what's done, and continue. don't redo finished work.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:18` | "- Bug: `/poteto-mode <symptom>. repro first, then fix and verify.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:19` | "- Bug in an app: `/poteto-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:20` | "- Bug with a cheap test: `/poteto-mode repro <bug> first. if there's a cheap test path, /tdd it. then fix and rerun.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:21` | "- Feature: `/poteto-mode add <behavior>. <current output> stays byte-identical. verify both.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:22` | "- Refactor: `/poteto-mode move <code> into one module, zero behavior change. record the current output first and prove it's unchanged after.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:23` | "- Perf: `/poteto-mode <operation> takes <time> on <fixture>. trace it, fix the measured cause, show me before and after.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:27` | "- `/poteto-mode prototype a few options for <feature>. take screenshots or videos for me to compare.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:28` | "- `/poteto-mode we need <feature>. /architect it first, and answer open questions with prototypes. let me review before proceeding.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:29` | "- `/poteto-mode write a tutorial for how i would use <new package> first. then /teach me why it beats the current one.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:31` | "- `/poteto-mode turn this design into a plan. small verifiable PRs, each with its own verification steps.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:32` | "- `/poteto-mode plan the migration of <library> to <target>. small verifiable PRs. the result must match the original exactly, bugs included.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:39` | "- `/poteto-mode open the pr. small ordered commits, evidence in the description.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:40` | "- `/poteto-mode babysit this pr. get it green.` For status only: `/poteto-mode check on pr <number>. anything outstanding?`" | rewrite | Prompt recipe; two references on one line. |
| `skills/poteto-help/references/recipes.md:41` | "- `/poteto-mode land the stack.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:45` | "- `/poteto-mode im going to bed. <goal> in a fresh worktree off <base>. … arm the wake mechanism until done (/loop on Cursor and Claude, /goal on Kimi) …`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:48` | "- `/poteto-mode full autopilot on this queue. each item is independent.`" | rewrite | Prompt recipe. |
| `skills/poteto-help/references/recipes.md:49` | "- `/poteto-mode autopilot these changes but stack them, don't ship. i'll land the stack.`" | rewrite | Prompt recipe. |

### Other skills that read the retired skill at runtime — 3 references, 2 files

| file:line | quote | action | note |
|---|---|---|---|
| `skills/automate-me/SKILL.md:67` | "The **poteto-mode** skill shows the shape. Read it for granularity. Don't copy its content. The user's rules are not the same as poteto-mode's." | rewrite | A runtime instruction to read the retired skill as the template. Repoint at `start-dev`'s playbooks. Note `skills/automate-me/` is a vendored path (see Constraints). |
| `skills/figure-it-out/SKILL.md:15` | "Open a todolist whose first item is to read the Principles section of the **poteto-mode** skill." | rewrite | Runtime read of `skills/poteto-mode/SKILL.md` § Principles. `skills/start-dev/references/principles.md` is the gfunc-owned attributed copy — repoint there. |
| `skills/figure-it-out/SKILL.md:33` | "…per the Subagents section of the **poteto-mode** skill." | rewrite | Runtime read of the retired skill's Subagents section. The harness profile's Role mapping now owns that. Also note: `figure-it-out` is itself only reachable from the retired door and the guide — whether it stays is ticket 04's call. |

## (c) remove-suggestion — 10 references, 4 files

| file:line | quote | action | note |
|---|---|---|---|
| `skills/to-spec/SKILL.md:21` | "4. The chain then continues without further user calls: the multi-phase-plan playbook (`skills/poteto-mode/playbooks/multi-phase-plan.md`, relative to the stack root, two directories up from this skill file) decomposes the spec into units and emits the pstack execution plan." | remove-suggestion | The chain points its next step at a poteto-mode playbook. Repoint at `skills/start-dev/playbooks/program-plan.md`, which is the gfunc rewrite of that playbook (per `skills/start-dev/references/provenance.md:9`). This is the single most load-bearing routing line in the chain. |
| `skills/setup-workspace/SKILL.md:88` | "You may suggest Wayfinder for an unclear large goal, start-dev for an approved spec, or poteto-mode for a clear task with a success check. Do not start any of them automatically." | remove-suggestion | The onboarding router's menu. Becomes the two-door policy from ticket 02. `skills/setup-workspace/` is gfunc-owned (not vendored). |
| `skills/setup-pstack/SKILL.md:45` | "Write the settings file with a `# budget` line with the chosen label and its target effort, and one line per role, using the same labels poteto-mode uses." | remove-suggestion | The model-rule writer borrows poteto-mode's role vocabulary: the rule block below it writes `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`, `judgment and prose`, `hardest tasks` — poteto-mode playbook families. The harness profiles' Role mapping names a *different* set now (`dev`, `critical-dev`, `reviewer`, `fixer`, `merge worker`, `research`, `plan lead`, `review lead`). Dropping the attribution is not enough; the role list needs reconciling with start-dev's roles or the rule configures roles nothing consumes. `skills/setup-pstack/` is vendored (see Constraints). |
| `skills/poteto-help/SKILL.md:11` | "A message that asks for work, such as \"use pstack to fix this bug\", is not a help question. Read [`poteto-mode`](../poteto-mode/SKILL.md), do the work under it, and mention once that a Custom Mode keeps it on." | remove-suggestion | The help skill routes work requests into the retired door. |
| `skills/poteto-help/SKILL.md:40` | "3. Start a real task with `/poteto-mode`, a goal, and a check that can pass or fail." | remove-suggestion | Setup step 3. |
| `skills/poteto-help/SKILL.md:44` | "Save `/poteto-mode` for work that needs rigor." | remove-suggestion | |
| `skills/poteto-help/SKILL.md:64` | "The default answer is `/poteto-mode`, which runs most of the others when its steps need them." | remove-suggestion | The router's default answer. |
| `skills/poteto-help/SKILL.md:68` | "| Do any non-trivial task with rigor | [`/poteto-mode`](../poteto-mode/SKILL.md) |" | remove-suggestion | Table row in the "Pick a skill" list. |
| `skills/poteto-help/SKILL.md:152` | "- [`/automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/poteto-mode`." | remove-suggestion | |
| `skills/poteto-help/SKILL.md:154` | "- `/poteto-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind." | remove-suggestion | |

## (d) keep — 22 references, 7 files

| file:line | quote | action | note |
|---|---|---|---|
| `README.md:46` | "0.3.0 is breaking. The modified `/poteto-mode` behavior you may rely on … moved to [`/start-dev`](skills/start-dev/SKILL.md). `/poteto-mode` is now the original pstack path." | keep | Historical 0.2.x migration note. Factual statement about a past release; still true. |
| `README.md:54` | "- pstack's skills (poteto-mode, swarm, show-me-your-work, the principle-*, and the rest), vendored from the mirror at upstream content; only harness adapters, the `.scratch` store convention, and the five declared model-override hunks differ, per `vendor-manifest.txt`" | keep | Vendored-tree listing. The directory stays in-tree; the listing stays true. |
| `AGENTS.md:6` | "…and the operator-confirmed AINX-395 hunk in `skills/poteto-mode/` (the prototype playbook references the scenario branches, listed in `vendor-manifest.txt`); no other workflow modification is allowed." | keep | Declared-hunk provenance for the retained directory. **But this same clause is the constraint on the sweep** — see Constraints. |
| `vendor-manifest.txt:7` | "# skills/poteto-mode/ listed below. The directories below still report as…" | keep | Manifest preamble naming the allowed hunks. Must be amended when the sweep declares new hunks (see Constraints). |
| `vendor-manifest.txt:12` | "#   skills/no-comments/  skills/poteto-help/  skills/poteto-mode/  skills/recall/  skills/reflect/  skills/setup-pstack/" | keep | Vendored-path listing. |
| `vendor-manifest.txt:20` | "#   skills/poteto-mode/ — the prototype playbook references the scenario branches (AINX-395, operator-confirmed)" | keep | Declared hunk. The AINX-395 hunk stays as shipped (map scope). |
| `vendor-manifest.txt:41` | "skills/poteto-mode/" | keep | Vendored-path entry that `scripts/sync-upstream` reads. |
| `skills/start-dev/references/provenance.md:3` | "The execution workflow here moved out of the vendored pstack paths in 0.3.0 so `/poteto-mode` could return to upstream content. This file records where each piece came from." | keep | Provenance. |
| `skills/start-dev/references/provenance.md:5` | "## Moved whole from `skills/poteto-mode/`" | keep | Provenance heading. |
| `skills/start-dev/references/provenance.md:9` | "\| `playbooks/program-plan.md` \| `skills/poteto-mode/playbooks/multi-phase-plan.md` \| The 0.2.1 file was itself a rewrite of pstack's `multi-phase-plan.md`. Rewritten again in 0.6.0 to the eleven authoring steps. \|" | keep | Provenance mapping; start-dev's own copy is the live one. |
| `skills/start-dev/references/provenance.md:10` | "\| `scripts/emit-plan` \| `skills/poteto-mode/scripts/emit-plan` \| `registerPath` now resolves inside this skill. … \|" | keep | Provenance mapping. **Note:** `skills/poteto-mode/scripts/emit-plan` does not exist in the vendored tree — the path was already stale before this sweep. Harmless in prose; worth fixing while the file is open. |
| `skills/start-dev/references/provenance.md:11` | "\| `scripts/check-plan.mjs` \| `skills/poteto-mode/scripts/check-plan.mjs` \| Rebuilt as a shape driver in 0.6.0 … \|" | keep | Provenance mapping; `skills/poteto-mode/scripts/check-plan.mjs` does exist. |
| `skills/start-dev/references/provenance.md:12` | "\| `tests/check-plan.test.ts` \| `skills/poteto-mode/scripts/check-plan.test.ts` \| Checker path now resolves `../scripts`. \|" | keep | Provenance mapping. |
| `skills/start-dev/references/provenance.md:21` | "\| Execution role, `can_spawn`/`owns`, foreground and goal spawn policy \| `skills/poteto-mode/SKILL.md` \| This skill's **Roles** section and the playbooks' brief rules. \|" | keep | Provenance mapping. |
| `skills/start-dev/references/provenance.md:24` | "\| No status-poll loop, child step-table reconciliation \| `skills/poteto-mode/playbooks/feature.md` \| `playbooks/pr-owner.md` step 5. \|" | keep | Provenance mapping. |
| `skills/start-dev/references/provenance.md:58` | "- `playbooks/single-pr.md` is new, forked from `skills/poteto-mode/playbooks/autopilot-stack.md` at `9a6784c` …" | keep | Fork provenance with the pstack BASE pinned. |
| `skills/start-dev/references/provenance.md:64` | "The scratch-listing safety fix from `skills/poteto-mode/scripts/worktree-audit.sh` and `skills/poteto-mode/playbooks/worktree-cleanup.md` (upstream reference cursor/plugins#449) is worth offering to pstack upstream. It was reverted here with the rest of those files…" | keep | Provenance + upstream-offer note. |
| `skills/start-dev/references/provenance.md:74` | "`references/principles.md` is a copy of the `## Principles` section of pstack `e44668c` `skills/poteto-mode/SKILL.md` (MIT, Lauren Tan)…" | keep | MIT attribution. **Attribution must be retained** — see AGENTS.md upstream discipline. |
| `skills/start-dev/references/provenance.md:78` | "`skills/poteto-mode/references/pstack-models.md` was discarded as local runtime state. …" | keep | Provenance. |
| `skills/start-dev/references/principles.md:3` | "Copied from pstack `e44668c` `skills/poteto-mode/SKILL.md` § Principles (MIT, Lauren Tan). … the restored pstack file is unchanged." | keep | MIT attribution — retain. |
| `skills/start-dev/references/roles/pr-owner.md:19` | "11. Push only your own branch, with hooks on, and open the PR ready, never draft, per the restored `skills/poteto-mode/playbooks/opening-a-pr.md`." | keep | By-path playbook read. The file stays in-tree, so the citation resolves. If the sweep ever deletes the vendored directory, this is the first line that breaks — the map keeps it, so it does not. |
| `skills/start-dev/playbooks/single-pr.md:5` | "Forked from `skills/poteto-mode/playbooks/autopilot-stack.md` at `9a6784c` and the `autopilot-full.md` it inherits, pstack BASE `e44668c`. …" | keep | Fork provenance with the BASE pinned. |

## (e) investigate — 6 references, 2 files, plus 2 cross-cutting subjects

### E1 — `poteto-agent` becomes an orphan delegate (6 references, 2 files)

`poteto-agent` exists to be spawned by `poteto-mode` runs. With the door retired, nothing in the pack routes to it. Its file stays in-tree (the vendored `agents/` path), but it is still registered: `kimi.plugin.json` and `.cursor-plugin/plugin.json` both carry `"agents": "./agents/"`, so the harness still offers it. Three decisions are entangled and belong together:

- Does `poteto-agent` stay registered (a manual-style delegate), retire with the door, or get repurposed as a start-dev delegate?
- If it retires, `skills/poteto-help/SKILL.md:60` ("spawn it as the pack's `poteto-agent`") loses its target, and the `agents/` directory changes.
- `docker/rig/lib-kimi.sh:127` runs `kimi --agent poteto-agent -p "Reply with exactly OK."` as the plugin-child probe. That probe is about *any* custom agent template receiving the plugin adapter, so it can be repointed at `dev-owner` — but it must be repointed, not left pointing at a retired agent.

| file:line | quote | action | note |
|---|---|---|---|
| `agents/poteto-agent.md:3` | "description: Delegate subagent for code-writing and helper tasks spawned during a `/poteto-mode` run. Use for delegates, not as the runner for `/poteto-mode` itself. …" | investigate | Frontmatter names the retired door twice. |
| `agents/poteto-agent.md:10` | "You are operating as poteto-mode's full agent style. The chat that receives `/poteto-mode` owns the playbook, the todo list, and every spawn. You are one of its delegates." | investigate | The agent's entire operating premise is the retired door. |
| `agents/poteto-agent.md:12` | "Before any work, read the `poteto-mode` `SKILL.md` at the absolute path your parent supplied, in full, including its inline Principles index. …" | investigate | Runtime read by absolute path. Resolves today because the directory stays in-tree; becomes an orphan read if the door is retired from the surface. |
| `codex-agents/poteto-agent.toml:4` | "description = \"Delegate subagent for code-writing and helper tasks spawned during a poteto-mode run. …\"" | investigate | Codex port of the above; must move in lockstep with `agents/poteto-agent.md` (`scripts/validate-pack` checks the dev-owner pair for parity, so the same discipline applies here). |
| `codex-agents/poteto-agent.toml:10` | "You are operating as poteto-mode's full agent style. The chat that starts the run owns the playbook, the todo list, and every subagent spawn." | investigate | Codex port. |
| `codex-agents/poteto-agent.toml:12` | "Before any work, read the `poteto-mode` `SKILL.md` at the absolute path your parent supplied, in full …" | investigate | Codex port. |

### E2 — vendored-path constraint (blocks the (b) and (c) edits)

**This is the sweep's hard blocker.** `AGENTS.md:6` allows exactly seven local-diff categories and ends with "no other workflow modification is allowed". Of the 37 files in this inventory, **18 are under vendored pstack paths** per `vendor-manifest.txt` (7 vendored paths):

`docs/` (all 11 guide pages — 87 refs), `skills/poteto-help/` (43 refs), `skills/setup-pstack/` (1 ref), `skills/automate-me/` (1 ref), `skills/figure-it-out/` (2 refs), `agents/` (3 refs), `.cursor-plugin/` (2 refs).

That is **139 of 179 references (78%) sitting in paths the current policy forbids editing.** The existing local diffs in those paths are the harness-adapter hunks (path and URL fixes) — diffing against the pstack mirror shows `docs/guide/01-setup.md` differs by 2 lines, `02-poteto-mode.md` by 2, `07-overnight.md` by 8, `10-recipes-and-pitfalls.md` by 2, `skills/poteto-help/SKILL.md` by 18, `skills/automate-me/SKILL.md` by 11, `skills/figure-it-out/SKILL.md` by 1, `agents/poteto-agent.md` by 6 — all of them adapter or link fixes, none of them workflow content.

The sweep therefore needs one of two decisions before it can edit anything:

1. **Declare new hunks.** Add the rewritten paths to `vendor-manifest.txt`'s "Intended local modifications" list and to the allowed-diffs clause in `AGENTS.md`, each with a one-reason-per-path line, matching the existing AINX-395 pattern. `vendor-manifest.txt:7` and `AGENTS.md:6` are the two lines that change. This is the cheaper path and matches how the repo already handles local divergence.
2. **Upstream it.** Change pstack itself and re-sync. `~/projects/pstack` is a pure mirror, so this is an upstream contribution, out of this repo's hands, and slow.

Whichever is chosen is an operator decision for ticket 04. Note also that `scripts/sync-upstream` reads `vendor-manifest.txt` to decide what to pull, so option 1 changes what a future sync attempts to reconcile — that is the point of declaring the hunks, not a side effect to avoid.

### E3 — adjacent mentions outside the strict scope (2 references, 2 files)

Neither line contains the string `poteto-mode`, but the sweep should look at both:

| file:line | quote | action | note |
|---|---|---|---|
| `docker/rig/lib-kimi.sh:127` | "--agent poteto-agent -p \"Reply with exactly OK.\" --output-format text" | investigate | The plugin-child probe in the five-host rig. Valid only while `poteto-agent` ships. Repoint at `dev-owner` if E1 retires it. |
| `README.md:100` | "The private poteto tooling package is versioned separately." | investigate | The private tooling package, not the skill. Probably untouched; check that retiring the door does not retire the package. |

## Verified clean — zero `poteto-mode` references

Searched and confirmed empty. This closes the map's open question ("whether any hook or automation (e.g. benny) invokes poteto-mode"):

- **Hooks** — `hooks/claude-hooks.json`, `hooks/harness-context.sh`. The hook delivers the harness-contract pointer (`harness=`, `profile=`, `profile-root=`) and nothing else; it names no skill.
- **Automations** — all 12 files under `automations/benny/` (3 skills, 4 reference docs, 2 templates, `FOR_AGENTS.md`, `README.md`).
- **Extensions and rules** — `extensions/harness-contract.ts`, `rules/harness-contract.mdc`.
- **Scripts** — `scripts/wire-audit` (a Kimi *agent wire-trail* auditor for orchestration breaches, not a skill-wiring audit), `scripts/validate-pack`, `scripts/validate-harnesses`, `scripts/install`, `scripts/release`, `scripts/sync-upstream`, `scripts/resolve-harness`, `scripts/frozen_skills.py`.
- **Docs/harness** — `docs/harness/nesting.md`, `docs/harness/wire-audit.md`.
- **Trackers and adapters** — `references/trackers/{github,gitlab,local-markdown}.md`, `references/adapters/{README.md,kimi.md,pointer.txt}`, `references/frozen-skills.tsv`.
- **CI** — everything under `.github/workflows/`.
- **`skills/wayfinder/`** — zero references, including its `agents/` subdirectory. The brief listed wayfinder under (c); there is nothing to remove there.
- **`GLOSSARY.md`** — zero references to poteto, poteto-mode, or "front door". It needs new terms (Front door, Effort tree, Run root) but has nothing to remove.
- **`docs/issue-tracker.md`** — does not exist in this repo; the tracker defaults live in `references/trackers/`.

## Sweep order

Ordered by dependency, not by file count. Steps 1–3 are safe and independent; step 4 gates everything after it.

1. **Settle the vendored-path policy (E2).** Decide declared hunks vs upstream change. Amend `AGENTS.md:6` and `vendor-manifest.txt:7` (and the "Intended local modifications" block at `vendor-manifest.txt:14-20`) with the new paths, one reason per path. Nothing in steps 2+ that touches `docs/`, `skills/poteto-help/`, `skills/automate-me/`, `skills/figure-it-out/`, `skills/setup-pstack/`, `agents/`, or `.cursor-plugin/` is safe to land before this.
2. **Decide `poteto-agent` (E1).** Retire, keep, or repurpose. This must land with step 3 because the manifests register `agents/`, and it must land before step 5 because `skills/poteto-help/SKILL.md:60` and the rig probe depend on the answer.
3. **Unregister the door (a).** Five manifests: the four version-managed ones (`plugin.json`, `kimi.plugin.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`) — keep their `description` strings identical — plus `.claude-plugin/marketplace.json`, whose description is already stale and needs a full rewrite. Then `README.md:34` and `README.md:36`. Run `scripts/version check` afterwards: it validates the four manifests' versions, not their content, so it will not catch a mismatch between the four `description` strings. Check them by eye or with a diff.
4. **Fix the onboarding routers (c).** `skills/to-spec/SKILL.md:21` first — it is the chain's load-bearing pointer and it must point at `skills/start-dev/playbooks/program-plan.md`. Then `skills/setup-workspace/SKILL.md:88` (needs ticket 02's two-door policy verbatim) and `skills/setup-pstack/SKILL.md:45` (needs the role-vocabulary reconciliation, which is a second decision, not just a text edit).
5. **Rewrite the help skill (b).** `skills/poteto-help/SKILL.md` and `references/recipes.md` — 43 references, the largest block. Needs the ticket-02 routing policy and the ticket-04 decision on whether `poteto-help` survives at all.
6. **Rewrite the guide (b).** 87 references across 11 pages, in this order:
   a. `docs/guide/README.md` (nav + framing) and `docs/guide/01-setup.md` — set the two-door premise.
   b. `docs/guide/02-poteto-mode.md` — the keystone. Rename the file (it cannot keep a `poteto-mode` filename), replace the routing diagram and the prompt-shape teaching with the two-door chain, and rewire the 4 inbound links: `docs/guide/README.md:8`, `docs/guide/01-setup.md:66`, `docs/guide/03-understand.md:3` (anchor `./02-poteto-mode.md#what-goes-in-a-prompt`), `skills/poteto-help/SKILL.md:52`.
   c. `docs/guide/03-understand.md` … `docs/guide/10-recipes-and-pitfalls.md` — retarget prompt examples; replace poteto-mode playbook links with the two-door equivalents or drop the links where no equivalent exists (`worktree-cleanup`, `hillclimb`, `runtime-forensics`, `trace-forensics`, `visual-parity`, `eval`, `authoring-a-skill`, `autonomous-run`, `pause-safely`, `autopilot-full`, `autopilot-stack`, `orchestrate`, `investigation`, `session-pickup`, `prototype`).
   d. `docs/guide/08-principles.md:3` — reattribute the principles index to `start-dev`.
7. **Repoint the runtime readers (b).** `skills/automate-me/SKILL.md:67`, `skills/figure-it-out/SKILL.md:15` and `:33`. Small, but they are live reads — a retired door read at runtime is the failure mode this whole sweep exists to prevent.
8. **Clean the profiles (b).** The `bun` line in all five `references/harnesses/*.md`. Independent of the guide; can ride along with any step.
9. **Verify, then keep the keep-list (d).** No edits to the 22 keep rows. Check that every by-path read still resolves: `skills/poteto-mode/playbooks/{opening-a-pr,multi-phase-plan,feature,autopilot-stack,autopilot-full}.md`, `skills/poteto-mode/scripts/{check-plan.mjs,worktree-audit.sh}`, `skills/poteto-mode/playbooks/worktree-cleanup.md`, `skills/poteto-mode/SKILL.md` § Principles and § Subagents, and `skills/poteto-mode/references/bugbot-triage.md`. Then run `scripts/validate-pack` and `scripts/validate-harnesses` — note `validate-harnesses` tests **committed HEAD**, so commit before running it, and report `MANUAL`/`SKIPPED` outcomes as limits rather than passes.
10. **Release hygiene.** The four manifests change, so `scripts/version set` / `scripts/version check` must stay green, and the release notes need the two-door change described for `0.x` compatibility.

## Count summary

| action | references | files | where |
|---|---|---|---|
| (a) unregister | 11 | 7 | 5 plugin manifests (9), `README.md` (2) |
| (b) rewrite | 131 | 20 | guide pages (87), harness profiles (5), `skills/poteto-help` (36), `automate-me` (1), `figure-it-out` (2) |
| (c) remove-suggestion | 10 | 4 | `to-spec` (1), `setup-workspace` (1), `setup-pstack` (1), `skills/poteto-help` (7) |
| (d) keep | 22 | 7 | `README.md` (2), `AGENTS.md` (1), `vendor-manifest.txt` (4), `skills/start-dev` (15) |
| (e) investigate | 6 + 2 adjacent | 2 + 2 | `agents/poteto-agent.md` (3), `codex-agents/poteto-agent.toml` (3), plus `docker/rig/lib-kimi.sh` (1) and `README.md:100` (1) as adjacent, non-literal mentions |
| **total** | **182** | **38** | 179 literal `poteto-mode` references + 3 adjacent mentions (`README.md:34`, `README.md:100`, `docker/rig/lib-kimi.sh:127`) |

Row count by section in this document: (a) 11, (b) 131, (c) 10, (d) 22, (e) 8 — 182 rows, matching the table. Every one of the 179 literal references was machine-checked against this table: no gaps, no invented rows. The three adjacent rows are called out as such in their notes.

Two cross-cutting (e) subjects carry no reference lines of their own: the vendored-path constraint (E2, blocks 139 of 179 references) and the adjacent `poteto-agent` rig probe (E3).

Reference lines by area: guide 87, `skills/poteto-help` 43, `skills/start-dev` 15, manifests 9, root files (`README`, `AGENTS.md`, `vendor-manifest.txt`) 8, harness profiles 5, agents 6, onboarding and runtime-reader skills 6.
