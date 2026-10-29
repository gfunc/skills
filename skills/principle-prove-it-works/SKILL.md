---
name: principle-prove-it-works
description: "Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'"
disable-model-invocation: true
---

# Prove It Works

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or "it compiles."

**Why:** Unverified work has unknown correctness. Indirect verification (file mtimes, output freshness, agent self-reports, cached screenshots) feels cheaper than direct observation. Acting on a wrong inference costs far more than checking the source.

## The iron law

No completion claim without fresh verification evidence. If you have not run the verifying command in this message, you cannot claim it passes. The claim is not weakened by confidence, a previous run, or a child's report; it is false.

- Identify the command that proves the claim.
- Run it in full, now, and read the exit code and the whole output.
- If the output confirms the claim, state the claim with the evidence. If it does not, state the actual status with its evidence.
- A skipped step is not verification with less rigor. It is an unverified claim.

Adapted from superpowers' `verification-before-completion`, MIT, Jesse Vincent.

Check the real thing, not a proxy:
- Check process liveness directly, not indirectly through derived state
- Read the actual value, not a cached or derived representation
- When verification fails, suspect the observation method before suspecting the system

## Script the check when you can

The strongest proof is a deterministic script that re-runs the same comparison, not a one-time eyeball. Write the script, run it, and keep its output as an artifact a reviewer can re-run instead of trusting your word.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, like a big port or migration (the **show-me-your-work** skill).
