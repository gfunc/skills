# start-dev report contract

Every start-dev brief carries this contract verbatim. The spawned role, `dev-owner` or a role-prompt subagent, owes one row per owned step.

- One todo and one result row per owned step, in the shape `step | executed | absorbed | blocked | evidence`.
- `absorbed` names the child or step owner that absorbed the step and the evidence.
- If you cannot spawn, execute the step yourself or return it as `BLOCKED` with a reason. Never mark it done.
- Return file pointers, not raw dumps.
- One readiness row per run, at the handoff into the plan lead: the decision, its evidence pointer, and the map path it names. It rides the plan's approval summary.
- One map row per user-facing PR, in the handback: the feature entries the PR changed and the map head after the update. An `internal` PR carries no map row.

**Artifacts.** A unit's brief is a file the owner writes under `.scratch/<spec>/briefs/`, and the child reads only its own brief. The child's report is a file under `.scratch/<spec>/reports/`, while its reply is capped under fifteen lines and points at that file. A fix round appends to the same report rather than starting a new one. A brief never pastes a prior task's history, and a child never reads the whole plan.

The contract lives in the briefs and playbooks, not in `agents/poteto-agent.md`. That template stays restored to its pstack content apart from its harness hunks. `agents/dev-owner.md` carries its own copy of the contract because it is the execution owner.
