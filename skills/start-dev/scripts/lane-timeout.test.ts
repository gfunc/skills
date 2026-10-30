import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const wrapper = path.join(path.dirname(fileURLToPath(import.meta.url)), "lane-timeout");

const run = (args: string[]) =>
	spawnSync(process.execPath, [wrapper, ...args], { encoding: "utf8" });

test("the wrapper returns the command's exit code", () => {
	const result = run(["--timeout", "5", "--", process.execPath, "-e", "process.exit(3)"]);
	assert.equal(result.status, 3);
});

test("the wrapper kills the process tree at the deadline", () => {
	const child = spawn(process.execPath, [
		wrapper, "--timeout", "1", "--",
		process.execPath, "-e", "setInterval(() => {}, 1000)",
	]);
	const started = Date.now();
	const exit = new Promise<number>((resolve) => child.on("exit", (code) => resolve(code ?? -1)));
	return exit.then((code) => {
		assert.equal(code, 124);
		assert.ok(Date.now() - started < 5000, "deadline did not fire");
		const alive = spawnSync("ps", ["-o", "pid=", "-p", String(child.pid)], { encoding: "utf8" });
		assert.equal(alive.stdout.trim(), "");
	});
});

test("a missing timeout exits 2", () => {
	const result = run(["--", process.execPath, "-e", "process.exit(0)"]);
	assert.equal(result.status, 2);
});
