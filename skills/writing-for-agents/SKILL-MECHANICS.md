# Skill mechanics

The skill-specific branch of [`writing-for-agents`](SKILL.md): what changes when the document is a skill (frontmatter, the invocation choice, and router skills). Everything else about writing it is the universal reference in `SKILL.md`.

## Invocation

Use the active harness profile and native skill mechanism to establish discovery, explicit invocation, and delegation behavior. Resolve the profile through the pack's [adapter contract](../../references/adapters/README.md). Invocation flags do not have identical effects across hosts.

Two choices trade context load against cognitive load:

- A **model-invoked** skill needs a description carrying its trigger branches. Where the host supports automatic discovery, that description lets the agent reach the skill without a separate user invocation. Keep shared reference discoverable when another workflow must reach it. Omit `disable-model-invocation` where the host uses that flag for this choice.
- A **user-invoked** skill relies on an explicit user request. Where supported, `disable-model-invocation: true` restricts automatic invocation. Whether its description remains visible or another workflow can explicitly invoke it is host-dependent. Use a short human-facing description, and verify the intended restriction on the actual host.

Pick automatic discovery when the agent or another workflow needs independent reach. Pick explicit user invocation when the human should decide when to run the workflow. Keep the required `name` and `description` frontmatter in either case.

Shared reference can live in a plain file reached through a context pointer when its consumers need no independent skill invocation. A file pointer and permission to invoke a workflow are different contracts.

## Splitting by invocation

Split off a model-invoked skill when a distinct leading word should trigger it independently, or another workflow needs to reach it. The sequence cut lives in `SKILL.md`. Pay the new description's context load only when that independent reach earns it.

## Router skills

A **router skill** names the available workflows and when to reach each. It gives the human one entry point instead of many. Whether it recommends another invocation or continues through that skill depends on its own instructions and the host's invocation support. Check the active profile rather than assuming every router is recommendation-only.
