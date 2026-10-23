---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget. Detects your available models and writes a settings file that overrides the skill defaults, and installs the pack's native plugin for this harness. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Write pstack's model settings, one model per role:

- **Cursor:** `~/.agents/pstack-models.md`, the portable settings file pstack skills read. Cursor does not auto-load `~/.cursor/rules/pstack-models.mdc`: User Rules are managed in Cursor Settings, and project rules live in `.cursor/rules/*.mdc`. To have Cursor apply the lines natively, also add `.cursor/rules/pstack-models.mdc` to the project (with the frontmatter below) or paste the same lines into User Rules.
- **Claude Code:** `~/.claude/rules/pstack-models.md`. Claude Code loads every file in `~/.claude/rules/` into each new session.
- **Every other harness** (Codex, Pi, OpenCode, and others): `~/.agents/pstack-models.md`. These harnesses don't load it on their own, so pstack skills read this file when they pick a model.

"The settings file" below means the file for your harness. In Cursor that is the portable `~/.agents/pstack-models.md`; an optional project rule is a native delivery copy, not a second source of truth. In Claude Code, if that file is missing, read `~/.agents/pstack-models.md` instead, where older versions of this skill wrote it.

## Steps

### 1. Detect available models

Enumerate the model slugs you can pass to a subagent in this session (Cursor `Task`, Claude Code `Agent`, OpenCode `task`, Codex `spawn_agent`). That is the dependable source. If your harness also has a command that lists the user's models, prefer it for completeness (for example `opencode models` or `pi --list-models`). If you cannot detect any, ask the user to paste the slugs they have access to. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If the settings file already exists, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from those defaults. A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer your structured-question tool (`AskQuestion` in Cursor, `AskUserQuestion` in Claude Code, `question` in OpenCode) over free text. Offer these four options with these exact labels, and name the current budget when the rule records one. With no rule, say that `large` matches the skill defaults.

- `unlimited — max reasoning`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Build the working table from the skill defaults, and on a re-run keep any role you changed by family, list, or alias (`inherit-parent`, `auto`). `unlimited`, `large`, `medium`, and `small` set the effort token of every real slug, panel entries included, to `max`, `xhigh`, `high`, or `medium`. The effort token is the last token, or the one before a trailing `fast`, on the ladder `max` > `xhigh` > `high` > `medium` > `low`. If the result is not a detected slug, use the same family's detected slug with the highest effort at or below the target, else mark the role as needing a choice. `inherit-parent` and `auto` do not change. So `unlimited` turns `claude-opus-5-5-xhigh` into `claude-opus-5-5-max`. Grok slugs top out at `xhigh`, so under `unlimited` the fallback puts Grok at `xhigh` and keeps `grok-4.7-xhigh-fast` as it is. `large` keeps both defaults. `small` turns them into `claude-opus-5-5-medium` and `grok-4.7-medium-fast`.

**(c) Show the roles and confirm.** Show every role with its model, marking any real slug not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` (both mean: this role runs on the parent chat model, which is how Auto users stay on Auto) as the options. Prefer your structured-question tool over free text. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model family differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again.

### 5. Write the rule

Write the settings file with a `# budget` line with the chosen label and its target effort, and one line per role, using the same labels poteto-mode uses. Write it without frontmatter (start at the first `#` line). In Cursor, if you also write the optional `.cursor/rules/pstack-models.mdc` delivery copy, that copy alone includes the frontmatter below with `alwaysApply: true`. Overwrite the whole file so re-runs stay idempotent. Shape (frontmatter belongs only in the Cursor delivery copy):

```
---
description: pstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit the subagent `model`). Alias entries in a panel list still count toward its fan-out.
# budget: large (xhigh)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: grok-4.7-xhigh-fast
perf-issue: grok-4.7-xhigh-fast
hillclimb: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-xhigh
hardest tasks: claude-opus-5-5-xhigh
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-xhigh
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-xhigh
reflect tooling: grok-4.7-xhigh-fast
reflect judgment, divergent, synthesizer: claude-opus-5-5-xhigh
arena runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
arena cross-judge pool: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
swarm workers: grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
```

### 6. Install the plugin for this harness

This step installs the pack's native plugin; it does not select a profile. Every profile under `references/harnesses/` ships with the pack, and the active harness's adapter — or `scripts/resolve-harness` on a plain clone — names the right one at runtime.

Use the harness that is running this session: the adapter line in context names it. With no adapter line (a plain clone), `scripts/resolve-harness` prints the selection (explicit input first, then a warned marker fallback). Ask the user only when neither is available, and treat the answer as the install target, not a profile choice.

Run the pack's installer from the pack root — it is the single source of truth for the install mechanics (native plugin install, kimi's managed-copy pre-seed, codex's subagent TOMLs):

```sh
<pack-root>/scripts/install --harness <active-harness>
```

The pack root is two directories up from this skill file (`setup-pstack/` to `skills/` to the root); resolve it from this file's location, not the caller's working directory. The script prints one `INSTALL <harness> <stage> OK` line per stage and exits non-zero on any `FAIL`; if any stage fails, surface the failure to the user instead of falling back to manual copies.

If the script is missing or not executable, report that the installer is unavailable; do not hand-copy profiles. On `codex`, also copy the pack root's `codex-agents/*.toml` into `$CODEX_HOME/agents/` (create the directory, overwrite for idempotency). Codex does not plugin-package subagents, so without this step the pack's named agents are absent there.

The profiles ship complete, including in copied installations (Kimi's managed copy and Codex's plugin cache). The adapter line or resolver gives the absolute path to read; a missing or unreadable profile stops that harness-dependent action. There is no shared `references/harness.md`.

### 7. Confirm

Tell the user which files were written: the settings file, plus what the install step reported — the plugin stages, and on `codex` also the subagent TOMLs under `$CODEX_HOME/agents/`. On harnesses with a native plugin install (kimi, claude, codex, pi) the plugin itself was installed too; the script's stage lines are the record. Claude Code loads `~/.claude/rules/pstack-models.md` into new sessions automatically; Cursor does not auto-load a user-level rule file, so pstack skills read `~/.agents/pstack-models.md` (or the optional project rule). In Cursor there is no plugin install — the script prints the per-session `--plugin-dir` guidance instead. Re-running this skill updates both.

### 8. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.

### 9. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.
