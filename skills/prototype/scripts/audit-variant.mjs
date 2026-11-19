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
// Drives the pack's playwright-cli surface with session semantics: one owned
// named browser session per run (`-s=<random>`, isolated from any default
// session the operator may have open), opened once, then per tier
// `resize <w> <h>`, scroll-eval, and `screenshot --filename`. `console error`
// taps the console when the surface reports it; a failed tap writes
// consoleErrors: null (unknown) and the review pass supplies the count — a
// null count leaves the variant ineligible, never silently clean. The session
// closes on every exit path after it may have started; a close failure never
// masks the audit result. file:// URLs are trusted only when the caller opts
// in via PLAYWRIGHT_MCP_ALLOW_UNRESTRICTED_FILE_ACCESS=1 in its own
// environment; this script never sets it.
//
// Page-level content checks (filler copy, placeholder-image services,
// declared-token drift) run per tier through ./page-checks.mjs and dedup
// across the ladder on check + normalized identity, so repeated tiers never
// multiply a page finding. --design-context-tokens supplies the binding token
// file; absent, the report records an explicit tokenCheck skip.
//
// Usage: node audit-variant.mjs <url> <out-dir> [--tiers 360,768] [--design-context-tokens <path>]
// Writes <out-dir>/report.json and <out-dir>/<width>.png per tier. <out-dir>
// must not exist or must be empty; earlier reports never enter a new run.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { MACHINE_TO_BAND, TIER_LADDER } from "../references/redline-shape.mjs";
import { parseTokenSource, auditPageTier, pageProblemKey } from "./page-checks.mjs";

const USAGE =
	"Usage: node audit-variant.mjs <url> <out-dir> [--tiers 360,390,...] [--design-context-tokens <tokens.css>]";
