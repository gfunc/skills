# start-dev report contract

Every start-dev brief carries this contract verbatim. The spawned `poteto-agent` owes one row per owned step.

- One todo and one result row per owned step, in the shape `step | executed | absorbed | blocked | evidence`.
- `absorbed` names the child or step owner that absorbed the step and the evidence.
- If you cannot spawn, execute the step yourself or return it as `BLOCKED` with a reason. Never mark it done.
- Return file pointers, not raw dumps.

The contract lives in the briefs and playbooks, not in `agents/poteto-agent.md`. The agent template stays restored to its pstack content apart from its harness hunks and the `subagents` allowlist.
