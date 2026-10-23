---
name: poteto-help
description: Guides users through workspace onboarding, focused pstack model setup, /poteto-mode, and picking a skill, playbook, or principle. Type /poteto-help with a question.
disable-model-invocation: true
---

# Poteto help

Answer the user's question about the gfunc pack, give them a prompt they can send, and link the file the answer came from. For a help question, do not start setup or a task. Let the user send the prompt before work spends tokens or changes files.

A message that asks for work, such as "use pstack to fix this bug", is not a help question. Route repository onboarding to [`setup-workspace`](../setup-workspace/SKILL.md) and model-only configuration to [`setup-pstack`](../setup-pstack/SKILL.md). For a product task, read [`poteto-mode`](../poteto-mode/SKILL.md) and follow it. Mention Custom Modes only for Cursor.

This file maps questions to the skills and guide pages that own the answers. Read the owner before quoting it, and trust it when it disagrees with this map. Link the actual installed or cloned pack file. Establish this gfunc repository's URL and revision before giving a public link. Do not substitute an upstream pstack page for locally modified instructions.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with these options, then answer only the section they pick:

- Get set up
- Start a task with `/poteto-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make pstack my own

Check the state that changes the answer, and mention it only when it does:

- Without `~/.agents/pstack-models.md`, roles use their skill defaults. This says nothing about native model availability. The active profile's Models section owns that gate.
- Distinguish tests, an execution harness, and a project-local verification skill with launch, drive, and feature-map instructions. A harness without a skill still qualifies for the workspace flow's one generation offer. A usable stale skill qualifies for maintenance. Neither discovery nor file creation proves a real journey.
- Formal verification is separate from workspace setup. Mention `/create-formal-verification-skill` for a race, invariant, or property question. If an existing formal skill is stale for the code in question, read `/maintain-formal-verification-skill` before recommending it.

For repository onboarding, recommend `/setup-workspace`, including its one missing-model offer. For a question limited to model preferences or cost, recommend the focused `/setup-pstack` shortcut. Do not require both invocations. Answer a help question without starting either workflow.

## Get set up

1. Reuse the loaded gfunc plugin or use a plain clone without installing. The [setup guide](../../docs/guide/01-setup.md) covers invocation and clone selection.
2. Run [`/setup-workspace`](../setup-workspace/SKILL.md) in the target repository. It discovers existing state, previews scoped changes, and completes approved phases. If model configuration is accepted, it runs the shared model owner and resumes onboarding. It does not hand the user another command to run.
3. Choose optional verification work after its concrete preview. Generation is offered once when a project-local skill is absent, even with an existing harness. Maintenance is offered once for a usable stale skill. Multiple candidates require a target choice. The existing verification owners keep their real-journey proof requirements.
4. Review the separate workspace, user and harness, and verification results. The report belongs in the target's ignored `.scratch/setup-workspace/<run-id>/report.md`. Unsaved reports and declined or blocked work stay visible. Setup does not start implementation.
5. Start a separate task with `/wayfinder` for a large unclear goal, or `/poteto-mode` with a clear goal and a check.

Installation or update is a separate explicit request and approval. The [installer](../../scripts/install) owns native delivery. Kimi refuses replacement when the source resolves to its managed destination, so an update needs a separate source checkout. Do not stage a self-copy or bypass native trust. Use this pack's [adapter contract](../../references/adapters/README.md), not upstream pstack installation commands or an unsupported-host list.

Repository setup preserves custom tracker and agent guidance. Local Markdown remains the default without explicit tracker configuration, even with a remote. Setup does not create empty domain documents or write to remote trackers. Verification approval covers only the previewed local work. Dependencies, native repairs, paid calls, shared resources, product fixes, commits, and PRs need separate authorization. Declined or blocked verification does not stop unrelated onboarding.

For model preferences only, read [`setup-pstack`](../setup-pstack/SKILL.md). It reuses existing preferences unless reconfiguration is selected, validates availability, and writes only approved changes to the universal file. It does not install plugins, repair native settings, or offer verification work. That skill owns role defaults, budgets, inheritance, and delivery copies.

If cost is the concern, explain that subagents and panels consume extra tokens. Recommend an explicit budget or model change through `/setup-pstack`, or a shorter panel list. Use supported inheritance values when roles should run on the parent model. Save `/poteto-mode` for work that needs its checks.

The [README](../../README.md) and [setup guide](../../docs/guide/01-setup.md) own the overview and procedure. The active profile owns native invocation and capability limits. Use the host's displayed skill spelling. For example, Kimi uses `/gfunc-skills:setup-workspace`. Offer to word a first task prompt per [`references/prompting.md`](references/prompting.md).

## Start a task with `/poteto-mode`

`/poteto-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one. [Guide page 2](../../docs/guide/02-poteto-mode.md) has examples.

Whether `/poteto-mode` stays on depends on how the user starts it:

- Enter on `/poteto-mode` attaches the skill to one message. It fades as the chat moves on.
- Option+Enter on Mac or Alt+Enter on Windows, or Use as Mode from the skill entry, makes it a Custom Mode. It stays in context every turn until the user exits the mode, and it stays out of casual turns.
- Cursor's docs list Custom Modes in the Agents Window and the CLI. Elsewhere, start each new task with `/poteto-mode`.

