// Pins the decision core in ../references/redline-shape.mjs and the walker in
// decide-redline.mjs. Self-contained: node --test decides-redline.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import {
	BANDS,
	MACHINE_TO_BAND,
	ROWS,
	TIER_LADDER,
	parseReport,
	eligible,
	rank,
	decide,
} from "../references/redline-shape.mjs";

const finding = (overrides = {}) => ({
	row: "scannable",
	phase: "visual",
	band: "medium",
	source: "review",
	evidence: ["shots/18/redline/v1-360.png"],
	fix: "tighten grouping",
	...overrides,
});

const report = (overrides = {}) => ({
	variant: "a",
	url: "http://localhost:5173/pricing?variant=a",
	tiers: [360, 390, 768],
	consoleErrors: 0,
	overflowTiers: [],
	findings: [],
	...overrides,
});

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "redline-"));
const run = (args, cwd) => {
	try {
		const stdout = execFileSync(
			process.execPath,
			[path.join(import.meta.dirname, "decide-redline.mjs"), ...args],
			{ cwd, encoding: "utf8" },
		);
		return { code: 0, stdout };
	} catch (error) {
		return { code: error.status, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? "") };
	}
};
const writeReports = (dir, reports) =>
	Object.entries(reports).map(([name, data]) => {
		const file = path.join(dir, name);
		fs.writeFileSync(file, JSON.stringify(data));
		return file;
	});

test("shape data: exact row tuples, bands, ladder, and machine mapping", () => {
	assert.deepEqual(ROWS.map(({ id, band, lawAnchor }) => [id, band, lawAnchor]), [
		["overflow", "high", "#grouping"],
		["console", "high", "#responsiveness"],
		["state-visible", "high", "#responsiveness"],
		["safe-targets", "high", "#motor"],
		["signified", "high", "#familiarity"],
		["scannable", "medium", "#load"],
		["aligned", "medium", "#grouping"],
		["figure-ground", "medium", "#grouping"],
		["contrast-coded", "medium", "#salience"],
		["critical-placement", "medium", "#ordering"],
		["smart-defaults", "nit", "#complexity"],
		["one-thing-noticed", "nit", "#salience"],
	]);
	for (const row of ROWS)
		assert.ok(row.question?.length, `row ${row.id} has no question`);
	assert.deepEqual(BANDS, ["blocker", "high", "medium", "nit"]);
	assert.deepEqual(TIER_LADDER, [360, 390, 768, 1024, 1440, 1920]);
	assert.deepEqual(MACHINE_TO_BAND, { high: "high", medium: "medium", low: "nit" });
});

test("parseReport: duplicate tier widths are schema-invalid", () => {
	assert.match(
		parseReport(JSON.stringify(report({ tiers: [360, 360] })), "r-dup.json").error,
		/r-dup\.json: field "tiers"/i,
	);
	assert.match(parseReport(JSON.stringify(report({ tiers: [360, 360] })), "r-dup.json").error, /repeats a tier/i);
});

test("decide: mismatched tier sets across reports refuse to rank with a tier-set error", () => {
	const wide = report({ variant: "wide", tiers: [360, 768, 1024] });
	const narrow = report({ variant: "narrow", tiers: [360, 768] });
	let thrown;
	try {
		decide([wide, narrow]);
	} catch (error) {
		thrown = error;
	}
	assert.ok(thrown, "mismatched tier sets must throw, never rank");
	assert.match(thrown.message, /tier set/i);
});

test("decide: identical tier sets in a different order still compare", () => {
	const first = report({ variant: "a", findings: [finding()] });
	const reordered = report({ variant: "b", tiers: [768, 360, 390] });
	const decision = decide([first, reordered]);
	assert.equal(decision.kind, "confirmed");
	assert.equal(decision.winner, "b");
});

test("decide: a single report never trips the tier-set gate", () => {
	const decision = decide([report({ variant: "solo", tiers: [360, 1024] })]);
	assert.equal(decision.kind, "confirmed");
	assert.equal(decision.winner, "solo");
});

