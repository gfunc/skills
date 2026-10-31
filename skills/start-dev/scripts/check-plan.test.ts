import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const scripts = path.join(here, "..", "scripts");
const checker = path.join(scripts, "check-plan.mjs");
const emitter = path.join(scripts, "emit-plan");
const fixturePath = path.join(here, "..", "tests", "fixtures", "valid-plan.md");
const fixture = fs.readFileSync(fixturePath, "utf8");

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "plan-cli-"));
const write = (dir, name, text) => {
	const file = path.join(dir, name);
	fs.writeFileSync(file, text);
	return file;
};
const run = (file, bound = "120") => {
	try {
		return { status: 0, stdout: execFileSync(process.execPath, [checker, "--spawn-bound", bound, file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
	} catch (error) {
		return { status: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
	}
};

test("a conforming plan exits 0", () => {
	const dir = temp();
	const result = run(write(dir, "plan.md", fixture));
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /1 PR sections, 0 problems, spawn bound 120 minutes/);
});

test("a placeholder continuation line fails and a copied one passes", () => {
	const dir = temp();
	assert.equal(run(write(dir, "copied.md", fixture)).status, 0);
	const placeholder = fixture.replace(
		"Continuation: /goal is native.",
		"Continuation: <copied from the active profile's Role mapping Continuation line.>",
	);
	const result = run(write(dir, "placeholder.md", placeholder));
	assert.equal(result.status, 1);
	assert.match(result.stderr, /Continuation line is still the placeholder/);
	const missing = fixture.replace("Continuation: /goal is native.\n\n", "");
	const dropped = run(write(dir, "dropped.md", missing));
	assert.equal(dropped.status, 1);
	assert.match(dropped.stderr, /How to read this lacks "Continuation: "/);
});


test("a plan with a retired heading exits 1 and names it", () => {
	const dir = temp();
	const text = fixture.replace("## Run graph", "## Program checklist\n\n### Arm the program\n\n- [ ] x\n\n## Run graph");
	const result = run(write(dir, "plan.md", text));
	assert.equal(result.status, 1);
	assert.match(result.stderr, /retired heading "Program checklist"/);
});

test("a plan with a wave subgraph exits 1 and names the rule", () => {
	const dir = temp();
	const result = run(write(dir, "plan.md", fixture.replace("graph TD", "graph TD\n  subgraph W1[Wave 1]")));
	assert.equal(result.status, 1);
	assert.match(result.stderr, /wave subgraphs are retired/);
});

test("the emitter renders the shell from the shape", () => {
	const dir = temp();
	const out = path.join(dir, "emitted.md");
	execFileSync(process.execPath, [emitter, "--feature", "fixture", "--title", "Fixture", "--surface", "cli", "--pr", "P1", "--out", out], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	const text = fs.readFileSync(out, "utf8");
	for (const marker of [
		"## How to read this",
		"### Standing orders",
		"## Verification readiness",
		"## Run graph",
		"(P1)",
		"**Build.**",
		"| Unit | Deliverable | File lane | Worktree | Scoped tests | Budget | Depends on |",
		"**Verify, live.**",
		"**Review gate.**",
		"## Close the run",
		"## Appendix A. Prototype evidence",
	])
		assert.ok(text.includes(marker), `emitted shell lacks ${marker}`);
	// Round trip: the checker parses the emitted shell and reports the missing
	// authored content, with no crash and no unknown-section error.
	const emittedCheck = run(out);
	assert.equal(emittedCheck.status, 1);
	assert.match(emittedCheck.stderr, /unknown Decision|unit id "<id>"/);
	assert.doesNotMatch(emittedCheck.stderr, /unknown section|missing YAML/);
});

test("the emitter refuses an occupied path without --force", () => {
	const dir = temp();
	const out = path.join(dir, "emitted.md");
	fs.writeFileSync(out, "occupied");
	assert.throws(() =>
		execFileSync(process.execPath, [emitter, "--feature", "fixture", "--title", "Fixture", "--surface", "cli", "--pr", "P1", "--out", out], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}),
	);
});

test("a unit and a lane at the bound pass, and one minute over fails", () => {
	const dir = temp();
	const atBound = fixture.replace("| node --test fixture | 5 |", "| node --test fixture | 120 |").replace("`Timeout 2`", "`Timeout 120`");
	assert.equal(run(write(dir, "at.md", atBound)).status, 0);
	const overUnit = fixture.replace("| node --test fixture | 5 |", "| node --test fixture | 121 |");
	const unitResult = run(write(dir, "unit.md", overUnit));
	assert.equal(unitResult.status, 1);
	assert.match(unitResult.stderr, /unit "U1" budget 121 minutes exceeds the spawn bound of 120/);
	const overLane = fixture.replace("`Timeout 2`", "`Timeout 121`");
	const laneResult = run(write(dir, "lane.md", overLane));
	assert.equal(laneResult.status, 1);
	assert.match(laneResult.stderr, /lane 1 timeout 121 minutes exceeds the spawn bound of 120/);
});

test("a missing or unrecognized spawn bound exits 2", () => {
	const dir = temp();
	const file = write(dir, "plan.md", fixture);
	for (const args of [[checker, file], [checker, "--spawn-bound", "zero", file], [checker, "--harness", "kimi", file]]) {
		assert.throws(
			() => execFileSync(process.execPath, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
			(error) => error.status === 2,
		);
	}
});

test("an unlimited bound accepts a large budget", () => {
	const dir = temp();
	const text = fixture.replace("| node --test fixture | 5 |", "| node --test fixture | 999 |");
	const result = run(write(dir, "plan.md", text), "unlimited");
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /spawn bound unlimited/);
});

test("a missing argument exits 2", () => {
	assert.throws(
		() => execFileSync(process.execPath, [checker], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
		(error) => error.status === 2,
	);
});