Link [Cursor's skills docs](https://cursor.com/docs/skills) when this comes up. Mid-chat, "new task" makes the mode match a fresh playbook. `/poteto-mode` already uses `poteto-agent` for the subagents its playbook steps spawn. To get the same style from a subagent of your own, spawn it as the pack's `poteto-agent` where the harness registers that agent.

## Pick a skill

The default answer is `/poteto-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Onboard a repository and complete approved setup phases | [`/setup-workspace`](../setup-workspace/SKILL.md) |
| Plan a large unclear goal as decision tickets | [`/wayfinder`](../wayfinder/SKILL.md) |
| Turn an agreed conversation into a spec | [`/to-spec`](../to-spec/SKILL.md) |
| Do any non-trivial task with rigor | [`/poteto-mode`](../poteto-mode/SKILL.md) |
| Check that the agent understood their goal and the problem before it starts | [`/in-your-own-words`](../in-your-own-words/SKILL.md) |
| Aim a task higher before starting: more expert, more outcome-focused, not overspecified | [`/sharpen`](../sharpen/SKILL.md) |
| Know how code works now, or where new code should live | [`/how`](../how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`/why`](../why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`/teach`](../teach/SKILL.md) |
| Catch up on their own recent work on a topic | [`/recall`](../recall/SKILL.md) |
| Catch up on what changed in this chat since their last message, in plain words and small visuals, with every item waiting on them listed and decidable from the reply alone | [`/ketchup`](../ketchup/SKILL.md) |
| Know what a small diff could break outside itself | [`/blast-radius`](../blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`/architect`](../architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`/arena`](../arena/SKILL.md) |
| Run parallel checks over slices, or race workers, as cloud agents | [`/swarm`](../swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`/interrogate`](../interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`/tdd`](../tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/no-comments`](../no-comments/SKILL.md) |
| Clean AI tells out of prose | [`/unslop`](../unslop/SKILL.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/technical-writing`](../technical-writing/SKILL.md) |
| Write skills, agent instructions, or context pointers | [`/writing-for-agents`](../writing-for-agents/SKILL.md) |
| Hear the last reply again in plain words | [`/bro`](../bro/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/create-verification-skill`](../create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`/maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| Formally verify a race, invariant, or other property that tests rarely reach | [`/create-formal-verification-skill`](../create-formal-verification-skill/SKILL.md) |
| Bring a formal verification back in line after the code it covers changed, and learn whether a failure is drift or a bug | [`/maintain-formal-verification-skill`](../maintain-formal-verification-skill/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`/benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`/figure-it-out`](../figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward | [`/show-me-your-work`](../show-me-your-work/SKILL.md) |
| Pick a model for each role and a reasoning budget | [`/setup-pstack`](../setup-pstack/SKILL.md) |
| Turn their own working habits into a personal mode skill | [`/automate-me`](../automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`/reflect`](../reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo | [`/correct`](../correct/SKILL.md) |
| Build a page whose buttons wake a Grok Bot over a webhook | [`/make-bot-ui`](../make-bot-ui/SKILL.md) |
| Find their way around pstack | `/poteto-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `/how` explains what the code does. `/why` explains the reasons. `/teach` runs one or both and explains the result plainly.
- `/arena` gives every worker the same brief and merges the best parts. `/swarm` splits work into slices or a race and returns one report.
- `/architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/interrogate` reviews the diff. `/blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/recall` rebuilds context across recent chats. `/ketchup` covers only this chat since the user's last message. Resuming one specific chat or branch is the Session pickup playbook.
- `/figure-it-out` designs one rigorous run. The Orchestrate playbook runs a program that spans days and many PRs. The Autonomous run playbook drives one task to a finish condition.

Not in pstack:

- `/deslop`, `control-cli`, and `control-ui` ship in the `cursor-team-kit` plugin.
- `/loop` and `/create-skill` are Cursor built-ins.
- pstack has no `/orchestrate` skill. Orchestrate is a `/poteto-mode` playbook. If the slash menu shows `/orchestrate`, another plugin provides it.

## Playbooks and principles

Playbooks are step lists inside `/poteto-mode`, not skills, so they have no slash command. Inside `/poteto-mode`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot-full. "stack them, don't ship" runs Autopilot-stack.
- "run the eval playbook" runs Eval.

Without `/poteto-mode`, a phrase such as "babysit this pr" can start Cursor's own skill for the same job instead. The Playbooks section of [`poteto-mode`](../poteto-mode/SKILL.md) lists every playbook and when it applies. [Guide page 6](../../docs/guide/06-verify-and-ship.md) covers opening, babysitting, and landing a PR.

For a large unclear goal, use [`wayfinder`](../wayfinder/SKILL.md). [`to-spec`](../to-spec/SKILL.md) turns agreed discussion into a spec and continues to the [Multi-phase plan playbook](../poteto-mode/playbooks/multi-phase-plan.md). The operator confirms the spec and the execution plan before implementation. For a settled design, ask `/poteto-mode` for a plan directly. For an empirical design question, use the Prototype playbook or `/architect`.

Principles are one-rule skills that `/poteto-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/principle-<name>` still loads one on demand. [Guide page 8](../../docs/guide/08-principles.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying after a few turns | In Cursor, use a Custom Mode. Elsewhere, use the host's skill invocation for each new task. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | Check the universal preference file and the active profile's availability gate. A preference does not provision a native model. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Use the host's displayed skill command. `setup-workspace` and `setup-pstack` allow model invocation. Most other pack skills require explicit invocation or routing by `/poteto-mode`. |
| Parallel agents overwrote each other | Give each agent its own worktree, or run them as cloud agents, which each get their own machine. |
| An overnight run moved but finished nothing | `/loop` needs a check that can pass or fail, not a duration. See [guide page 7](../../docs/guide/07-overnight.md). |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers. [Guide page 10](../../docs/guide/10-recipes-and-pitfalls.md) has more pitfalls and the recipes worth copying.

## Make pstack my own

- [`/automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/poteto-mode`.
- [`/reflect`](../reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- `/poteto-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

[Guide page 9](../../docs/guide/09-make-it-yours.md) covers each of these.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