test("eligible: blocker, high, console error, and overflow each reject", () => {
	assert.equal(eligible(report()), true);
	assert.equal(eligible(report({ findings: [finding({ band: "blocker" })] })), false);
	assert.equal(eligible(report({ findings: [finding({ band: "high" })] })), false);
	assert.equal(eligible(report({ consoleErrors: 1 })), false);
	assert.equal(eligible(report({ overflowTiers: [360] })), false);
	assert.equal(eligible(report({ findings: [finding({ band: "nit" })] })), true);
});

test("rank: fewest open medium first; nits never rank; rejected drop out", () => {
	const withTwo = report({ variant: "two", findings: [finding(), finding()] });
	const withOne = report({ variant: "one", findings: [finding()] });
	const withNitOnly = report({ variant: "nitonly", findings: [finding({ band: "nit" })] });
	const blocked = report({ variant: "blocked", findings: [finding({ band: "high" })] });
	assert.deepEqual(
		rank([withTwo, blocked, withNitOnly, withOne]).map((entry) => entry.variant),
		["nitonly", "one", "two"],
	);
});

test("decide: confirmed winner with rejected recorded", () => {
	const decision = decide([
		report({ variant: "b", findings: [finding()] }),
		report({ variant: "a", findings: [finding(), finding()] }),
		report({ variant: "c", findings: [finding({ band: "high" })] }),
	]);
	assert.equal(decision.winner, "b");
	assert.equal(decision.kind, "confirmed");
	assert.deepEqual(decision.tiedAtTop, ["b"]);
	assert.deepEqual(
		decision.rejected,
		[{ variant: "c", reasons: ["1 open blocker/high findings: scannable"] }],
	);
});

test("decide: auto-tie-broken on the last key with the assumption stated", () => {
	const decision = decide([
		report({ variant: "a", findings: [finding()] }),
		report({ variant: "b", findings: [finding()] }),
	]);
	assert.equal(decision.winner, "a");
	assert.equal(decision.kind, "auto-tie-broken");
	assert.deepEqual(decision.tiedAtTop, ["a", "b"]);
	assert.match(decision.assumption, /auto-broke the tie/);
});

test("decide: pick agreeing with a unique computed winner is confirmed", () => {
	const decision = decide(
		[
			report({ variant: "a", findings: [] }),
			report({ variant: "b", findings: [finding()] }),
		],
		{ variant: "a" },
	);
	assert.equal(decision.kind, "confirmed");
	assert.equal(decision.winner, "a");
	assert.deepEqual(decision.tiedAtTop, ["a"]);
});

test("decide: pick tie-breaks inside tiedAtTop", () => {
	const decision = decide(
		[
			report({ variant: "a", findings: [finding()] }),
			report({ variant: "b", findings: [finding()] }),
		],
		{ variant: "b" },
	);
	assert.equal(decision.winner, "b");
	assert.equal(decision.kind, "tie-broken");
	assert.deepEqual(decision.tiedAtTop, ["a", "b"]);
});

test("decide: override requires dissent; dissent copied verbatim", () => {
	const dissent = { disputes: ["scannable", "aligned"], reason: "human-right rubric-wrong" };
	const decision = decide(
		[
			report({ variant: "a", findings: [] }),
			report({ variant: "b", findings: [finding()] }),
		],
		{ variant: "b", dissent },
	);
	assert.equal(decision.winner, "b");
	assert.equal(decision.kind, "overridden");
	assert.deepEqual(decision.dissent, dissent);
	assert.throws(
		() => decide([report({ variant: "a" }), report({ variant: "b", findings: [finding()] })], { variant: "b" }),
		/no dissent/,
	);
	assert.throws(
		() => decide([report()], { variant: "a", dissent: { ...dissent, disputes: [{ toString: false }] } }),
		/dispute "<invalid>" names no known row/,
	);
});

