# Harness nesting

How each supported harness lets an agent spawn a child, what gates the child's
type, and the evidence behind the nested-spawn bullet in each
[profile](../../references/harnesses). The page also carries the probe used to
re-test a claim after a harness upgrade.

## Semantics

| harness | native spawn | gate | default child types | depth |
|---|---|---|---|---|
| Kimi | yes, `Agent` on every agent | `subagents:` child-type allowlist | `coder, explore, plan` when the field is absent | undocumented; custom agents sit outside the default set |
| Claude | yes, `Task` | the child definition needs the spawn tool in its `tools` | harness defaults | three layers below main by default |
| Codex | yes, `spawn_agent` | `agents.enabled = false` removes the multi-agent tools | harness defaults | undocumented |
| Pi | no stock tool | none | none; delegation is a child `pi` process | extension-defined |
| Cursor | one extra level | none documented | harness defaults | inference, not a documented contract |

## The zero-cost probe

Some harnesses validate the child type before starting anything, so an invalid
type reveals the allowed set without spawning a child or spending a model call.
On Kimi, ask the agent under test to call `Agent` once with a type that cannot
exist:

```
subagent_type: __nonexistent_probe__
```

The call returns in about a millisecond with:

```
subagent error: Subagent type "__nonexistent_probe__" is not allowed for this agent. Allowed subagent types: coder, explore.
```

Read the list from the error and discard the probe. No child runs, and the
parent's next turn is the only model cost.

## The real-child probe

Use this when the question is whether a child can spawn again, or when the
harness has no type check to trip.

1. Spawn the agent under test with a brief that says: call the spawn tool once
   with a trivial prompt (`Reply with exactly NEST-OK`), then report whether the
   call was accepted and the child's reply verbatim.
2. For depth, resume the returned child and ask it to spawn once more.
3. Record the harness version, the child id, and the exact error text.

## Results

Tested 2026-10-28.

- **Kimi Code 2.3.3.** `dev-owner` (`subagents: coder, explore`) spawned
  `explore`. A custom agent with no `subagents` field spawned `explore`.
  `plan` was rejected for `dev-owner` with `Allowed subagent types: coder,
  explore`. `dev-owner` was rejected for the no-field agent with `Allowed
  subagent types: coder, explore, plan`. Wire trail: `agents/agent-19/wire.jsonl`
  records `subagent.spawned` for `agent-20` with `parentAgentId: agent-19`; the
  no-field agent `agent-21` spawned `agent-22`.
- **Claude Code 2.1.307.** main to `general-purpose` to grandchild, which
  returned `DEEP-OK`. Three layers reachable.
- **Codex CLI 0.163.0.** Not exercised here because the machine is not logged
  in and the config has no `[agents]` section.
- **Pi 1.3.0.** Source read only. The README states Pi skips sub-agents. The
  shipped example spawns one child `pi` process per subagent.
- **Cursor.** Not installed, not exercised.

## Pi delegation

Pi has no spawn tool. Its documented answer is another Pi process, and the
harness's own example does exactly that: `pi --mode json -p --no-session` per
child, the prompt on stdin, the JSON stream back to the parent, and `--model`
when a different model is needed.

That child reloads extensions and sets no depth guard, so any extension the
stack relies on must add what the example lacks: a depth limit in the child
environment and a timeout. Without a guard, a child can spawn again without a
bound.

The pack ships no Pi extension, so this profile keeps its fallback. The main
agent runs the plan and review hats itself, sequentially, and the ledger
records the reduced independence.

## Re-testing

Profiles age. After a harness upgrade, run the zero-cost probe first. If the
harness has no type check, run the real-child probe. Update the dated row here
and the nested-spawn bullet in the profile in the same change.
