---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's transcript in the active workspace's session directory. Read the active profile's Transcripts section for the root, layout, and relocation variable; read the profile before this search. Do not glob across every project's directory. That crosses workspace boundaries and reads private chats from unrelated projects.

Take the newest candidates first and confirm one by finding the conversation's opening user prompt in its first user message. If none matches, pass a tight digest of the session instead.

## 2. Spawn three reviewers in parallel

One message, three spawns using the profile's Subagents section. Reviewers need MCP access to look up the tickets, chat threads, and observability traces the transcript references, so a read-only mode that strips MCPs is wrong here.

**Harness profile.** Read the active profile before harness-dependent work; `profile` is absolute, or relative to `profile-root` (`plugin` means the installed plugin root), and a parent passes its child the resolved absolute path; stop the affected action if the profile is unavailable. Pass the active `harness=` and absolute `profile=` paths in every reviewer prompt so each child can read the profile itself. Use the spawn tool and arguments the profile's Subagents section names, and keep the prompt and model. Where the profile supports no parallel spawn, run the reviewers sequentially and disclose the reduced independence in the reply and trail. Where it supports no spawn, run each role yourself in sequence and disclose the same.

Each reviewer and the synthesizer name a role line in `~/.agents/pstack-models.md` and a default. Read the profile's Models section for the native binding, availability gate, subagent mechanism, and inheritance token. Set `model` to that line's value, or to the default if the file or the line is missing. Leave `model` unset when the value is `auto`, `inherit-parent`, or the profile's inheritance token. If the chosen value is not established as available, use the nearest listed family default and say so; with no listed alternative, stop that spawn and say why. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the profile.

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `grok-4.7-xhigh-fast` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in the spawn response body.

## 3. Synthesize

One synthesizer spawn using the profile's Subagents section, `model` from the `reflect judgment, divergent, synthesizer` line (default `claude-opus-5-5-xhigh`), in a mode that keeps MCP access. It spot-verifies citations through MCP, so a read-only mode that strips MCPs is wrong here. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. Pass the active `harness=` and `profile=` paths too. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the **encode-lessons-in-structure** principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File each Backlog item to your team's devex or backlog tracker without waiting. Only the Accepted list waits for approval.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to your harness's skill-authoring skill and run its draft / test / iterate loop. That is `create-skill` in Cursor (built in) or Anthropic's `skill-creator`. If you have neither, follow the Agent Skills format at agentskills.io. "`create-skill`" below means whichever of these you use.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `create-skill` and run its description-optimization loop.
- `new skill via create-skill: <kebab-name>`: hand creation to `create-skill`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
