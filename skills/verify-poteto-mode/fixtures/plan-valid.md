# Probe plan

One PR probe for launch readiness.

## How to read this

One box is one unit of work. Every box names the evidence. Check a box only when its evidence exists. The playbooks/ directory holds the workflow. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt.

### Spawn owners

- [ ] Spawn one owner per PR with a status message.

### PR mechanics

- [ ] Read the trunk file with `git show origin/main:` before editing.

### Verdict and merge

- [ ] Merge only on a green verdict.

### Boot recipe

- [ ] Boot the app and save the log.

## PR 1 probe

**Depends on.** trunk main.

**Files.**

- [ ] `scripts/check-plan.mjs`.

**Build.**

- [ ] `node --version` prints a version.

**You see.**

- [ ] The checker prints a summary.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `bun test check-plan.test.ts` passes.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `probe-model` at the PR head.

- [ ] Lane 1. `Timeout 45` Save `lane-1.png`. Pass when evidence exists.
- [ ] Lane 2. `Timeout 45` Save `lane-2.png`. Pass when evidence exists.
- [ ] Lane 3. `Timeout 45` Save `lane-3.png`. Pass when evidence exists.
- [ ] Lane 4. `Timeout 45` Save `lane-4.png`. Pass when evidence exists.
- [ ] Lane 5. `Timeout 45` Save `lane-5.png`. Pass when evidence exists.
- [ ] Lane 6. `Timeout 45` Save `lane-6.png`. Pass when evidence exists.
- [ ] Lane 7. `Timeout 45` Save `lane-7.png`. Pass when evidence exists.
- [ ] Lane 8. `Timeout 45` Save `lane-8.png`. Pass when evidence exists.
- [ ] Lane 9. `Timeout 45` Save `lane-9.png`. Pass when evidence exists.
- [ ] Lane 10. `Timeout 45` Save `lane-10.png`. Pass when evidence exists.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Checker wall time.
- [ ] Probe. Run the checker twice.
- [ ] Baseline. Trunk checker time.
- [ ] Rule. Head is within 2x baseline.

**Review gate.** None. PR 1 is not review-gated.

**Merge.**

- [ ] Merge on green.

## Close the program

- [ ] Close after the final drain.

## Appendix A Prototype evidence

- [ ] Not applicable for this probe.
