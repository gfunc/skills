#!/usr/bin/env node
// Thin walker over the one rule statement in ../references/redline-shape.mjs.
// The shape owns every rule; this file resolves report files, applies pick
// rules, prints one line, and writes winner.json. Exit codes: 0 a winner, 2 no
// eligible variant or invalid pick, 3 schema-invalid input, 1 usage/IO.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseReport, decide } from "../references/redline-shape.mjs";

const USAGE =
	"Usage: node decide-redline.mjs <run-dir-or-report-paths...> [--pick pick.json]";

const args = process.argv.slice(2);
const paths = [];
let pickPath = null;
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--pick") {
		pickPath = args[++i];
		if (!pickPath) {
			console.error(USAGE);
			process.exit(1);
		}
	} else if (args[i].startsWith("--")) {
		console.error(USAGE);
		process.exit(1);
	} else paths.push(args[i]);
}
if (!paths.length) {
	console.error(USAGE);
	process.exit(1);
}

const reportPaths = [];
for (const entry of paths) {
	let stat = null;
	try {
		stat = fs.statSync(entry);
	} catch {
		console.error(`decide-redline: cannot read ${entry}`);
		process.exit(1);
	}
	if (stat.isDirectory()) {
		// A run directory holds one report.json per variant subdirectory
		// (`<run-dir>/<variant>/report.json`); bare report*.json at its root
		// still count.
		const direct = fs
			.readdirSync(entry)
			.filter((name) => /^report(-.*)?\.json$/.test(name))
			.map((name) => path.join(entry, name));
		const nested = [];
		for (const name of fs.readdirSync(entry, { withFileTypes: true })) {
			if (!name.isDirectory()) continue;
			const nestedReport = path.join(entry, name.name, "report.json");
			if (fs.existsSync(nestedReport)) nested.push(nestedReport);
		}
		if (!direct.length && !nested.length) {
			console.error(`decide-redline: directory ${entry} holds no report*.json or <variant>/report.json`);
			process.exit(1);
		}
		reportPaths.push(...direct, ...nested);
	} else reportPaths.push(entry);
}
reportPaths.sort();

const reports = [];
for (const file of reportPaths) {
	let text;
	try {
		text = fs.readFileSync(file, "utf8");
	} catch (error) {
		console.error(`decide-redline: cannot read ${file}: ${error.message}`);
		process.exit(1);
	}
	const result = parseReport(text, file);
	if (result.error) {
		console.error(result.error);
		process.exit(3);
	}
	reports.push(result);
}
const variants = reports.map((report) => report.variant);
if (new Set(variants).size !== variants.length) {
	console.error(`decide-redline: duplicate variant(s) among ${variants.join(", ")}`);
	process.exit(3);
}

let pick;
if (pickPath) {
	let text;
	try {
		text = fs.readFileSync(pickPath, "utf8");
	} catch (error) {
		console.error(`decide-redline: cannot read pick ${pickPath}: ${error.message}`);
		process.exit(1);
	}
	try {
		pick = JSON.parse(text);
	} catch {
		console.error(`${pickPath}: not valid JSON`);
		process.exit(3);
	}
}

let decision;
try {
	decision = decide(reports, pick);
} catch (error) {
	console.error(`decide-redline: ${error.message}`);
	process.exit(2);
}

// winner.json lands inside the run directory when the first positional is
// one; beside the reports otherwise (cwd for bare paths).
const targetDir = (() => {
	const first = paths[0];
	try {
		return fs.statSync(first).isDirectory() ? first : path.dirname(path.resolve(first));
	} catch {
		return process.cwd();
	}
})();
fs.writeFileSync(
	path.join(targetDir, "winner.json"),
	`${JSON.stringify(decision, null, "\t")}\n`,
);
const summary =
	decision.kind === "all-rejected"
		? `no eligible variant; rejected: ${decision.rejected.map((entry) => entry.variant).join(", ")}`
		: `${decision.winner} (${decision.kind})` +
			(decision.tiedAtTop.length > 1 ? ` tied at top: [${decision.tiedAtTop.join(", ")}]` : "") +
			(decision.rejected.length ? `; rejected: ${decision.rejected.map((entry) => entry.variant).join(", ")}` : "");
console.log(summary);
process.exit(decision.kind === "all-rejected" ? 2 : 0);
