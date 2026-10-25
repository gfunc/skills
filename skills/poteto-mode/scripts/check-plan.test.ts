import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const checker = join(import.meta.dirname, "check-plan.mjs");
const rule =
	"Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";
const laneBlock = Array.from(
	{ length: 10 },
	(_, i) => `- [ ] Lane ${i + 1}. Save \`lane-${i + 1}.png\`. Pass when evidence exists.`,
).join("\n");

const validPlan = `# Demo

## How to read this
One box is one unit of work and names the evidence. Check a box only when its evidence exists. See playbooks/.
${rule}

## Program checklist
### Arm the program
### Spawn owners
### PR mechanics
### Verdict and merge
### Boot recipe
\`git show origin/main:\` /loop 1h status message

## PR 1
**Depends on.** None.
**Files.**
- [ ] Do the thing.
**Build.**
- [ ] Do the thing.
**You see.**
- [ ] Do the thing.
**Verify, unit.** ${rule}
- [ ] Check the thing.
**Verify, live.** ${rule} Ten lanes on \`example-model\` at the PR head
${laneBlock}
**Verify, perf.** ${rule}
- [ ] Metric. Recorded.
- [ ] Probe. Recorded.
- [ ] Baseline. Recorded.
- [ ] Rule. Recorded.
**Review gate.** None.
**Merge.**
- [ ] Merge when approved.

## Close the program
Close.

## Appendix Prototype evidence
Recorded.
`;

const runPlanText = (text: string, expectedExit: number) => {
	const directory = mkdtempSync(join(tmpdir(), "check-plan-test-"));
	const file = join(directory, "plan.md");
	writeFileSync(file, text);
	try {
		const result = spawnSync("node", [checker, file], { encoding: "utf8" });
		assert.strictEqual(result.status, expectedExit);
		return result;
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
};

const runPlan = (example: string, expectedExit: number) => runPlanText(validPlan + example, expectedExit);

test("accepts ordinary, indented, and longer closing fences", () => {
	for (const indent of ["", " ", "  ", "   "])
		runPlan(`${indent}\`\`\`markdown\n## Example only\n${indent}\`\`\`\n`, 0);
	runPlan("```markdown\n## Example only\n````\n", 0);
});

test("accepts nested backticks and tilde info strings", () => {
	runPlan("````markdown\n```markdown\n## Example only\n```\n````\n", 0);
	runPlan("~~~markdown `info`\n## Example only\n ~~~\n", 0);
});

test("keeps mismatched, shorter, and suffixed closers inside the fence", () => {
	runPlan("````markdown\n~~~\n## Example only\n````\n", 0);
	runPlan("````markdown\n```\n## Example only\n````\n", 0);
	runPlan("````markdown\n``` info\n## Example only\n````\n", 0);
});

test("rejects headings and prose outside a proper close", () => {
	for (const suffix of ["  ", "\t"]) {
		const heading = runPlan(`\`\`\`markdown\n## Example only\n\`\`\`${suffix}\n## Example only\n`, 1);
		assert.ok(heading.stderr.includes('"## Example only" after Close the program is not an appendix'));
	}

	const prose = runPlan("```markdown\nThis prose has a mid-sentence colon: inside code\n```\nThis prose has a mid-sentence colon: bad.\n", 1);
	assert.ok(prose.stderr.includes("mid-sentence colon"));
});

test("rejects backtick info strings containing a backtick", () => {
	const result = runPlan("```markdown `invalid`\n## Example only\n```\n", 1);
	assert.ok(result.stderr.includes('"## Example only" after Close the program is not an appendix'));
});

test("accepts a cli plan with Log lanes", () => {
	const cliPlan = validPlan
		.replace("## PR 1\n**Depends on.**", "## PR 1\nSurface: cli\n**Depends on.**")
		.replaceAll("Save `", "Log `");
	runPlanText(cliPlan, 0);
});

test("accepts a library plan without lanes and with a None review gate", () => {
	const libraryPlan = validPlan
		.replace("## PR 1\n**Depends on.**", "## PR 1\nSurface: library\n**Depends on.**")
		.replace(" Ten lanes on `example-model` at the PR head", "")
		.replace(laneBlock, "- [ ] Run the probe against the PR head and diff the output tails.");
	runPlanText(libraryPlan, 0);
});

test("rejects a library plan with a gated review form", () => {
	const libraryPlan = validPlan
		.replace("## PR 1\n**Depends on.**", "## PR 1\nSurface: library\n**Depends on.**")
		.replace(" Ten lanes on `example-model` at the PR head", "")
		.replace(laneBlock, "- [ ] Run the probe against the PR head and diff the output tails.")
		.replace("**Review gate.** None.", "**Review gate.** The operator reviews before merge.");
	const result = runPlanText(libraryPlan, 1);
	assert.ok(result.stderr.includes('Review gate must be "None. <PR id> is not review-gated." for library surfaces'));
});

test("rejects a ui plan missing lanes", () => {
	const uiPlan = validPlan.replace(
		"- [ ] Lane 1. Save `lane-1.png`. Pass when evidence exists.",
		"- [ ] Check the thing.",
	);
	const result = runPlanText(uiPlan, 1);
	assert.ok(result.stderr.includes("live box is not a lane"));
});

test("rejects an unknown Surface value", () => {
	const plan = validPlan.replace("## PR 1\n**Depends on.**", "## PR 1\nSurface: banana\n**Depends on.**");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('unknown Surface "banana"'));
});

test("accepts extra H3s after the required five in the Program checklist", () => {
	const plan = validPlan.replace(
		"### Boot recipe\n",
		"### Boot recipe\n### Standing orders\n\n1. Evidence is exit codes and output tails, never a self-report.\n",
	);
	runPlanText(plan, 0);
});

test("rejects more than one Surface line in a PR section", () => {
	const plan = validPlan.replace(
		"## PR 1\n**Depends on.**",
		"## PR 1\nSurface: ui\nSurface: cli\n**Depends on.**",
	);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("more than one Surface line"));
});

test("accepts an indented Surface line without a colon flag", () => {
	const plan = validPlan.replace("## PR 1\n**Depends on.**", "## PR 1\n  Surface: ui\n**Depends on.**");
	runPlanText(plan, 0);
});

test("accepts a profile-named continuation in place of /loop 1h", () => {
	const goalPlan = validPlan.replace(
		"`git show origin/main:` /loop 1h status message",
		"`git show origin/main:` CronCreate `/goal` status message",
	);
	runPlanText(goalPlan, 0);
});

test("rejects a program checklist with no continuation marker", () => {
	const noTick = validPlan.replace(
		"`git show origin/main:` /loop 1h status message",
		"`git show origin/main:` status message",
	);
	const result = runPlanText(noTick, 1);
	assert.ok(result.stderr.includes("continuation marker"));
});
