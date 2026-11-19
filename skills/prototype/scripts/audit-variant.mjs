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
import { execFile } from "node:child_process";
import { promisify } from "node:util";
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
const runCli = promisify(execFile);
// setsid is only usable when it also supports --wait; a build that rejects the
// flag would fail every wrapped close, so probe once and fall back to a direct
// close in the audit's own group when unsupported.
const setsidUsable = await (async () => {
	if (process.platform === "win32") return false;
	try {
		await runCli("setsid", ["--wait", "--version"], { timeout: 5_000 });
		return true;
	} catch {
		return false;
	}
})();
const interrupted = new AbortController();

// One CLI call against the owned session. `die` marks failures that leave the
// audit untrustworthy; a failed console tap is the one soft failure (null).
// The 1.59 alpha prints `### Error` sections even on process exit 0, so the
// marker is checked on every nominally successful call.
const cli = async (words, { die = true, timeout = 90_000, interruptible = true } = {}) => {
	if (interruptible) interrupted.signal.throwIfAborted();
	let run;
	let failure;
	try {
		const closing = words[0] === "close";
		const cliArgs = ["--no-install", "playwright-cli", `-s=${session}`, ...words];
		let command = "npx";
		if (closing && setsidUsable) {
			// Terminal signals target the audit's process group, so close needs
			// its own session. --wait preserves the helper's exit status if
			// setsid forks. Without setsid (stock macOS), close still runs in
			// the audit's group — best effort on that platform.
			cliArgs.unshift("--wait", "npx");
			command = "setsid";
		}
		run = await runCli(command, cliArgs, {
			encoding: "utf8", timeout, signal: interruptible ? interrupted.signal : undefined,
		});
	} catch (error) {
		run = error;
		failure = typeof error.code === "number" ? `exit ${error.code}` : error.signal || error.code || error.message;
	}
	const output = String(run.stdout ?? "");
	const stderr = String(run.stderr ?? "");
	const errorSection = /^### Error\b[^\r\n]*(?:\r?\n([^\r\n]+))?/m;
	const reportedError = errorSection.exec(output) ?? errorSection.exec(stderr);
	if (failure || reportedError) {
		if (die) {
			const reason = reportedError?.[1]?.trim() ||
				stderr.split(/\r?\n/).find((line) => line.trim() && !line.startsWith("npm notice")) ||
				failure || "no error details";
			throw new Error(`playwright-cli ${words[0]} failed: ${reason.slice(0, 400)}`);
		}
		return { ok: false, output };
	}
	return { ok: true, output };
};

const resize = (width) => cli(["resize", String(width), "900"]);
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const hasPngSignature = (file) => {
	let descriptor;
	try {
		const stat = fs.statSync(file);
		if (!stat.isFile() || stat.size < PNG_SIGNATURE.length) return false;
		descriptor = fs.openSync(file, "r");
		const header = Buffer.alloc(PNG_SIGNATURE.length);
		return fs.readSync(descriptor, header, 0, header.length, 0) === header.length && header.equals(PNG_SIGNATURE);
	} catch {
		return false;
	} finally {
		if (descriptor !== undefined) fs.closeSync(descriptor);
	}
};
const shot = async (file) => {
	await cli(["screenshot", `--filename=${file}`]);
	if (!hasPngSignature(file)) {
		throw new Error(`${file}: expected PNG signature ${PNG_SIGNATURE.toString("hex")}`);
	}
};

const resultLine = (output) => {
	const lines = output.split(/\r?\n/);
	const start = lines.indexOf("### Result");
	if (start === -1) return "";
	const line = lines.slice(start + 1).find((entry) => entry.trim())?.trim();
	return line && !line.startsWith("### ") ? line : "";
};

const evalPage = async (expression) => resultLine((await cli(["eval", `() => { ${expression} }`])).output);
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

const auditVariant = async () => {
	const findings = [];
	const overflowTiers = [];
	const seenPageProblemKeys = new Set();
	const declaredTokenNames = tokenSource === null ? [] : [...tokenSource.expected.keys()];
	await cli(["open", url], { interruptible: false });
	for (const width of tiers) {
		await resize(width);
		const line = await scrollAndAudit(declaredTokenNames);
		let result;
		try {
			result = parseObservation(line, declaredTokenNames);
		} catch {
			throw new Error(`could not parse in-page audit at ${width}: ${line ? "invalid eval result" : "missing ### Result payload"}`);
		}
		await shot(path.join(outDir, `${width}.png`));
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
	const consoleErrors = await readConsoleCount();
	const tokenCheck = tokenSource === null
		? { status: "skip", reason: "no machine-readable design context" }
		: { status: "checked", source: tokenSource.source, tokenCount: tokenSource.expected.size };
	return { variant, url, tiers, consoleErrors, overflowTiers, findings, tokenCheck };
};

const consoleCount = (line) => {
	const match = /^Total messages: (\d+) \(Errors: (\d+), Warnings: (\d+)\)$/.exec(line);
	if (!match) return null;
	const [total, errors, warnings] = match.slice(1).map(Number);
	return [total, errors, warnings].every(Number.isSafeInteger) && errors + warnings <= total ? errors : null;
};

const readConsoleCount = async () => {
	const tapped = await cli(["console", "error"], { die: false, timeout: 30_000 });
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

const signals = ["SIGINT", "SIGTERM"];
const onSignal = (signal) => interrupted.abort(signal);
for (const signal of signals) process.on(signal, onSignal);
let report;
try {
	report = await auditVariant();
} catch (error) {
	if (!interrupted.signal.aborted) console.error(`audit-variant: ${error.message}`);
	process.exitCode = 1;
} finally {
	const closed = await cli(["close"], { die: false, timeout: 30_000, interruptible: false });
	if (!closed.ok) console.error(`audit-variant: warning: could not close session ${session}`);
	for (const signal of signals) process.off(signal, onSignal);
}

if (interrupted.signal.aborted) {
	process.kill(process.pid, interrupted.signal.reason);
} else if (report) {
	const { consoleErrors, findings, overflowTiers } = report;
	const reportPath = path.join(outDir, "report.json");
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, "\t")}\n`);
	const blocking = findings.filter((finding) => finding.band === "high").length;
	const consoleNote = consoleErrors === null ? "unknown" : `${consoleErrors} console errors`;
	console.log(
		`${variant}: ${tiers.length} tiers, ${findings.length} machine findings (${blocking} high), ${consoleNote}, overflow at [${overflowTiers.join(", ")}] → ${reportPath}`,
	);
	process.exitCode = blocking > 0 || overflowTiers.length > 0 || (consoleErrors ?? 0) > 0 ? 2 : 0;
}
