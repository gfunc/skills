---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

**Harness profile.** Read the active profile before harness-dependent work; `profile` is absolute, or relative to `profile-root` (`plugin` means the installed plugin root), and a parent passes its child the resolved absolute path; stop the affected action if the profile is unavailable.

Every spawn uses the tool and arguments the profile's Subagents section names. Explorers and explainers are read-only: they report and never edit. Use the profile's read-only mode where it has one. Explorers use the `how explorer` line in `~/.agents/pstack-models.md` (default `grok-4.7-xhigh-fast`), and every explainer uses the `how explainer` line (default `claude-opus-5-5-xhigh`). Read the profile's Models section for the native binding, availability gate, subagent mechanism, and inheritance token. Set `model` to that line's value, or to the default if the file or the line is missing. Leave `model` unset when the value is `auto`, `inherit-parent`, or the profile's inheritance token. If the chosen value is not established as available, use the nearest listed family default and say so; with no listed alternative, stop that spawn and say why. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the profile.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

Where the profile supports no parallel spawn, run the explorers sequentially and disclose the reduced independence in the reply and trail. Where it supports no spawn, run each role yourself in sequence and disclose the same. Pass the active `harness=` and `profile=` paths in every explorer and explainer prompt.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers in a single message, each with `references/explorer-prompt.md` and its angle filled in.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
