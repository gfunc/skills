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
	(_, i) => `- [ ] Lane ${i + 1}. ${i === 0 ? "Regression lane against trunk and head for the load-bearing journey " : ""}\`checkout#journey-${i + 1}\`. Save \`lane-${i + 1}.png\`. Pass when evidence exists.`,
).join("\n");
const mapUpdateBox = (id: number) => `- [ ] Map update. Update \`features/checkout.md\` for PR ${id}.`;
const formalBlock = (id: number) => `**Verify, formal.**
- [ ] Command. Run \`npm run check:formal\`.
- [ ] Property. Concurrent checkouts preserve inventory.
- [ ] Covered. \`src/${id === 1 ? "one" : "two"}/**\` and \`checkout()\`.
- [ ] Run. Save \`formal-${id}.log\`. Pass when the check exits 0.`;
const prSection = (id: number) => `## PR ${id}
**Depends on.** ${id === 1 ? "None." : "PR 1."}
Change: ${id === 1 ? "user-facing" : "internal"}
**Files.**
- [ ] Edit \`src/${id === 1 ? "one" : "two"}/thing.ts\`.
**Build.**
- [ ] Do the thing.
${id === 1 ? `${mapUpdateBox(id)}\n` : ""}**You see.**
- [ ] Do the thing.
**Verify, unit.** ${rule}
- [ ] Check the thing.
**Verify, live.** ${rule} Ten lanes on \`example-model\` at the PR head
${laneBlock}
${formalBlock(id)}
**Verify, perf.** ${rule}
- [ ] Metric. Recorded.
- [ ] Probe. Recorded.
- [ ] Baseline. Recorded.
- [ ] Rule. Recorded.
**Review gate.** None.
**Merge.**
- [ ] Merge when approved.
`;

const validPlan = `# Demo

## How to read this
One box is one unit of work and names the evidence. Check a box only when its evidence exists. See playbooks/.
${rule}

## Verification readiness
| Field | Value |
|---|---|
| Decision | \`exists\` |
| Surface | \`ui\` |
| Drivability | \`drivable\` |
| Boundary | \`none\` |
| Evidence | \`npm run dev\` ready on port 3000 with the checkout journey at 2026-10-27 |
| Skill | \`.agents/skills/verify-demo/SKILL.md\` |
| Map | \`.agents/skills/verify-demo/features/\` |
| Formal | \`create\` |
| Formal property | Concurrent checkouts preserve inventory |
| Maintenance route | \`none\` |
| Owner | \`main-agent\` |

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
    C1[task: create-verification-skill PR 1 lane .agents/skills/verify-demo/**]
    P1[pr: PR 1 lane src/one/**]
  end
  subgraph W2[Wave 2]
    T3[task: c lane src/one/**]
    P2[pr: PR 2 lane src/two/**]
  end
  T1 -->|blocks| T3
  C1 -->|folds into| P1
  P1 -->|verification| VG[gate: verification]
  VG -->|blocks| P2
  P1 -->|formal| FM[gate: formal]
  FM -->|blocks| P2
  W1 -->|wave gate| W2
  W2 -->|feature gate| FG[gate: feature]
  FG -->|review| RL[gate: review]
\`\`\`
**Critical path.** W1 then W2 then the review gate.

${prSection(1)}
${prSection(2)}
## Close the program
- [ ] The verification skill exists and the prove-once transcript is recorded.
- [ ] Every map update is merged.

## Appendix Prototype evidence
Recorded.
`;