test("decide: pick naming an ineligible or unknown variant is an error", () => {
	assert.throws(
		() => decide([report({ variant: "a" }), report({ variant: "b", findings: [finding({ band: "high" })] })], { variant: "b" }),
		/ineligible or unknown/,
	);
	assert.throws(() => decide([report({ variant: "a" })], { variant: "zz" }), /ineligible or unknown/);
});

test("decide: all rejected names reasons per variant", () => {
	const decision = decide([
		report({ variant: "a", consoleErrors: 2 }),
		report({ variant: "b", overflowTiers: [390] }),
	]);
	assert.equal(decision.winner, null);
	assert.equal(decision.kind, "all-rejected");
	assert.deepEqual(
		decision.rejected.map((entry) => entry.reasons.join("; ")),
		["2 console errors", "overflow at tier(s) 390"],
	);
});

test("machine-band mapping: low lands on nit and never gates or ranks", () => {
	const lowOnly = report({ variant: "low", findings: [finding({ band: "nit", source: "machine" })] });
	const plain = report({ variant: "plain" });
	assert.equal(MACHINE_TO_BAND.low, "nit");
	assert.equal(eligible(lowOnly), true);
	// Zero open mediums both, so order follows input; the nit finding never ranks.
	assert.deepEqual(rank([lowOnly, plain]).map((entry) => entry.variant), ["low", "plain"]);
	assert.deepEqual(decide([lowOnly, plain]).tiedAtTop, ["low", "plain"]);
});

test("parseReport: tokenCheck skip, checked, and absence each parse", () => {
	const skip = parseReport(JSON.stringify(report({ tokenCheck: { status: "skip", reason: "no machine-readable design context" } })), "r-skip.json");
	assert.equal(skip.error, undefined);
	assert.deepEqual(skip.tokenCheck, { status: "skip", reason: "no machine-readable design context" });
	const checked = parseReport(
		JSON.stringify(report({ tokenCheck: { status: "checked", source: "/work/settings/brand/tokens.css", tokenCount: 8 } })),
		"r-checked.json",
	);
	assert.equal(checked.error, undefined);
	assert.deepEqual(checked.tokenCheck, { status: "checked", source: "/work/settings/brand/tokens.css", tokenCount: 8 });
	const legacy = JSON.parse(JSON.stringify(report()));
	assert.equal(parseReport(JSON.stringify(legacy), "r-absent.json").tokenCheck, undefined);
});

test("parseReport: malformed tokenCheck names file and field", () => {
	const malformed = (tokenCheck) => parseReport(JSON.stringify(report({ tokenCheck })), "r-tc.json").error;
	assert.match(malformed("skip"), /r-tc\.json: field "tokenCheck"/);
	assert.match(malformed([1]), /field "tokenCheck"/);
	assert.match(malformed({ status: "maybe" }), /status "maybe"/);
	assert.match(malformed({ status: "skip", reason: "lazy" }), /reason "lazy"/);
	assert.match(malformed({ status: "skip", reason: "no machine-readable design context", extra: 1 }), /unknown nested|extra/);
	assert.match(malformed({ status: "checked", source: "  ", tokenCount: 3 }), /source/);
	assert.match(malformed({ status: "checked", source: "tokens.css", tokenCount: 0 }), /tokenCount/);
	assert.match(malformed({ status: "checked", source: "tokens.css", tokenCount: 2.5 }), /tokenCount/);
	assert.match(malformed({ status: "checked", source: "tokens.css" }), /tokenCount/);
	assert.match(malformed({ status: "checked", source: "tokens.css", tokenCount: 1, note: "x" }), /unknown nested|note/);
});

