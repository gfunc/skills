# anthropic `webapp-testing` — what it actually provides

Research ticket: `.scratch/prototype-process/issues/03-webapp-testing.md` (wayfinder: prototype-process rework).
Question: what does the upstream Anthropic webapp-testing skill provide, and what should a per-scenario built-in verify step reuse vs borrow?

## Sources

| # | Source | Citation |
|---|---|---|
| S1 | Upstream skill directory (all 7 files) | `anthropics/skills` @ `2c5958e` — [tree](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing) |
| S2 | `skills/webapp-testing/SKILL.md` (3913 B) | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing/SKILL.md) |
| S3 | `skills/webapp-testing/scripts/with_server.py` (3693 B) | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing/scripts/with_server.py) |
| S4 | `skills/webapp-testing/examples/element_discovery.py` (1463 B) | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing/examples/element_discovery.py) |
| S5 | `skills/webapp-testing/examples/console_logging.py` (1027 B) | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing/examples/console_logging.py) |
| S6 | `skills/webapp-testing/examples/static_html_automation.py` (953 B) | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing/examples/static_html_automation.py) |
| S7 | `skills/webapp-testing/LICENSE.txt` (11345 B, Apache 2.0, "Copyright 2026 Anthropic, PBC") | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/webapp-testing/LICENSE.txt) |
| S8 | Repo `README.md` — "Many of these skills are open source (Apache 2.0)" | [blob](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/README.md) |
| S9 | Our `skills/playwright-cli/SKILL.md` | local: `skills/playwright-cli/SKILL.md` |
| S10 | Our `skills/playwright-cli/references/spec-driven-testing.md` | local: `skills/playwright-cli/references/spec-driven-testing.md` |
| S11 | Our `skills/playwright-cli/references/test-generation.md` | local: `skills/playwright-cli/references/test-generation.md` |
| S12 | Our `skills/playwright-cli/references/storage-state.md`, `session-management.md`, `request-mocking.md`, `tracing.md`, `video-recording.md` | local: `skills/playwright-cli/references/` |
| S13 | Our `skills/prototype/SKILL.md` (current branch rules) | local: `skills/prototype/SKILL.md` |
| S14 | Git history for the skill path | `37292f37` (init repo, 2025-10-15) → `ef740771` (#129, 2025-12-01, renamed `examples/webapp-testing/` → `skills/webapp-testing/`) → `b9e19e6f` (#990, 2026-04-20, Apache notice) |

All upstream claims below were read from the files at commit `2c5958e` (repo `main` as of 2026-11-07).

## 0. Size reality check

The whole upstream skill is **7 files, ~22 KB**, of which 11 KB is the Apache license text:

```
skills/webapp-testing/
├── LICENSE.txt          (Apache 2.0)
├── SKILL.md             (3.9 KB — the entire instruction surface)
├── examples/
│   ├── console_logging.py
│   ├── element_discovery.py
│   └── static_html_automation.py
└── scripts/
    └── with_server.py   (3.7 KB — the only reusable artifact)
```

[S1] There is no test framework, no fixture directory, no config file, no reference directory, and no second script. Any claim that this skill "provides a test loop" must be read against that fact.

---

## 1. Its test loop (server lifecycle, drive, assertions, teardown)

### 1.1 Server lifecycle — the one real mechanism

`scripts/with_server.py` (S3) is a thin, self-contained process supervisor:

- **Start**: each `--server "<shell command>"` is launched with `subprocess.Popen(cmd, shell=True, stdout=PIPE, stderr=PIPE)`. `shell=True` is what makes `cd backend && python server.py` work (S3, comment in code).
- **Readiness**: `is_server_ready(port, timeout=30)` polls `socket.create_connection(('localhost', port), timeout=1)` every 0.5 s until the **TCP port accepts a connection** (S3). It is a port check, not an HTTP health check — a server that binds the port but returns 500 is considered "ready".
- **Multi-server**: `--server`/`--port` are both `action='append'`; counts must match or the script exits 1 with "Number of --server and --port arguments must match". Servers start **sequentially**, each awaited before the next launches (S3).
- **Timeout**: `--timeout` seconds per server, default 30; exceeding it raises `RuntimeError` inside the `try`, so the `finally` still tears down what started.
- **Run**: the trailing command (after `--`) is executed with `subprocess.run(args.command)`; its return code is propagated via `sys.exit(result.returncode)` (S3).
- **Teardown**: `finally` block → `process.terminate()`, `wait(timeout=5)`, then `kill()` + `wait()` if it does not exit in 5 s (S3). Teardown runs on success, on child failure, and on the readiness `RuntimeError`.

Two code-level caveats worth knowing before adopting it:

1. `stdout`/`stderr` are piped but **never read**. A chatty dev server that writes more than one pipe buffer (~64 KB) blocks, and the port never opens → false "server failed to start" after 30 s.
2. Readiness is TCP-only and the sequential start means backend-before-frontend ordering matters only for port binding, not for real dependency readiness.

### 1.2 Drive

There is no built-in driving loop. The skill instructs the agent to **write a native Python Playwright script** per task (S2, "To test local web applications, write native Python Playwright scripts"), using `sync_playwright()` and `p.chromium.launch(headless=True)` (S2). The mandated shape is:

```python
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)   # always headless chromium (S2)
    page = browser.new_page()
    page.goto('http://localhost:5173')          # server already running and ready
    page.wait_for_load_state('networkidle')      # "CRITICAL: Wait for JS to execute" (S2)
    # ... your automation logic
    browser.close()
```

The **decision tree** (S2) is: static HTML → read the HTML file for selectors; dynamic app → is the server already running? no → `with_server.py`; yes → "reconnaissance-then-action": navigate + `networkidle` → screenshot/inspect DOM → derive selectors from rendered state → act.

### 1.3 Assertions

**There are none.** No `expect()`, no assertion helper, no pass/fail criterion, no test file format. The word "verifying" appears only in the skill's `description` ("Supports verifying frontend functionality") (S2). The closest thing to a check is a human/agent eyeballing a screenshot or reading a console dump — the examples print findings to stdout and exit 0 unconditionally (S4, S5, S6).

This is the sharpest gap against the ticket's premise: **upstream has no assertion layer at all.** Any claim that a "built-in verify step" could be lifted from upstream must be rejected for this part.

### 1.4 Teardown

Two independent teardowns, both "best effort":

- Browser: `browser.close()` at the end of the user's script (S2 best practice: "Always close the browser when done"; present in all three examples, S4/S5/S6).
- Servers: the `finally` block in `with_server.py` (S3). If the script is killed with SIGKILL, servers are orphaned — there is no process-group kill.

---

## 2. Fixture/data and state-reset strategy

**Neither exists upstream.** Concretely:

- No fixture directory, no seed test, no `conftest.py`, no setup/teardown hooks, no data factories, no seed-data SQL/JSON.
- No state reset of any kind. The examples use **in-memory** flows only: `page.fill('#name', 'John Doe')`, `page.fill('#email', 'john@example.com')` (S6) — hard-coded literals inline in the script, never re-seeded.
- The **only** implicit reset is "start a fresh server process": `with_server.py` gives you a new process per run, so in-memory app state dies with it. That is the entire isolation story, and it holds only for apps whose state lives in the server process (not for a shared DB, not for the browser profile, not for cookies).
- Browser context is fresh per script by construction (`p.chromium.launch()` → `new_page()`), so cookies/localStorage do not leak **within** a run — but nothing resets them **between** runs, and there is no persistent-profile option upstream (the opposite of our `playwright-cli open --persistent`, S9).
- No network mocking/fault injection, so a scenario cannot be made deterministic against a flaky dependency.

For comparison, our pack already owns the state-reset half: `references/spec-driven-testing.md` §1.2 defines a **seed test** and a **fixture** (`baseTest.extend({ page: async ({page}, use) => {...} })`) that lands every scenario in the same state (S10), plus the rule "Each scenario is independent and starts from the seed's fresh state — never chain scenarios" (S10). `references/storage-state.md` and `session-management.md` add `state-save`/`state-load`, cookie and localStorage/sessionStorage manipulation (S9, S12).

---

## 3. How it reports evidence

Evidence is **ad-hoc and file-based**, with no report structure:

| Evidence type | Where it goes | Source |
|---|---|---|
| Full-page screenshot | `/mnt/user-data/outputs/static_page.png`, `.../after_submit.png` | S6 |
| Element-discovery screenshot | `/tmp/page_discovery.png` | S4 |
| Console log capture | `/mnt/user-data/outputs/console.log` | S5 |
| Element inventory (buttons/links/inputs with `name`, `type`, `href`) | stdout, `print()` only | S4 |
| DOM content | in-memory `page.content()`, never persisted | S2 |

Notes on quality:

- `/mnt/user-data/outputs/` is a **Claude Code sandbox path**, not a repo-relative artifact directory (S5, S6). Nothing tells the agent where evidence should live in the user's project, so evidence lands outside version control by default.
- `/tmp/page_discovery.png` (S4) uses a second, inconsistent location in the same skill — evidence location is not specified by the skill, it is whatever each example happens to use.
- Console capture uses a `page.on("console", handler)` collector that **appends to a list and writes the file only at the very end**, after `browser.close()` (S5). A crash before the write loses all logs.
- There is **no** trace, **no** video, **no** network log, **no** diff, **no** pass/fail marker, **no** structured output, **no** artifact manifest. The only "reporter" is `print()`.
- Upstream never writes a `results`/report file, so "evidence" is indistinguishable from "debug output".

Compare ours: `playwright-cli` emits a snapshot after every command, writes snapshots to `.playwright-cli/page-<timestamp>.yml`, offers `--raw` (machine-readable value only) and `--json` (structured reply), plus `console`, `requests`, `request <n>`, `tracing-start/stop`, `video-start/stop`, `screenshot --filename=`, `pdf`, and `show --annotate` for user-annotated review (S9, S12). That is a real evidence channel; upstream has a filename convention.

---

## 4. Gap vs our `playwright-cli` skill — reuse vs borrow

### 4.1 Capability matrix

| Capability | Upstream `webapp-testing` | Our `playwright-cli` | Delta |
|---|---|---|---|
| Browser driver | Python `sync_api` script written per task | CLI command surface, ref-based interaction | ours richer |
| Browser choice | chromium, headless only | chrome / firefox / webkit / msedge, headed or headless, CDP attach, persistent profile (S9) | ours |
| Element discovery | `page.content()` / `locator(...).all()` (S2, S4) | `snapshot` → `e15` refs, `--depth`, `--boxes` (S9) | ours |
| Selector strategy | descriptive `text=` / `role=` / CSS (S2) | ref, CSS, `getByRole`, `getByTestId`, `generate-locator` (S9) | ours |
| Server lifecycle | `with_server.py` (S3) | none in-skill | **upstream unique** |
| Assertions | **none** | `expect()` + matcher catalogue (S11) | ours |
| Seed / fixture / state reset | **none** | seed test + fixture (S10) | ours |
| Per-scenario independence | implied by fresh process | explicit rule (S10) | ours |
| Evidence artifacts | screenshot + console log to hard-coded paths | snapshot yml, screenshot, pdf, video, trace, console, requests, `--raw`/`--json` (S9, S12) | ours |
| Request mocking | none | `route`/`unroute` (S9, `references/request-mocking.md`) | ours |
| Storage control | none | `state-save/load`, cookie/localStorage/sessionStorage get/set/clear (S9, S12) | ours |
| Static-HTML path | `file://` URL recipe (S6) | not covered | **upstream unique** |
| Context discipline | "run `--help` first, do not read script source" (S2) | n/a | **upstream unique** |

### 4.2 What a per-scenario built-in verify step should **reuse** (from ours)

The wayfinder decision already stands: "Webapp verification is built into each scenario branch and reuses `playwright-cli`; no new mechanism owner" (`.scratch/prototype-process/map.md`). Upstream does not change that — it is strictly weaker on the verify half. Reuse:

1. **Observation primitives** — `playwright-cli snapshot` (element inventory as YAML), `eval` (read a value), `screenshot --filename=...` (visual evidence). A scenario verify step is: run the scenario → snapshot/eval the observable → compare against the expected → screenshot as the artifact.
2. **Expected-value capture** — `playwright-cli --raw eval "el => el.textContent" e5` and `--raw generate-locator e5` (S11) give the scenario's expected value and a stable locator at authoring time; at verify time the same eval returns the observed value.
3. **Diffing as the assertion** — the documented pattern `playwright-cli --raw snapshot > before.yml` … `> after.yml` … `diff before.yml after.yml` (S9) is the closest thing we have to a per-scenario assertion, and it is what a built-in verify step should generalize (expect = snapshot fragment or value; observed = the same read after the action).
4. **Seed + fixture for state reset** (S10) — reuse verbatim as the "start from known state" contract of every scenario branch.
5. **Failure diagnosis** — `console` and `requests` (S9) as the first two probes when a scenario's verify fails; `tracing-start/stop` and `video-start/stop` when the failure is visual or timing-related.
6. **Machine-readable output** — `--raw` / `--json` (S9) so a verify step can be scripted instead of eyeballed.

### 4.3 What it should **borrow** (from upstream)

1. **`scripts/with_server.py` — server lifecycle.** This is the single genuinely adoptable artifact (S3). It solves a problem we do not solve at all: "run the app, then tear it down, guaranteed". A per-scenario verify step that must "run with one command" (the map's first completion gate) needs exactly this. Apache-2.0, so it can be vendored with attribution (see §5).
2. **The static-HTML escape hatch** — `file://` URLs for a single self-contained HTML page (S6). Our pack has no equivalent; a design-doc→UI prototype often *is* one HTML file, and driving it needs no server at all. Borrow as a "no server needed" lane in the decision tree.
3. **The "black-box script" discipline** (S2): run `--help` first, do not read the script source, because "these scripts can be very large and thus pollute your context window". The same argument applies to our helper scripts and reference files — worth restating locally when we add a helper of our own.
4. **The decision-tree shape** (S2): static → dynamic → server-running? → recon-then-act. Our verify step needs the same triaged entry point ("is the app already running, or must I start it?"), because the map's gate says "runnable with one command".
5. **The reconnaissance-then-action ordering** (S2): inspect the rendered DOM *before* choosing a selector, and wait for the app to settle before inspecting. Our `snapshot` is the modern equivalent of that inspection, so we borrow the *ordering rule*, not the mechanism.

### 4.4 What it should **not** borrow

- **"Always launch chromium in headless mode"** (S2) — conflicts with our multi-browser, headed, and CDP-attach options (S9), and with the UI-review flow (`show --annotate`, S9).
- **`wait_for_load_state('networkidle')` as a CRITICAL rule** (S2) — our own heal guidance says "Never skip hooks or add sleeps as a fix. Never use `networkidle`" (`skills/playwright-cli/references/spec-driven-testing.md:276`). Adopting upstream's hard rule would import a flakiness source into our verify step. (Note our own `references/running-code.md:95` and `skills/playwright-expert/references/debugging-flaky.md:96` still show `networkidle` — the pack is internally inconsistent here; this is a pre-existing inconsistency, out of scope for this ticket, but it should not be settled by copying upstream.)
- **Python-only script authoring** — our pack is CLI/Node-shaped; requiring `sync_playwright()` scripts would fork the mechanism and add a Python dependency.
- **`/mnt/user-data/outputs/` and `/tmp` as evidence locations** (S4, S5, S6) — Claude Code sandbox paths. Our verify step must write evidence into the project's own artifact directory.
- **The whole "no assertions" design** — it is the gap, not the model.

---

## 5. Adoptable pieces, with provenance and license

### 5.1 License and provenance

- The skill directory ships its own `LICENSE.txt`: **Apache License 2.0**, "Copyright 2026 Anthropic, PBC" (S7). The repo README confirms "Many of these skills are open source (Apache 2.0)" (S8).
- Repo `anthropics/skills` was created 2025-09-22; the skill entered as `examples/webapp-testing/` in the initial commit `37292f37` (2025-10-15), was **renamed** to `skills/webapp-testing/` in `ef740771` (PR #129, 2025-12-01), and got its Apache copyright notice in `b9e19e6f` (PR #990, 2026-04-20) (S14). Only those two later commits touched the path — the skill body itself has not changed materially since the initial commit.
- The repo README also carries a disclaimer: the skills are "provided for demonstration and educational purposes only" (S8). That reinforces "borrow patterns, vendor carefully", and it is a reason not to describe the upstream skill as a production testing system.
- Apache-2.0 permits redistribution and modification with: copy of the license, changed-file notices, retention of attribution/NOTICE, and no trademark use (S7 §4). Our repo's existing precedent is the pstack vendoring convention in `vendor-manifest.txt` plus inline credit to the MIT source in each modified file; an Apache-2.0 vendored script should follow the same shape: keep the Apache header, add an inline credit line, and record the path in the manifest.

### 5.2 Adoption table

| Piece | Upstream path | Adopt? | How | License / attribution |
|---|---|---|---|---|
| `with_server.py` (server lifecycle helper) | `skills/webapp-testing/scripts/with_server.py` (S3) | **Yes — highest value** | Vendor under our helper-script home with a fixed-up copy (see caveats) | Apache-2.0, Anthropic PBC; keep header, add inline credit, list path in `vendor-manifest.txt` |
| `file://` static-HTML recipe | `examples/static_html_automation.py` (S6) | **Yes — as a pattern, not code** | Add a "no server needed" lane to the verify step's decision tree | Apache-2.0 if code is copied; a described pattern needs no attribution |
| Black-box-script discipline ("`--help` first, don't read the source") | `SKILL.md` (S2) | **Yes — as a writing rule** | Restate in our own words for any helper we add | Apache-2.0 (idea); reworded, no attribution needed |
| Recon-then-act ordering + decision tree | `SKILL.md` (S2) | **Yes — as a shape** | Mirror the triaged entry point in our branch files | Apache-2.0 (idea); reworded |
| Element-inventory snippet | `examples/element_discovery.py` (S4) | **No** | Our `snapshot` already produces a richer inventory | n/a |
| Console-capture snippet | `examples/console_logging.py` (S5) | **No** | Our `playwright-cli console` already does it, with better output location | n/a |
| Headless-chromium-only rule | `SKILL.md` (S2) | **No** | Conflicts with multi-browser/headed/CDP support | n/a |
| Mandatory `networkidle` wait | `SKILL.md` (S2) | **No** | Conflicts with our heal guidance (`spec-driven-testing.md:276`) | n/a |
| `/mnt/user-data/outputs/` paths | S5, S6 | **No** | Claude Code sandbox paths, not project-relative | n/a |
| "No assertions / no fixtures / no state reset" | whole skill | **No** | This is the gap the wayfinder map asks us to fill, not copy | n/a |

### 5.3 Caveats if `with_server.py` is vendored

1. **Port-polling, not health-checking.** A port-open check passes for a server that is up but broken. If we vendor it, add an optional HTTP-probe flag; otherwise the verify step must do its own first-request check.
2. **Unread pipes.** `stdout=PIPE, stderr=PIPE` with no reader will block a chatty dev server after ~64 KB of output. Either drain the pipes to a log file or use `stdout=None`.
3. **Sequential readiness.** Only one server is started at a time; parallel start + per-port readiness would be faster and would tolerate independent backends.
4. **No process-group kill.** `terminate()` on the shell's PID may leave the real child (e.g. `npm run dev` → node) alive. Use `start_new_session=True` + `os.killpg` for guaranteed teardown — this matters because the map's gate demands the app must stop after a scenario.
5. **Exit-code plumbing.** The child command's exit code is already propagated (S3) — keep that; a verify step can rely on it.

---

## Bottom line

Upstream `webapp-testing` is a **7-file, 3.9 KB-instruction** skill whose only real mechanism is a ~100-line server-lifecycle script. It has **no assertions, no fixtures, no state reset, and no evidence protocol** — its "verification" is a screenshot plus a console dump written to a Claude Code sandbox path. Our `playwright-cli` skill already owns the entire verify half (snapshot/eval as observation, seed+fixture for state, `expect()` matchers, `--raw`/`--json`, tracing/video, request mocking, storage control). Therefore:

- **Reuse (from ours):** snapshot/eval/screenshot as the observation channel, `--raw` for machine-readable comparison, the seed-fixture contract for per-scenario state reset, and `console`/`requests`/tracing for failure diagnosis.
- **Borrow (from upstream):** `with_server.py` for server lifecycle (Apache-2.0, vendor with attribution), the `file://` static-HTML lane, the triaged decision-tree entry point, and the black-box-script context discipline.
- **Reject:** the assertion-free model, headless-chromium-only, mandatory `networkidle`, sandbox output paths, and Python-only authoring.

The wayfinder map's decision — "Webapp verification is built into each scenario branch and reuses `playwright-cli`; no new mechanism owner" — is confirmed by the evidence.