const runPlanText = (text: string, expectedExit: number, env: Record<string, string> = {}) => {
	const directory = mkdtempSync(join(tmpdir(), "check-plan-test-"));
	const file = join(directory, "plan.md");
	writeFileSync(file, text);
	mkdirSync(join(directory, ".agents", "skills", "verify-demo", "features"), { recursive: true });
	writeFileSync(join(directory, ".agents", "skills", "verify-demo", "SKILL.md"), "# verify-demo\n");
	writeFileSync(join(directory, ".agents", "skills", "verify-demo", "features", "checkout.md"), "# checkout\n");
	try {
		const result = spawnSync("node", [checker, file], {
			cwd: directory,
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
		.replace(laneBlock, laneBlock.replaceAll("Save `", "Log `"));
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
	const uiPlan = validPlan.replace(laneBlock.split("\n")[0], "- [ ] Check the thing.");
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

test("accepts the verification readiness positive fixture and creation placements", () => {
	const existing = runPlanText(validPlan, 0);
	assert.match(existing.stdout, /2 PR sections, 0 problems/);

	const before = validPlan.replace("| Decision | `exists` |", "| Decision | `create-before-amendment` |");
	const amendment = runPlanText(before, 0);
	assert.match(amendment.stdout, /2 PR sections, 0 problems/);

	const after = validPlan
		.replace("| Decision | `exists` |", "| Decision | `create-after-first-drivable-batch` |")
		.replace("    C1[task: create-verification-skill PR 1 lane .agents/skills/verify-demo/**]\n", "")
		.replace(
			"    P2[pr: PR 2 lane src/two/**]\n",
			"    C1[task: create-verification-skill PR 2 lane .agents/skills/verify-demo/**]\n    P2[pr: PR 2 lane src/two/**]\n",
		)
		.replace("  C1 -->|folds into| P1\n", "  C1 -->|folds into| P2\n");
	const batch = runPlanText(after, 0);
	assert.match(batch.stdout, /2 PR sections, 0 problems/);
});

test("rejects a missing verification readiness section", () => {
	const start = validPlan.indexOf("## Verification readiness");
	const end = validPlan.indexOf("## Program checklist");
	const result = runPlanText(validPlan.slice(0, start) + validPlan.slice(end), 1);
	assert.ok(result.stderr.includes('no "## Verification readiness" section'));
});

test("rejects an invalid readiness decision token", () => {
	const plan = validPlan.replace("| Decision | `exists` |", "| Decision | `recreate` |");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('unknown Verification readiness Decision "recreate"'));
});

test("rejects exists without resolving skill and map paths", () => {
	const plan = validPlan
		.replace("| Skill | `.agents/skills/verify-demo/SKILL.md` |", "| Skill | `.agents/skills/missing/SKILL.md` |")
		.replace("| Map | `.agents/skills/verify-demo/features/` |", "| Map | `.agents/skills/missing/features/` |");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("Verification readiness Skill path does not resolve"));
	assert.ok(result.stderr.includes("Verification readiness Map path does not resolve"));
});

test("rejects exists-stale without a maintenance route", () => {
	const plan = validPlan.replace("| Decision | `exists` |", "| Decision | `exists-stale` |");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("exists-stale requires a maintenance route"));
});

test("rejects create decisions without a folded creation task", () => {
	for (const decision of ["create-before-amendment", "create-after-first-drivable-batch"]) {
		const plan = validPlan
			.replace("| Decision | `exists` |", `| Decision | \`${decision}\` |`)
			.replace("    C1[task: create-verification-skill PR 1 lane .agents/skills/verify-demo/**]\n", "")
			.replace("  C1 -->|folds into| P1\n", "");
		const result = runPlanText(plan, 1);
		assert.ok(result.stderr.includes("requires a folded create-verification-skill task"));
	}
});

test("rejects create-before-amendment without a verification gate", () => {
	const plan = validPlan
		.replace("| Decision | `exists` |", "| Decision | `create-before-amendment` |")
		.replace("  P1 -->|verification| VG[gate: verification]\n", "")
		.replace("  VG -->|blocks| P2\n", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('Run graph lacks the verification gate node "[gate: verification]"'));
});

test("rejects not-required on a ui surface", () => {
	const plan = validPlan.replace("| Decision | `exists` |", "| Decision | `not-required` |");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("Verification readiness not-required is only allowed for library/backend surfaces"));
});

test("rejects Formal create without a formal gate", () => {
	const plan = validPlan
		.replace("  P1 -->|formal| FM[gate: formal]\n", "")
		.replace("  FM -->|blocks| P2\n", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('Run graph lacks the formal gate node "[gate: formal]"'));
});

test("rejects a missing Verify formal block when formal exists or creates", () => {
	for (const decision of ["create", "exists"]) {
		const plan = validPlan
			.replace("| Formal | `create` |", `| Formal | \`${decision}\` |`)
			.replace(formalBlock(1), "");
		const result = runPlanText(plan, 1);
		assert.ok(result.stderr.includes(`PR 1: Formal ${decision} requires a Verify, formal block`));
	}
});

test("rejects a live lane without a feature-entry token", () => {
	const plan = validPlan.replace("`checkout#journey-1`", "the checkout journey");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("PR 1: lane 1 names no backticked <feature-id>#<sub-id> feature entry"));
});

test("rejects lane 1 without the regression marker", () => {
	const plan = validPlan.replace("Regression lane against trunk and head", "Journey on trunk and head");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("PR 1: lane 1 does not name the regression journey on trunk and head"));
});

test("rejects map-update boxes that do not match the Change line", () => {
	const missing = runPlanText(validPlan.replace(mapUpdateBox(1), ""), 1);
	assert.ok(missing.stderr.includes("PR 1: Change user-facing requires a map-update box"));

	const internal = runPlanText(validPlan.replace("Change: user-facing", "Change: internal"), 1);
	assert.ok(internal.stderr.includes("PR 1: Change internal must not carry a map-update box"));
});

