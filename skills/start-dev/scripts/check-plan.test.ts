import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
\`git show origin/main:\` status message
Continuation: /goal

## Run graph
\`\`\`mermaid
graph TD
  subgraph W1[Wave 1]
    T1[task: a lane src/one/**]
    T2[task: b lane src/two/**]
  end
  subgraph W2[Wave 2]
    T3[task: c lane src/one/**]
  end
  T1 -->|blocks| T3
  W1 -->|wave gate| W2
  W2 -->|feature gate| FG[gate: feature]
  FG -->|review| RL[gate: review]
\`\`\`
**Critical path.** W1 then W2 then the review gate.

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

const runPlanText = (text: string, expectedExit: number, env: Record<string, string> = {}) => {
	const directory = mkdtempSync(join(tmpdir(), "check-plan-test-"));
	const file = join(directory, "plan.md");
	writeFileSync(file, text);
	try {
		const result = spawnSync("node", [checker, file], {
			encoding: "utf8",
			env: { ...process.env, ...env },
		});
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

test("accepts a profile-named Continuation line", () => {
	const cronPlan = validPlan.replace("Continuation: /goal", "  Continuation: CronCreate hourly tick");
	runPlanText(cronPlan, 0);
});

test("rejects a program checklist with no Continuation line", () => {
	const noTick = validPlan.replace("Continuation: /goal\n", "");
	const result = runPlanText(noTick, 1);
	assert.ok(result.stderr.includes("Continuation"));
});

test("accepts an installed plugin path when the file exists", () => {
	const home = mkdtempSync(join(tmpdir(), "check-plan-home-"));
	try {
		const file = join(home, "plugins", "managed", "gfunc-skills", "skills", "poteto-mode", "playbooks", "autopilot-stack.md");
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, "# playbook\n");
		runPlanText(validPlan.replace("`git show origin/main:`", `\`${file}\``), 0);
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

test("rejects an installed plugin path when the plugin is present and the file is missing", () => {
	const home = mkdtempSync(join(tmpdir(), "check-plan-home-"));
	try {
		const file = join(home, "plugins", "managed", "gfunc-skills", "skills", "poteto-mode", "playbooks", "missing.md");
		mkdirSync(dirname(file), { recursive: true });
		const result = runPlanText(validPlan.replace("`git show origin/main:`", `\`${file}\``), 1);
		assert.ok(result.stderr.includes("installed plugin file does not exist"));
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

test("accepts an installed plugin path when the plugin is absent and prints a note", () => {
	const home = mkdtempSync(join(tmpdir(), "check-plan-home-"));
	try {
		const file = join(home, "plugins", "managed", "gfunc-skills", "skills", "poteto-mode", "playbooks", "autopilot-stack.md");
		const result = runPlanText(validPlan.replace("`git show origin/main:`", `\`${file}\``), 0);
		assert.ok(result.stderr.includes("installed plugin root is not present"));
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

test("rejects a program checklist with neither a remote marker nor an installed plugin path", () => {
	const plan = validPlan.replace("`git show origin/main:` ", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("read source"));
});

test("rejects a plugin-sourced plan whose tick prompt reads from trunk", () => {
	const home = mkdtempSync(join(tmpdir(), "check-plan-home-"));
	try {
		const file = join(home, "plugins", "managed", "gfunc-skills", "skills", "poteto-mode", "playbooks", "autopilot-stack.md");
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, "# playbook\n");
		const line = `\`${file}\` status message`;
		const plan = validPlan
			.replace("`git show origin/main:` status message", line)
			.replace(line, `${line}\nRe-read the execution playbook from trunk.`);
		const result = runPlanText(plan, 1);
		assert.ok(result.stderr.includes("tick prompt"));
	} finally {
		rmSync(home, { recursive: true, force: true });
	}
});

test("rejects a run graph missing a task lane", () => {
	const plan = validPlan.replace("T2[task: b lane src/two/**]", "T2[task: b]");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("has no file lane"));
});

test("rejects a run graph missing the review gate", () => {
	const plan = validPlan
		.replace("  FG -->|review| RL[gate: review]\n", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('"[gate: review]"'));
});

test("rejects a run graph missing the feature gate", () => {
	const plan = validPlan
		.replace("  W2 -->|feature gate| FG[gate: feature]\n", "")
		.replace("  FG -->|review| RL[gate: review]\n", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('"[gate: feature]"'));
});

test("rejects a cyclic run graph", () => {
	const plan = validPlan.replace("  T1 -->|blocks| T3\n", "  T1 -->|blocks| T3\n  T3 -->|blocks| T1\n");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("cyclic"));
});

test("rejects a plan with no run graph section", () => {
	const start = validPlan.indexOf("## Run graph");
	const end = validPlan.indexOf("## PR 1");
	const result = runPlanText(validPlan.slice(0, start) + validPlan.slice(end), 1);
	assert.ok(result.stderr.includes("no \"## Run graph\" section"));
});

test("rejects a run graph with no wave subgraph", () => {
	const plan = validPlan.replace("subgraph W1[Wave 1]", "subgraph Group[All]").replace("subgraph W2[Wave 2]", "subgraph Group2[All]");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("wave subgraph"));
});
