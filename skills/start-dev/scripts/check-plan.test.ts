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
const run = (file) => {
	try {
		return { status: 0, stdout: execFileSync(process.execPath, [checker, file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
	} catch (error) {
		return { status: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
	}
};

test("a conforming plan exits 0", () => {
	const dir = temp();
	const result = run(write(dir, "plan.md", fixture));
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /1 PR sections, 0 problems/);
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
		"| Unit | Deliverable | File lane | Worktree | Scoped tests | Depends on |",
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

test("a missing argument exits 2", () => {
	assert.throws(
		() => execFileSync(process.execPath, [checker], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
		(error) => error.status === 2,
	);
});