const args = process.argv.slice(2);
const positional = [];
let tiers = TIER_LADDER;
let tokensPath = null;
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
		const repeated = tiers.find((tier, index) => tiers.indexOf(tier) !== index);
		if (repeated !== undefined) {
			console.error(`audit-variant: duplicate tier width ${repeated} in --tiers; tier widths must be unique`);
			process.exit(1);
		}
	} else if (args[i] === "--design-context-tokens") {
		tokensPath = args[++i];
		if (!tokensPath) {
			console.error(USAGE);
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
let parsedUrl;
try {
	parsedUrl = new URL(url);
} catch {
	console.error(`audit-variant: "${url}" is not a valid URL`);
	process.exit(1);
}
if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "file:") {
	console.error(`audit-variant: unsupported URL protocol ${parsedUrl.protocol}; use http(s) or file`);
	process.exit(1);
}
const variant = parsedUrl.searchParams.get("variant");
if (!variant) {
	console.error("audit-variant: url carries no ?variant=; the report names its variant");
	process.exit(1);
}
if (fs.existsSync(outDir)) {
	const existing = fs.readdirSync(outDir);
	if (existing.length > 0) {
		console.error(`audit-variant: output directory ${outDir} is not empty (${existing.length} entr${existing.length === 1 ? "y" : "ies"}); use a fresh directory so earlier reports cannot enter this run`);
		process.exit(1);
	}
} else {
	fs.mkdirSync(outDir, { recursive: true });
}

// A supplied but unreadable or invalid token source fails loud (exit 1) before
// any browser session starts; it never becomes a skip record.
let tokenSource = null;
if (tokensPath !== null) {
	let text;
	try {
		text = fs.readFileSync(tokensPath, "utf8");
	} catch (error) {
		console.error(`audit-variant: cannot read --design-context-tokens ${tokensPath}: ${error.message}`);
		process.exit(1);
	}
	try {
		tokenSource = parseTokenSource(text, tokensPath);
	} catch (error) {
		console.error(`audit-variant: ${error.message}`);
		process.exit(1);
	}
}

// One owned session per run. Every CLI call carries the session flag so no
// command can drift onto the operator's default session, and the cleanup path
// closes exactly this session.
const session = `redline-${randomUUID().slice(0, 8)}`;

// One CLI call against the owned session. `die` marks failures that leave the
// audit untrustworthy; a failed console tap is the one soft failure (null).
// The 1.59 alpha prints `### Error` sections even on process exit 0, so the
// marker is checked on every nominally successful call.
const cli = (words, { die = true, timeout = 90_000 } = {}) => {
	const run = spawnSync("npx", ["--no-install", "playwright-cli", `-s=${session}`, ...words], {
		encoding: "utf8",
		timeout,
		env: { ...process.env },
	});
	const output = String(run.stdout ?? "");
	const stderr = String(run.stderr ?? "");
	const errorSection = /^### Error\b[^\r\n]*(?:\r?\n([^\r\n]+))?/m;
	const reportedError = errorSection.exec(output) ?? errorSection.exec(stderr);
	if (run.status !== 0 || run.error || reportedError) {
		if (die) {
			const reason = reportedError?.[1]?.trim() || run.error?.message ||
				stderr.split(/\r?\n/).find((line) => line.trim() && !line.startsWith("npm notice")) ||
				(reportedError ? "no error details" : `exit ${run.status}`);
			console.error(`audit-variant: playwright-cli ${words[0]} failed: ${reason.slice(0, 400)}`);
			process.exit(1);
		}
		return { ok: false, output };
	}
	return { ok: true, output };
};

const openPage = () => {
	sessionOpen = true;
	return cli(["open", url]);
};
const resize = (width) => cli(["resize", String(width), "900"]);
const shot = (file) => cli(["screenshot", `--filename=${file}`]);

const resultLine = (output) => {
	const lines = output.split(/\r?\n/);
	const start = lines.indexOf("### Result");
	if (start === -1) return "";
	const line = lines.slice(start + 1).find((entry) => entry.trim())?.trim();
	return line && !line.startsWith("### ") ? line : "";
};

const evalPage = (expression) => resultLine(cli(["eval", `() => { ${expression} }`]).output);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isStringList = (value) => Array.isArray(value) && value.every((entry) => typeof entry === "string");

const parseObservation = (line, tokenNames) => {
	const payload = JSON.parse(line);
	if (typeof payload !== "string") throw new Error("expected the encoded eval result");
	const result = JSON.parse(payload);
	if (!isRecord(result) || typeof result.overflow !== "boolean" || !Array.isArray(result.problems) ||
		!result.problems.every((problem) => isRecord(problem) && typeof problem.check === "string" &&
			Object.hasOwn(MACHINE_TO_BAND, problem.severity) && Number.isSafeInteger(problem.count) && problem.count > 0))
		throw new Error("invalid tier observation");
	const { page } = result;
	if (!isRecord(page) || typeof page.innerText !== "string" || !isStringList(page.placeholders) ||
		!isStringList(page.imageSources) || !isRecord(page.tokenValues) ||
		!tokenNames.every((name) => Object.hasOwn(page.tokenValues, name) && typeof page.tokenValues[name] === "string"))
		throw new Error("invalid page observation");
	return result;
};

// Close the owned session on every path where it may have started: the
// explicit call before the report write, and the exit hook after a `die`
// exit. Idempotent; a close failure is reported but never changes the audit's
// own exit code.
let sessionOpen = false;
const closeSession = () => {
	if (!sessionOpen) return;
	sessionOpen = false;
	const run = spawnSync("npx", ["--no-install", "playwright-cli", `-s=${session}`, "close"], {
		encoding: "utf8",
		timeout: 30_000,
		env: { ...process.env },
	});
	const output = String(run.stdout ?? "") + String(run.stderr ?? "");
	if (run.status !== 0 || run.error || /^### Error/m.test(output)) {
		console.error(`audit-variant: warning: could not close session ${session}`);
	}
};
process.on("exit", closeSession);

// autoScroll before anything visual: scroll-reveal content otherwise stays
// at opacity:0 and screenshots read as blank sections (upstream's lesson).
// Scroll first, then audit, then let the caller screenshot. The page field is
// a thin observation collector; tokenNames carries only declared token NAMES
// (JSON from Node), and every match policy stays in page-checks.mjs.
const scrollAndAudit = (tokenNames) =>
	evalPage(`
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
		const innerText = document.body?.innerText ?? "";
		const placeholders = [...document.querySelectorAll("input[placeholder], textarea[placeholder]")]
			.filter((el) => el.getClientRects().length)
			.map((el) => el.getAttribute("placeholder"));
		const imageSources = [...document.images]
			.filter((img) => img.getClientRects().length)
			.map((img) => img.currentSrc || img.src);
		const tokenValues = {};
		for (const name of ${JSON.stringify(tokenNames)}) {
			tokenValues[name] = getComputedStyle(document.documentElement).getPropertyValue(name);
		}
		return JSON.stringify({ overflow, problems, page: { innerText, placeholders, imageSources, tokenValues } });
	`);

const toPageObservation = (page) => ({
	text: [
		{ kind: "innerText", value: page.innerText },
		...page.placeholders.map((value) => ({ kind: "control-placeholder", value })),
	],
	imageSources: page.imageSources,
	tokenValues: page.tokenValues,
});

const findings = [];
const overflowTiers = [];
const seenPageProblemKeys = new Set();
const declaredTokenNames = tokenSource === null ? [] : [...tokenSource.expected.keys()];

openPage();
for (const width of tiers) {
	resize(width);
	const line = scrollAndAudit(declaredTokenNames);
	let result;
	try {
		result = parseObservation(line, declaredTokenNames);
	} catch {
		console.error(`audit-variant: could not parse in-page audit at ${width}: ${line ? "invalid eval result" : "missing ### Result payload"}`);
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
	for (const problem of auditPageTier(toPageObservation(result.page), tokenSource)) {
		const key = pageProblemKey(problem);
		if (seenPageProblemKeys.has(key)) continue;
		seenPageProblemKeys.add(key);
		findings.push({
			row: undefined,
			phase: "page",
			band: MACHINE_TO_BAND[problem.severity],
			source: "machine",
			evidence: [path.join(outDir, `${width}.png`), problem.evidence],
			fix: problem.fix,
		});
	}
}
const consoleCount = (line) => {
	const match = /^Total messages: (\d+) \(Errors: (\d+), Warnings: (\d+)\)$/.exec(line);
	if (!match) return null;
	const [total, errors, warnings] = match.slice(1).map(Number);
	return [total, errors, warnings].every(Number.isSafeInteger) && errors + warnings <= total ? errors : null;
};

const readConsoleCount = () => {
	const tapped = cli(["console", "error"], { die: false, timeout: 30_000 });
	if (!tapped.ok) return null;
	const result = resultLine(tapped.output);
	const link = /^- \[Console\]\(([^)]+)\)$/.exec(result);
	if (!link) return consoleCount(result);
	const file = path.resolve(link[1]);
	const root = path.resolve(".playwright-cli");
	if (path.dirname(file) !== root || !/^console-[\w.:-]+\.log$/.test(path.basename(file))) return null;
	try {
		if (!fs.lstatSync(root).isDirectory() || !fs.lstatSync(file).isFile()) return null;
		return consoleCount(fs.readFileSync(file, "utf8").split(/\r?\n/, 1)[0]);
	} catch {
		return null;
	}
};

const consoleErrors = readConsoleCount();
closeSession();

const tokenCheck =
	tokenSource === null
		? { status: "skip", reason: "no machine-readable design context" }
		: { status: "checked", source: tokenSource.source, tokenCount: tokenSource.expected.size };

const report = {
	variant,
	url,
	tiers,
	consoleErrors,
	overflowTiers,
	findings,
	tokenCheck,
};
const reportPath = path.join(outDir, "report.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, "\t")}\n`);
const blocking = findings.filter((finding) => finding.band === "high").length;
const consoleNote = consoleErrors === null ? "unknown" : `${consoleErrors} console errors`;
console.log(
	`${variant}: ${tiers.length} tiers, ${findings.length} machine findings (${blocking} high), ${consoleNote}, overflow at [${overflowTiers.join(", ")}] → ${reportPath}`,
);
process.exit(blocking > 0 || overflowTiers.length > 0 || (consoleErrors ?? 0) > 0 ? 2 : 0);