test("walker: tokenCheck rides reports without changing the decision", () => {
	const dir = tmp();
	writeReports(dir, {
		"report-a.json": report({ variant: "a", tokenCheck: { status: "skip", reason: "no machine-readable design context" } }),
		"report-b.json": report({
			variant: "b",
			findings: [finding()],
			tokenCheck: { status: "checked", source: "tokens.css", tokenCount: 4 },
		}),
	});
	const out = run([dir], dir);
	assert.equal(out.code, 0);
	assert.match(out.stdout, /a \(confirmed\)/);
	const winner = JSON.parse(fs.readFileSync(path.join(dir, "winner.json"), "utf8"));
	assert.equal(winner.winner, "a");
	assert.equal(winner.rejected.length, 0);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: bare report paths still work and winner.json lands beside them", () => {
	const dir = tmp();
	const file = path.join(dir, "report-a.json");
	fs.writeFileSync(file, JSON.stringify(report({ variant: "a" })));
	const out = run([file], dir);
	assert.equal(out.code, 0);
	assert.ok(fs.existsSync(path.join(dir, "winner.json")), "winner.json missing beside reports");
	fs.rmSync(dir, { recursive: true, force: true });
});

test("parseReport: accepts a well-formed report and normalizes findings", () => {
	const result = parseReport(
		JSON.stringify(report({ findings: [finding({ row: undefined })] })),
		"report-a.json",
	);
	assert.equal(result.error, undefined);
	assert.equal(result.findings[0].row, undefined);
	assert.equal(result.findings[0].band, "medium");
});

test("parseReport: missing variant, band, and evidence each name file and field", () => {
	const missing = JSON.parse(JSON.stringify(report()));
	delete missing.variant;
	assert.match(parseReport(JSON.stringify(missing), "r1.json").error, /r1\.json: field "variant"/);
	const badBand = report({ findings: [finding({ band: "sev-3" })] });
	assert.match(parseReport(JSON.stringify(badBand), "r2.json").error, /r2\.json: finding 0 band "sev-3"/);
	const noEvidence = report({ findings: [finding({ evidence: [] })] });
	assert.match(parseReport(JSON.stringify(noEvidence), "r3.json").error, /r3\.json: finding 0 carries no non-empty evidence/);
	assert.match(parseReport("{oops", "r4.json").error, /r4\.json: not valid JSON/);
	assert.match(parseReport(JSON.stringify(report({ tiers: [320] })), "r5.json").error, /r5\.json: field "tiers".*outside/);
	const notes = report();
	notes.notes = "looks fine overall";
	assert.match(parseReport(JSON.stringify(notes), "r6.json").error, /unknown field "notes"/);
});

test("walker: confirmed run exits 0 and writes winner.json", () => {
	const dir = tmp();
	writeReports(dir, {
		"report-a.json": report({ variant: "a", findings: [finding()] }),
		"report-b.json": report({ variant: "b", findings: [finding(), finding()] }),
	});
	const out = run([dir], dir);
	assert.equal(out.code, 0);
	assert.match(out.stdout, /a \(confirmed\)/);
	const winner = JSON.parse(fs.readFileSync(path.join(dir, "winner.json"), "utf8"));
	assert.equal(winner.kind, "confirmed");
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: all-rejected exits 2", () => {
	const dir = tmp();
	writeReports(dir, { "report-a.json": report({ variant: "a", consoleErrors: 3 }) });
	const out = run([dir], dir);
	assert.equal(out.code, 2);
	assert.match(out.stdout + out.stderr, /no eligible variant/);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: schema-invalid report exits 3", () => {
	const dir = tmp();
	const file = path.join(dir, "report-a.json");
	fs.writeFileSync(file, JSON.stringify({ variant: "a" }));
	const out = run([file], dir);
	assert.equal(out.code, 3);
	assert.match(out.stderr, /field "url"/);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: object-valued tokenCheck and finding fields exit 3", (context) => {
	const dir = tmp();
	context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	const invalid = { toString: false };
	for (const [overrides, diagnostic] of [
		[{ tokenCheck: { status: "skip", reason: invalid } }, /report\.json: field "tokenCheck" reason/],
		[{ tokenCheck: { status: invalid } }, /report\.json: field "tokenCheck" status/],
		...["phase", "row", "band", "source"].map((field) => [
			{ findings: [finding({ [field]: invalid })] }, new RegExp(`report\\.json: finding 0 .*${field}`),
		]),
	]) {
		writeReports(dir, { "report.json": report(overrides) });
		const out = run([dir], dir);
		assert.equal(out.code, 3, out.stderr);
		assert.match(out.stderr, diagnostic);
		assert.doesNotMatch(out.stderr, /TypeError|\n\s+at /);
		assert.equal(fs.existsSync(path.join(dir, "winner.json")), false);
	}
});

