import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "bun:test";

const checker = join(import.meta.dir, "check-plan.mjs");
const rule =
	"Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";

const laneLine = (n: number, timeout = "45") =>
	`- [ ] Lane ${n}. Save \`lane-${n}.png\`. Pass when evidence exists. \`Timeout ${timeout}\``;
const lanesBlock = (overrides?: Record<number, string>) =>
	Array.from({ length: 10 }, (_, i) => laneLine(i + 1, overrides?.[i + 1] ?? "45")).join("\n");

const planWith = (lanes: string) => `# Demo

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
${lanes}
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

const validPlan = planWith(lanesBlock());

const runChecked = (content: string, expectedExit: number, args: string[]) => {
	const directory = mkdtempSync(join(tmpdir(), "check-plan-test-"));
	const file = join(directory, "plan.md");
	writeFileSync(file, content);
	try {
		const result = spawnSync("node", [checker, ...args, file], { encoding: "utf8" });
		expect(result.status).toBe(expectedExit);
		return result;
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
};
const runPlan = (example: string, expectedExit: number, args = ["--spawn-bound", "120"]) =>
	runChecked(validPlan + example, expectedExit, args);
const runMutated = (
	mutate: (plan: string) => string,
	expectedExit: number,
	args = ["--spawn-bound", "120"],
) => runChecked(mutate(validPlan), expectedExit, args);

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
		expect(heading.stderr).toContain('"## Example only" after Close the program is not an appendix');
	}

	const prose = runPlan("```markdown\nThis prose has a mid-sentence colon: inside code\n```\nThis prose has a mid-sentence colon: bad.\n", 1);
	expect(prose.stderr).toContain("mid-sentence colon");
});

test("rejects backtick info strings containing a backtick", () => {
	const result = runPlan("```markdown `invalid`\n## Example only\n```\n", 1);
	expect(result.stderr).toContain('"## Example only" after Close the program is not an appendix');
});

test("accepts lanes at the spawn bound and rejects one over it", () => {
	runMutated((p) => p.replaceAll("`Timeout 45`", "`Timeout 120`"), 0);
	const over = runMutated((p) => p.replaceAll("`Timeout 45`", "`Timeout 121`"), 1);
	expect(over.stderr).toContain("lane 1 timeout 121 minutes exceeds the spawn bound of 120");
});

test("unlimited skips the comparison but not the format check", () => {
	runMutated((p) => p.replaceAll("`Timeout 45`", "`Timeout 99999`"), 0, ["--spawn-bound", "unlimited"]);
	const zero = runMutated((p) => p.replaceAll("`Timeout 45`", "`Timeout 0`"), 1, ["--spawn-bound", "unlimited"]);
	expect(zero.stderr).toContain("must be a positive whole number of minutes");
	const pointFive = runMutated((p) => p.replaceAll("`Timeout 45`", "`Timeout 1.5`"), 1, ["--spawn-bound", "unlimited"]);
	expect(pointFive.stderr).toContain("lane 1 timeout must be a positive whole number of minutes");
});

test("rejects a lane without a Timeout marker", () => {
	const result = runMutated(
		(p) => p.replace("Lane 4. Save `lane-4.png`. Pass when evidence exists. `Timeout 45`", "Lane 4. Save `lane-4.png`. Pass when evidence exists."),
		1,
	);
	expect(result.stderr).toContain("lane 4 names no backticked `Timeout <minutes>`");
});

test("requires the spawn bound and rejects invalid values with usage and exit 2", () => {
	for (const args of [
		[],
		["--spawn-bound"],
		["--spawn-bound", "0"],
		["--spawn-bound", "-5"],
		["--spawn-bound", "1.5"],
		["--spawn-bound", "abc"],
		["--spawn-bound", "120", "--wat"],
		["--spawn-bound", "120", "extra.md"],
	]) {
		const result = runPlan("", 2, args);
		expect(result.stderr).toContain("Usage: node check-plan.mjs --spawn-bound <minutes|unlimited> <plan.md>");
	}
});

test("accepts each continuation marker spelling and rejects a plan with none", () => {
	runMutated((p) => p.replace("/loop 1h", "/goal"), 0);
	runMutated((p) => p.replace("/loop 1h", "a CronCreate hourly tick"), 0);
	const none = runMutated((p) => p.replace(" /loop 1h", ""), 1);
	expect(none.stderr).toContain('Program checklist lacks a continuation marker ("/loop 1h", "/goal", or "CronCreate")');
	expect(none.stderr).not.toContain('lacks "/loop 1h"');
});

test("reports an unreadable plan with exit 2", () => {
	const file = join(tmpdir(), "check-plan-test-missing", "nope.md");
	const result = spawnSync("node", [checker, "--spawn-bound", "120", file], { encoding: "utf8" });
	expect(result.status).toBe(2);
	expect(result.stderr).toContain(`check-plan: cannot read ${file}`);
});

test("the emitted skeleton's ten lane lines carry Timeout markers", () => {
	const playbook = join(import.meta.dir, "..", "playbooks", "multi-phase-plan.md");
	const laneLines = readFileSync(playbook, "utf8").split("\n").filter((l) => /^- \[ \] Lane \d+\./.test(l));
	expect(laneLines).toHaveLength(10);
	for (const lane of laneLines) expect(lane).toContain("`Timeout ");
});

test("the inlined spawn-bound rules match start-dev's plan-shape.mjs", () => {
	const sibling = join(import.meta.dir, "..", "..", "..", "start-dev", "references", "plan-shape.mjs");
	if (!existsSync(sibling)) {
		console.log("SKIP drift test: skills/start-dev/references/plan-shape.mjs is absent (not vendored in this checkout); the inlined copies are unguarded here");
		return;
	}
	const shape = readFileSync(sibling, "utf8");
	const checkerSource = readFileSync(checker, "utf8");
	const shared = [
		'if (!/^[1-9]\\d*$/.test(value)) return "must be a positive whole number of minutes";',
		"? `${value} minutes exceeds the spawn bound of ${ctx.spawnBound.minutes}`",
		"return `lane ${ctx.lane ?? \"?\"} timeout ${message}`;",
	];
	for (const needle of shared) {
		expect(shape).toContain(needle);
		expect(checkerSource).toContain(needle);
	}
	expect(shape).toMatch(/spawnMinutes\(value, ctx\) \{\s*if \(!\/\^\[1-9\]\\d\*\$\/\.test\(value\)\)[^;]+;\s*if \(!ctx\.spawnBound \|\| ctx\.spawnBound\.unlimited\) return null;/);
});
