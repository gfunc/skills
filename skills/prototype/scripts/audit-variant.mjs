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
// MACHINE_TO_BAND in ../references/redline-shape.mjs.
//
// Drives the pack's playwright-cli surface with session semantics: open the
// variant URL once, then per tier `resize <w> <h>`, scroll-eval, and
// `screenshot --filename`. `console error` taps the console when the surface
// reports it; a failed tap writes consoleErrors: null (unknown) and the
// review pass supplies the count — a null count leaves the variant
// ineligible, never silently clean.
//
// Usage: node audit-variant.mjs <url-with-?variant=> <out-dir> [--tiers 360,768]
// Writes <out-dir>/report.json and <out-dir>/<width>.png per tier.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
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

// One CLI call against the open session. `die` marks failures that leave the
// audit untrustworthy; a failed console tap is the one soft failure (null).
const cli = (words, { die = true, timeout = 90_000 } = {}) => {
	const run = spawnSync("npx", ["--no-install", "playwright-cli", ...words], {
		encoding: "utf8",
		timeout,
	});
	if (run.status !== 0 || run.error) {
		const tail = String(run.stderr ?? run.error?.message ?? "").slice(-400);
		if (die) {
			console.error(`audit-variant: playwright-cli ${words[0]} failed: ${tail}`);
			process.exit(1);
		}
		return { ok: false, output: String(run.stdout ?? "") };
	}
	return { ok: true, output: String(run.stdout ?? "") };
};

const openPage = () => cli(["open", url]);
const resize = (width) => cli(["resize", String(width), "900"]);
const shot = (file) => cli(["screenshot", `--filename=${file}`]);

// autoScroll before anything visual: scroll-reveal content otherwise stays
// at opacity:0 and screenshots read as blank sections (upstream's lesson).
// Scroll first, then audit, then let the caller screenshot.
const scrollAndAudit = () =>
	cli([
		"--raw",
		"eval",
		`(() => {
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
		})()`,
	]);

const findings = [];
const overflowTiers = [];

openPage();
for (const width of tiers) {
	resize(width);
	const audited = scrollAndAudit();
	let result;
	try {
		result = JSON.parse(audited.output.trim().split("\n").pop());
	} catch {
		console.error(`audit-variant: could not parse in-page audit at ${width}: ${audited.output.slice(0, 200)}`);
		process.exit(1);
	}
	shot(path.join(outDir, `${width}.png`));
	if (result.overflow) overflowTiers.push(width);
	for (const problem of result.problems) {
		findings.push({
			row: problem.check === "horizontal-overflow" ? "overflow" : problem.check === "tap-target" ? "safe-targets" : undefined,
			phase: `tier-${width}`,
			band: MACHINE_TO_BAND[problem.severity],
			source: "machine",
			evidence: [path.join(outDir, `${width}.png`)],
			fix: `${problem.check}: ${problem.count} instance(s) at ${width}`,
		});
	}
}
// Console tap on the live session (before close); null (unknown) on a soft
// failure, and the review pass supplies the count. Null never passes eligibility.
let consoleErrors = null;
const tapped = cli(["--raw", "console", "error"], { die: false, timeout: 30_000 });
if (tapped.ok) {
	const lines = tapped.output.split("\n").filter((line) => line.trim().length > 0);
	consoleErrors = lines.length;
}
cli(["close"], { die: false, timeout: 30_000 });

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
const consoleNote = consoleErrors === null ? "unknown" : `${consoleErrors} console errors`;
console.log(
	`${variant}: ${tiers.length} tiers, ${findings.length} machine findings (${blocking} high), ${consoleNote}, overflow at [${overflowTiers.join(", ")}] → ${reportPath}`,
);
process.exit(blocking > 0 || overflowTiers.length > 0 || (consoleErrors ?? 0) > 0 ? 2 : 0);