test("walker: invalid pick exits 2", () => {
	const dir = tmp();
	writeReports(dir, { "report-a.json": report({ variant: "a" }), "report-b.json": report({ variant: "b", findings: [finding()] }) });
	fs.writeFileSync(path.join(dir, "pick.json"), JSON.stringify({ variant: "zz" }));
	const out = run([dir, "--pick", "pick.json"], dir);
	assert.equal(out.code, 2);
	assert.match(out.stderr, /ineligible or unknown/);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: pick file that is not JSON exits 3", () => {
	const dir = tmp();
	writeReports(dir, { "report-a.json": report({ variant: "a" }) });
	fs.writeFileSync(path.join(dir, "pick.json"), "{nope");
	const out = run([dir, "--pick", "pick.json"], dir);
	assert.equal(out.code, 3);
	assert.match(out.stderr, /not valid JSON/);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: tie with pick resolves as tie-broken", () => {
	const dir = tmp();
	writeReports(dir, {
		"report-a.json": report({ variant: "a", findings: [finding()] }),
		"report-b.json": report({ variant: "b", findings: [finding({ row: "aligned" })] }),
	});
	fs.writeFileSync(path.join(dir, "pick.json"), JSON.stringify({ variant: "b" }));
	const out = run([dir, "--pick", "pick.json"], dir);
	assert.equal(out.code, 0);
	assert.match(out.stdout, /b \(tie-broken\) tied at top: \[a, b\]/);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("eligible: a null console count is not eligible until supplied", () => {
	assert.equal(eligible(report({ consoleErrors: null })), false);
	const decision = decide([report({ variant: "a", consoleErrors: null })]);
	assert.equal(decision.kind, "all-rejected");
	assert.deepEqual(decision.rejected[0].reasons, ["console errors not yet counted (null)"]);
	assert.match(parseReport(JSON.stringify(report({ consoleErrors: null })), "r7.json").error ?? "", /^$|^r7\.json/);
	assert.equal(parseReport(JSON.stringify(report({ consoleErrors: null })), "r7.json").error, undefined);
});

test("walker: run-dir with variant subdirectories recurses and writes winner.json into the run dir", () => {
	const dir = tmp();
	for (const [variant, findings] of [["a", []], ["b", [finding()]]]) {
		const variantDir = path.join(dir, variant);
		fs.mkdirSync(variantDir);
		fs.writeFileSync(path.join(variantDir, "report.json"), JSON.stringify(report({ variant, findings })));
	}
	const out = run([dir], dir);
	assert.equal(out.code, 0);
	assert.match(out.stdout, /a \(confirmed\)/);
	const winner = JSON.parse(fs.readFileSync(path.join(dir, "winner.json"), "utf8"));
	assert.equal(winner.winner, "a");
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: ignores only reserved tool directories when ranking variants", (context) => {
	const dir = tmp();
	context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	for (const name of [".git", ".playwright-cli", "node_modules"]) fs.mkdirSync(path.join(dir, name));
	for (const [variant, findings] of [["a", [finding()]], [".candidate", []]]) {
		const variantDir = path.join(dir, variant);
		fs.mkdirSync(variantDir);
		writeReports(variantDir, { "report.json": report({ variant, findings }) });
	}
	const out = run([dir], dir);
	assert.equal(out.code, 0, out.stderr);
	assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "winner.json"))).winner, ".candidate");
});

