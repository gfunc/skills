import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(here, "..", "scripts", "check-plan.mjs");
const fixture = fs.readFileSync(path.join(here, "..", "tests", "fixtures", "valid-plan.md"), "utf8");
const DECOYS = 7;

const run = (text) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plan-check-"));
	const file = path.join(dir, "plan.md");
	fs.writeFileSync(file, text);
	try {
		const stdout = execFileSync(process.execPath, [checker, file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
		return { status: 0, stdout, stderr: "" };
	} catch (error) {
		return { status: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
	}
};

// One mutation per rule the shape states. Each must fail, and the message must
// name the rule that the mutation broke.
const mutations = [
	["retired program checklist", (t) => t.replace("## Run graph", "## Program checklist\n\n### Arm the program\n\n- [ ] x\n\n## Run graph"), /retired heading/],
	["missing Files block", (t) => t.replace("**Files.**", "**Plans.**"), /sub-blocks are/],
	["reordered blocks", (t) => t.replace("**Build.**", "**Build placeholder.**").replace("**You see.**", "**Build.**").replace("**Build placeholder.**", "**You see.**"), /sub-blocks are/],
	["missing readiness field", (t) => t.replace(/\| Owner \|[^\n]*\n/, ""), /lacks table field "Owner"/],
	["bad decision enum", (t) => t.replace("`create-before-amendment`", "`create-eventually`"), /unknown Decision/],
	["no unit node", (t) => t.replace(/  U1\[[^\]]+\]\n/, ""), /Run graph has no unit node/],
	["wave subgraph", (t) => t.replace("graph TD", "graph TD\n  subgraph W1[Wave 1]"), /wave subgraphs are retired/],
	["no pr node", (t) => t.replace(/  P1\[[^\]]+\]\n/, ""), /exactly one pr node/],
	["bad unit id", (t) => t.replace("unit: U1 ", "unit: u1 "), /unit id/],
	["no critical path", (t) => t.replace(/\*\*Critical path\.\*\*[^\n]*\n/, ""), /Critical path/],
	["files path outside lanes", (t) => t.replace("- [ ] Create `skills/start-dev/references/plan-shape.mjs`.", "- [ ] Create `skills/start-dev/references/plan-shape.mjs`.\n- [ ] Create `docs/outside.md`."), /falls inside no unit file lane/],
	["lane table without rows", (t) => t.replace(/\| U1 \|[^\n]*\n/, ""), /lane table has no unit rows/],
	["duplicate lane id", (t) => t.replace(/(\| U1 \|[^\n]*\n)/, "$1$1"), /repeats unit/],
	["bad lane id", (t) => t.replace("| U1 | fixture |", "| u1 | fixture |"), /invalid Unit/],
	["no Live-only", (t) => t.replace("`Live-only: a real emit renders a real file.`", ""), /no Live-only/],
	["no pass predicate", (t) => t.replace("Pass when the exit is 0.", ""), /no pass predicate/],
	["no feature entry", (t) => t.replace("`fixture#emit`", "`fixture`"), /names no backticked feature entry/],
	["no lane artifact", (t) => t.replace("Log `.scratch/check-fixture/lane-1.txt`.", ""), /names no transcript/],
	["lane 1 without trunk", (t) => t.replace("on trunk and head", "in one place"), /lane 1 must run/],
	["non-contiguous lanes", (t) => t.replace("Lane 1.", "Lane 2."), /contiguous numbering/],
	["missing formal item", (t) => t.replace("- [ ] Command. `node --test fixture`.", ""), /lacks "Command."/],
	["formal Run without predicate", (t) => t.replace("Pass when every mutant is reported.", ""), /pass predicate/],
	["perf order", (t) => t.replace("- [ ] Metric. Checker wall time.\n- [ ] Probe. Run the checker at trunk and head.", "- [ ] Probe. Run the checker at trunk and head.\n- [ ] Metric. Checker wall time."), /perf boxes are/],
	["review without operator", (t) => t.replace("**Review gate.** The operator reviews before merge.", "**Review gate.** The review happens before merge.").replace(" and the operator", ""), /names no operator/],
	["review without reviewer", (t) => t.replace("The independent reviewer", "The independent check"), /names no reviewer/],
	["map box on internal", (t) => t.replace("- [ ] Write the fixture change.", "- [ ] Write the fixture change.\n- [ ] Map update `features/README.md`."), /must not carry a map update box/],
	["no merge box", (t) => t.replace("- [ ] Squash-merge on a clean verdict and green CI on the merge result.", ""), /Merge has no box/],
	["no close box", (t) => t.replace("- [ ] Every unit in the lane table is merged with its scoped tests green.", ""), /Close the run has no box/],
	["no appendix", (t) => t.replace(/\n## Appendix A\. Prototype evidence\n\nThe fixture itself\.\n$/, ""), /first appendix|section after Close|must be followed by/],
	["long intro", (t) => t.replace("A fixture used to prove the checker and the emitter.", Array.from({ length: 11 }, (_, i) => `Line ${i + 1}.`).join("\n")), /intro is/],
	["missing how-to-read marker", (t) => t.replace("One box is one unit of work. ", ""), /How to read this lacks/],
	["no H1", (t) => t.replace("# Fixture plan\n", ""), /no H1 title/],
	["no readiness section", (t) => t.replace("## Verification readiness", "## Readiness"), /no "## Verification readiness"/],
	["no run graph", (t) => t.replace("## Run graph", "## Graph"), /no "## Run graph"/],
	["no close section", (t) => t.replace("## Close the run", "## Finish"), /no "## Close the run"/],
	["long dash", (t) => t.replace("The fixture itself.", "The fixture — itself."), /long dash/],
	["curly quote", (t) => t.replace("The fixture itself.", "The fixture’s self."), /curly quote/],
	["mid-sentence colon", (t) => t.replace("The fixture itself.", "Note: the fixture."), /mid-sentence colon/],
	["bad files box", (t) => t.replace("- [ ] Create `skills/start-dev/references/plan-shape.mjs`.", "- [ ] Create the shape module."), /Files box is not/],
];

test("the fixture validates", () => {
	const result = run(fixture);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /1 PR sections, 0 problems/);
});

test("every rule has a mutation, each with harmless decoys, at least 200 in total", () => {
	assert.ok(mutations.length * DECOYS >= 200, `only ${mutations.length * DECOYS} mutants`);
	for (const [name, mutate, expected] of mutations) {
		for (let decoy = 0; decoy < DECOYS; decoy++) {
			const text = `${mutate(fixture)}\n<!-- decoy ${decoy} -->\n`;
			const result = run(text);
			assert.equal(result.status, 1, `${name} (decoy ${decoy}) did not fail`);
			assert.match(result.stderr, expected, `${name} (decoy ${decoy}) reported the wrong rule: ${result.stderr}`);
		}
	}
});

test("a missing argument exits 2", () => {
	try {
		execFileSync(process.execPath, [checker], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
		assert.fail("checker accepted no argument");
	} catch (error) {
		assert.equal(error.status, 2);
	}
});
