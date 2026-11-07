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

test("shape data: twelve rows, one scale, one ladder, one band mapping", () => {
	assert.equal(ROWS.length, 12);
	for (const row of ROWS) {
		assert.ok(row.question?.length, `row ${row.id} has no question`);
		assert.ok(BANDS.includes(row.band), `row ${row.id} band not on the scale`);
		assert.match(row.lawAnchor, /^#[a-z]+$/, `row ${row.id} lawAnchor is not an anchor`);
	}
	assert.deepEqual(TIER_LADDER, [360, 390, 768, 1024, 1440, 1920]);
	assert.deepEqual(MACHINE_TO_BAND, { high: "high", medium: "medium", low: "nit" });
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

test("walker: overflow-only report is rejected and can fail the whole run", () => {
	const dir = tmp();
	writeReports(dir, { "report-a.json": report({ variant: "a", overflowTiers: [360] }) });
	const out = run([dir], dir);
	assert.equal(out.code, 2);
	const winner = JSON.parse(fs.readFileSync(path.join(dir, "winner.json"), "utf8"));
	assert.deepEqual(winner.rejected[0].reasons, ["overflow at tier(s) 360"]);
	fs.rmSync(dir, { recursive: true, force: true });
});