test("walker: randomdir and unreserved dot directories require report.json", (context) => {
	const dir = tmp();
	context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	writeReports(dir, { "report-a.json": report() });
	for (const name of ["randomdir", ".other"]) {
		const missing = path.join(dir, name);
		fs.mkdirSync(missing);
		const out = run([dir], dir);
		assert.equal(out.code, 3);
		assert.ok(out.stderr.includes(path.join(missing, "report.json")), out.stderr);
		assert.equal(fs.existsSync(path.join(dir, "winner.json")), false);
		fs.rmdirSync(missing);
	}
});

test("walker: rejects symlinked variant directories", (context) => {
	const dir = tmp();
	context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	const variant = path.join(dir, "a");
	fs.mkdirSync(variant);
	writeReports(variant, { "report.json": report() });
	const link = path.join(dir, "linked-variant");
	fs.symlinkSync(variant, link, "dir");
	const out = run([dir], dir);
	assert.equal(out.code, 3);
	assert.match(out.stderr, /symlink/i);
	assert.ok(out.stderr.includes(link), out.stderr);
	assert.equal(fs.existsSync(path.join(dir, "winner.json")), false);
});

test("walker: missing variant report neither creates nor replaces a winner", (context) => {
	const dir = tmp();
	context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	fs.mkdirSync(path.join(dir, "A"));
	writeReports(path.join(dir, "A"), { "report.json": report({ variant: "A" }) });
	fs.mkdirSync(path.join(dir, "B"));
	const winner = path.join(dir, "winner.json");
	const refuse = () => {
		const out = run([dir], dir);
		assert.equal(out.code, 3);
		assert.ok(out.stderr.includes(path.join("B", "report.json")), out.stderr);
	};
	refuse();
	assert.equal(fs.existsSync(winner), false);
	const prior = '{"winner":"previous"}\n';
	fs.writeFileSync(winner, prior);
	refuse();
	assert.equal(fs.readFileSync(winner, "utf8"), prior);
});

test("walker: overflow-only report is rejected and can fail the whole run", () => {
	const dir = tmp();
	writeReports(dir, { "report-a.json": report({ variant: "a", overflowTiers: [360] }) });
	const out = run([dir], dir);
	assert.equal(out.code, 2);
	const winner = JSON.parse(fs.readFileSync(path.join(dir, "winner.json"), "utf8"));
	assert.deepEqual(winner.rejected[0].reasons, ["overflow at tier(s) 360"]);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: mismatched tier sets exit 3, write no new winner, and keep the old one", () => {
	const dir = tmp();
	writeReports(dir, {
		"report-a.json": report({ variant: "a", tiers: [360, 768] }),
		"report-b.json": report({ variant: "b", tiers: [360, 390] }),
	});
	const stale = { winner: "a", kind: "confirmed", stale: true };
	fs.writeFileSync(path.join(dir, "winner.json"), JSON.stringify(stale));
	const out = run([dir], dir);
	assert.equal(out.code, 3);
	assert.match(out.stderr, /tier set/i);
	assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, "winner.json"), "utf8")), stale);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: a report carrying duplicate tiers exits 3", () => {
	const dir = tmp();
	writeReports(dir, {
		"report-a.json": report({ variant: "a", tiers: [360, 768] }),
		"report-b.json": report({ variant: "b", tiers: [768, 768] }),
	});
	const out = run([dir], dir);
	assert.equal(out.code, 3);
	assert.match(out.stderr, /repeats a tier/i);
	fs.rmSync(dir, { recursive: true, force: true });
});

test("walker: same tier set in different orders across reports still decides", () => {
	const dir = tmp();
	writeReports(dir, {
		"report-a.json": report({ variant: "a", findings: [finding()] }),
		"report-b.json": report({ variant: "b", tiers: [768, 360, 390] }),
	});
	const out = run([dir], dir);
	assert.equal(out.code, 0);
	assert.match(out.stdout, /b \(confirmed\)/);
	fs.rmSync(dir, { recursive: true, force: true });
});
