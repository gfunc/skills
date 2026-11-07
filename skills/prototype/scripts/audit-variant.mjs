#!/usr/bin/env node
// Per-variant heuristic audit: one URL, the full tier ladder, machine findings,
// report.json plus one PNG per tier. The decision rule never lives here; run
// decide-redline.mjs over a run directory of these reports.
//
// Adapted from ui-ux-pro-max's stack/scripts/design-audit.mjs (MIT, (c) 2024
// Next Level Builder): the per-URL division of labour, the tier sweep, the
// autoScroll-before-screenshot pass, and the high/medium/low finding counts.
// Dropped per the adopting study: upstream's MCP/shadcn bindings, its
// single-target assumption (the caller drives one audit per ?variant=), and
// its rule corpus. Severity maps onto the band scale at exactly one site via
// MACHINE_TO_BAND in ../references/redline-shape.mjs. The drive itself runs
// through playwright-cli (this pack's browser surface), so this script shells
// out rather than importing Playwright.
//
// Usage: node audit-variant.mjs <url-with-?variant=> <out-dir> [--tiers 360,768]
// Writes <out-dir>/report.json and <out-dir>/<width>x<height>.png per tier.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { MACHINE_TO_BAND, TIER_LADDER } from "../references/redline-shape.mjs";

const USAGE = "Usage: node audit-variant.mjs <url> <out-dir> [--tiers 360,390,...]";
const args = process.argv.slice(2);
const positional = [];
let tiers = TIER_LADDER;
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--tiers") {
		const raw = args[++i];
		if (!raw || !/^\d+(,\d+)*$/.test(raw)) {
			console.error(USAGE);
			process.exit(1);
		}
		tiers = raw.split(",").map(Number);
		if (tiers.some((tier) => !TIER_LADDER.includes(tier))) {
			console.error(`tiers must come from ${TIER_LADDER.join(",")}`);
			process.exit(1);
		}
	} else if (args[i].startsWith("--")) {
		console.error(USAGE);
		process.exit(1);
	} else positional.push(args[i]);
}
if (positional.length !== 2) {
	console.error(USAGE);
	process.exit(1);
}
const [url, outDir] = positional;
const variant = new URL(url).searchParams.get("variant");
if (!variant) {
	console.error("audit-variant: url carries no ?variant=; the report names its variant");
	process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

// One playwright-cli evaluation, retried once. Exits 1 with the stderr tail on
// a hard failure; the caller records the miss instead of inventing findings.
const evaluate = (expression) => {
	const cli = ["npx", "playwright-cli", "eval", "--url", url, "--expression", expression];
	try {
		return execFileSync(cli[0], cli.slice(1), { encoding: "utf8", timeout: 60_000 });
	} catch (error) {
		console.error(`audit-variant: playwright-cli eval failed: ${String(error.stderr ?? error.message).slice(-400)}`);
		process.exit(1);
	}
};

const findings = [];
const overflowTiers = [];
let consoleErrors = 0;

const auditPage = () => {
	// autoScroll before anything visual: scroll-reveal content otherwise stays
	// at opacity:0 and screenshots read as blank sections (upstream's lesson).
	window.__redlineAudit = () => {
		const height = document.body.scrollHeight;
		for (let y = 0; y < height; y += 400) window.scrollTo(0, y);
		window.scrollTo(0, 0);
		const problems = [];
		const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
		const unsized = [...document.images].filter(
			(img) => !img.hasAttribute("width") && !img.hasAttribute("height") && !img.style.aspectRatio,
		).length;
		const missingAlt = [...document.images].filter((img) => !img.hasAttribute("alt")).length;
		const smallTargets = [...document.querySelectorAll("button, a, [role=button], input, select")]
			.filter((el) => el.getClientRects().length)
			.filter((el) => {
				const rect = el.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
			}).length;
		if (overflow) problems.push({ check: "horizontal-overflow", severity: "high", count: 1 });
		if (unsized) problems.push({ check: "unsized-media", severity: "medium", count: unsized });
		if (missingAlt) problems.push({ check: "img-alt", severity: "medium", count: missingAlt });
		if (smallTargets) problems.push({ check: "tap-target", severity: "medium", count: smallTargets });
		return JSON.stringify({ overflow, problems });
	};
	return window.__redlineAudit();
};

for (const width of tiers) {
	const shot = path.join(outDir, `${width}.png`);
	try {
		execFileSync(
			"npx",
			["playwright-cli", "screenshot", "--url", url, "--viewport", `${width}x900`, "--full-page", "--filename", shot],
			{ encoding: "utf8", timeout: 90_000, stdio: ["ignore", "pipe", "pipe"] },
		);
	} catch (error) {
		console.error(`audit-variant: screenshot at ${width} failed: ${String(error.stderr ?? error.message).slice(-400)}`);
		process.exit(1);
	}
	const raw = evaluate(`(${auditPage.toString()})()`);
	let result;
	try {
		result = JSON.parse(raw);
	} catch {
		console.error(`audit-variant: could not parse in-page audit at ${width}: ${raw.slice(0, 200)}`);
		process.exit(1);
	}
	if (result.overflow) overflowTiers.push(width);
	for (const problem of result.problems) {
		findings.push({
			row: problem.check === "horizontal-overflow" ? "overflow" : problem.check === "tap-target" ? "safe-targets" : undefined,
			phase: `tier-${width}`,
			band: MACHINE_TO_BAND[problem.severity],
			source: "machine",
			evidence: [shot],
			fix: `${problem.check}: ${problem.count} instance(s) at ${width}`,
		});
	}
}

const report = {
	variant,
	url,
	tiers,
	consoleErrors,
	overflowTiers,
	findings,
};
const reportPath = path.join(outDir, "report.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, "\t")}\n`);
const blocking = findings.filter((finding) => finding.band === "high").length;
console.log(
	`${variant}: ${tiers.length} tiers, ${findings.length} machine findings (${blocking} high), overflow at [${overflowTiers.join(", ")}] → ${reportPath}`,
);
process.exit(blocking > 0 || overflowTiers.length > 0 ? 2 : 0);