test("rejects Formal not-required with a non-none design signal", () => {
	const plan = validPlan
		.replace("| Formal | `create` |", "| Formal | `not-required` |")
		.replace("| Formal property | Concurrent checkouts preserve inventory |", "| Formal property | `parser/serializer` |");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('Formal not-required requires Formal property "none"'));
});

test("rejects a creation task with no lane", () => {
	const plan = validPlan
		.replace("| Decision | `exists` |", "| Decision | `create-before-amendment` |")
		.replace(
			"C1[task: create-verification-skill PR 1 lane .agents/skills/verify-demo/**]",
			"C1[task: create-verification-skill PR 1]",
		);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("create-verification-skill task has no file lane"));
});

test("rejects a verification gate without an edge into a later ui PR", () => {
	const plan = validPlan
		.replace("| Decision | `exists` |", "| Decision | `create-before-amendment` |")
		.replace("  VG -->|blocks| P2\n", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("verification gate has no edge into later ui/cli PR 2"));
});

test("rejects a creation task folded into a PR other than the carrier", () => {
	const plan = validPlan
		.replace("| Decision | `exists` |", "| Decision | `create-before-amendment` |")
		.replace("  C1 -->|folds into| P1\n", "  C1 -->|folds into| P2\n");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("create-verification-skill task does not fold into carrier PR 1"));
	assert.ok(!result.stderr.includes("requires a folded create-verification-skill task in"));
});

test("rejects a creation task sitting outside the carrier's wave", () => {
	const plan = validPlan
		.replace("| Decision | `exists` |", "| Decision | `create-before-amendment` |")
		.replace("    C1[task: create-verification-skill PR 1 lane .agents/skills/verify-demo/**]\n", "")
		.replace(
			"    T3[task: c lane src/one/**]\n",
			"    T3[task: c lane src/one/**]\n    C1[task: create-verification-skill PR 1 lane .agents/skills/verify-demo/**]\n",
		);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("create-verification-skill task must sit in carrier PR 1's wave"));
});

test("rejects bare formal labels with no content", () => {
	const bare = `**Verify, formal.**
- [ ] Command.
- [ ] Property.
- [ ] Covered.
- [ ] Run.`;
	const plan = validPlan.replace(formalBlock(1), bare);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('PR 1: Verify, formal "Command." box is empty'));
	assert.ok(result.stderr.includes('PR 1: Verify, formal "Property." box is empty'));
	assert.ok(result.stderr.includes('PR 1: Verify, formal "Covered." box is empty'));
	assert.ok(result.stderr.includes('PR 1: Verify, formal "Run." box is empty'));
});

test("rejects a formal Run box with no evidence path or pass predicate", () => {
	const plan = validPlan.replace(
		"- [ ] Run. Save `formal-1.log`. Pass when the check exits 0.",
		"- [ ] Run. Execute the formal check and record the outcome.",
	);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('PR 1: Verify, formal "Run." box names no evidence path'));
	assert.ok(result.stderr.includes('PR 1: Verify, formal "Run." box names no pass predicate'));
});

test("rejects a readiness table without a Maintenance route row", () => {
	const plan = validPlan.replace("| Maintenance route | `none` |\n", "");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('Verification readiness lacks table field "Maintenance route"'));
});

test("rejects a Drivability value outside the three states", () => {
	const plan = validPlan.replace("| Drivability | `drivable` |", "| Drivability | `banana` |");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes('unknown Verification readiness Drivability "banana"'));
});

test("rejects Evidence that names no command, ready signal, journey, or timestamp", () => {
	const plan = validPlan.replace(
		"| Evidence | `npm run dev` ready on port 3000 with the checkout journey at 2026-10-27 |",
		"| Evidence | none |",
	);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("Evidence must name the launch or e2e command in backticks"));
	assert.ok(result.stderr.includes("Evidence must name the ready signal"));
	assert.ok(result.stderr.includes("Evidence must name one driven journey"));
	assert.ok(result.stderr.includes("Evidence must carry the timestamp"));
});

test("rejects an unrelated box in place of a map-update box", () => {
	const plan = validPlan.replace(
		mapUpdateBox(1),
		"- [ ] Assert that no feature entry update is required.",
	);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("PR 1: Change user-facing requires a map-update box"));
});

test("rejects a bare map-update label with no features path", () => {
	const plan = validPlan.replace(mapUpdateBox(1), "- [ ] Map update.");
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("map-update box names no backticked features/ entry path"));
});

test("rejects a negated map-update box", () => {
	const plan = validPlan.replace(
		mapUpdateBox(1),
		"- [ ] Map update. Assert that no feature entry update is required for PR 1.",
	);
	const result = runPlanText(plan, 1);
	assert.ok(result.stderr.includes("map-update box is negated"));
});
