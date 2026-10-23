# Record a setup run

Write a concise report at `.scratch/setup-workspace/<run-id>/report.md` in the target repository. Use a unique run ID and do not overwrite an earlier run. Confirm that the report is gitignored before persisting it. A needed ignore-rule edit belongs in the repository preview and approval. Never alter ignore rules silently or persist a report in a tracked path as a workaround.

Use these headings and fill only observed details. Omit secrets and credential-bearing URLs. Record paths, safe command summaries, outcomes, and evidence locations instead of raw authentication output.

## Run and approvals

Record the target and pack roots, harness identity, absolute profile, run ID, and any prior run being resumed. Name the inspected inputs, explicit phase choices, exact approvals, and declined offers. List created resources by identity so interruption cleanup can distinguish run-owned resources from existing ones.

## Workspace

Give a state, reason, evidence, and next action. Name the tracker authority or local-Markdown default, guidance owner, domain references, and execution or check commands. List approved differences, completed writes, preserved custom content, and stopped actions. Distinguish discovered commands from commands actually executed.

## User and harness

Report model preferences, native availability, and plugin state as separate items, each with a state, reason, evidence, and next action. Name reused or written preference paths and any incomplete owner work. Identify unavailable or unconfirmed roles. Report installation as reused, explicitly completed, not requested, declined, or blocked with the corresponding state. A usable clone does not require installation. Configuration or availability evidence is not model execution proof.

## Verification

Give a state, reason, evidence, and next action. Name tests, harnesses, skill candidates, the selected target, mapped consumer paths, and unmapped paths. Record the offer and decision. If work ran, name the owner outcome, files, commands, actual journeys, failures, cleanup, and evidence that survived cleanup. Label draft or unexecuted work explicitly. A declined phase has no journey proof.

## Recovery and persistence

List successful work retained, remaining differences, run-owned resources removed or still needing cleanup, and evidence retained. State whether the report persisted and was read back. If the directory is read-only, not ignored, or otherwise unavailable, return this report in the conversation. Name the attempted path and reason without claiming it was saved. Keep the persistence limitation visible even when repository wiring is ready.

## Use precise states

Assign states per item rather than hiding mixed outcomes behind one success label.

- `ready` means the stated requirements were established. Cite the supporting inspection or execution evidence.
- `needs-action` means identified configuration or capability work remains. Name the next action.
- `blocked` means a conflict, prerequisite, permission, or failure prevents the affected work. Name it precisely.
- `declined` means the operator declined an optional phase. Do not imply completion or offer it again in this run.
- `not-applicable` needs a concrete reason. No UI alone is not a reason. Installation can be not applicable when the loaded plugin is reused or clone use needs no installation.

Use discovered or configured for files and settings found or written. Use verified only when the owner workflow's required real execution completed and its evidence survived cleanup. One proved journey does not prove every consumer path.
