// Pins the page-check policy in ./page-checks.mjs. Self-contained:
// node --test page-checks.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { eligible } from "../references/redline-shape.mjs";
import { parseTokenSource, auditPageTier, pageProblemKey } from "./page-checks.mjs";

const TOKENS_CSS = `:root {
	--brand-primary: #4f46e5;
	--surface-raised: #ffffff;
	--space-md: 16px;
}
`;

const observation = (overrides = {}) => ({
	text: [{ kind: "innerText", value: "Billing overview" }],
	imageSources: [],
	tokenValues: {},
	...overrides,
});

test("filler: each of the five phrases hits, case-folded, as machine low/nit cues", () => {
	const phrases = [
		"Feature one is ready",
		"check out feature two here",
		"FEATURE 3",
		"a paragraph of lorem ipsum follows",
		"closing with dolor sit amet",
		"the card says placeholder text",
		"the section says sample content",
	];
	for (const value of phrases) {
		const problems = auditPageTier(observation({ text: [{ kind: "innerText", value }] }), null);
		const filler = problems.filter((problem) => problem.check === "filler-copy");
		assert.equal(filler.length, 1, `expected one filler finding for "${value}"`);
		assert.equal(filler[0].severity, "low");
	}
});

test("filler: word boundaries and real brief copy stay silent", () => {
	const clean = [
		"Send invoices to Factureon automatically",
		"features offered in the Pro plan", // features, but no feature one/two/three
		"The loorem ipsumps archive", // neither word bounded
		"placeholder texts here", // plural breaks the exact phrase
	];
	for (const value of clean) {
		const problems = auditPageTier(observation({ text: [{ kind: "innerText", value }] }), null);
		assert.equal(problems.filter((problem) => problem.check === "filler-copy").length, 0, `"${value}" must not match`);
	}
});

test("filler: a legitimate visible Lorem ipsum tutorial quote alone never gates eligibility", () => {
	// The regression: a typography lesson quoting "Lorem ipsum" was a high
	// finding, so eligible() vetoed the variant and decide() even rejected the
	// operator's dissent. A filler match is a review cue (low -> nit), never a
	// machine gate.
	const problems = auditPageTier(
		observation({ text: [{ kind: "innerText", value: "Set the typeface, then paste Lorem ipsum to judge rhythm." }] }),
		null,
	);
	const filler = problems.filter((problem) => problem.check === "filler-copy");
	assert.equal(filler.length, 1);
	assert.equal(filler[0].severity, "low");
	assert.equal(filler[0].identity, "lorem ipsum");
	assert.match(filler[0].evidence, /innerText/);
	assert.match(filler[0].evidence, /Lorem ipsum/);
	assert.match(filler[0].fix, /brief|copy/i);
	assert.match(filler[0].fix, /re-audit/);
});

test("filler: visible control placeholders match; raw markup never scanned", () => {
	const problems = auditPageTier(
		observation({
			text: [
				{ kind: "innerText", value: "Invoice run scheduled" },
				{ kind: "control-placeholder", value: "Enter feature one name" },
			],
		}),
		null,
	);
	const filler = problems.filter((problem) => problem.check === "filler-copy");
	assert.equal(filler.length, 1);
	assert.equal(filler[0].identity, "feature one");
});

test("filler: distinct matched strings stay separate; one finding per distinct string", () => {
	const problems = auditPageTier(
		observation({
			text: [
				{ kind: "innerText", value: "Feature one and FEATURE ONE and feature two" },
			],
		}),
		null,
	);
	const identities = problems
		.filter((problem) => problem.check === "filler-copy")
		.map((problem) => problem.identity);
	assert.deepEqual(identities.sort(), ["feature one", "feature two"]);
});

test("filler: identity is whitespace-collapsed and case-folded; evidence names the kind", () => {
	const problems = auditPageTier(
		observation({ text: [{ kind: "innerText", value: "  Feature   one\n ships today" }] }),
		null,
	);
	const filler = problems.filter((problem) => problem.check === "filler-copy");
	assert.equal(filler.length, 1);
	assert.equal(filler[0].identity, "feature one");
	assert.match(filler[0].evidence, /innerText/);
	assert.match(filler[0].evidence, /Feature   one/);
	assert.match(filler[0].fix, /Feature   one/);
});

test("external image: the five dedicated placeholder services hit at medium over http, https, and subdomains", () => {
	const sources = [
		"http://placehold.co/600x400",
		"https://placekitten.com/200/300",
		"https://via.placeholder.com/350x150.png",
		"https://picsum.photos/seed/a/400/300",
		"https://loremflickr.com/320/240/ocean",
		"https://cdn.placehold.co/64x64", // subdomain of a listed host
		"http://www.picsum.photos/1", // deeper subdomain
	];
	const problems = auditPageTier(observation({ imageSources: sources }), null);
	assert.deepEqual(
		problems.filter((problem) => problem.check === "external-image").map((problem) => problem.identity),
		sources,
	);
	assert.ok(problems.every((problem) => problem.severity === "medium"));
});

test("external image: Unsplash and its subdomains are ordinary hosts, not placeholder services", () => {
	const problems = auditPageTier(
		observation({
			imageSources: [
				"https://images.unsplash.com/photo-1?w=800",
				"https://source.unsplash.com/featured",
				"https://cdn.images.unsplash.com/photo-2",
			],
		}),
		null,
	);
	assert.equal(problems.filter((problem) => problem.check === "external-image").length, 0);
});

test("external image: evidence describes the observed source, never a successful load", () => {
	const problems = auditPageTier(
		observation({ imageSources: ["https://picsum.photos/seed/a/400/300"] }),
		null,
	);
	assert.equal(problems.length, 1);
	assert.match(problems[0].evidence, /src|source|currentSrc/i);
	assert.doesNotMatch(problems[0].evidence, /loaded|load succeeded/i);
});

test("external image: same-origin, data URLs, malformed URLs, and unrelated hosts stay silent", () => {
	const sources = [
		"/static/hero.png",
		"https://localhost:5173/img/local.png",
		"https://localhost:5173/placehold.co/echo", // path mentions the host, host itself is local
		"data:image/png;base64,iVBORw0KGgo=",
		"javascript:alert(1)",
		"not a url",
		"https://example.com/photo.jpg",
		"https://placehold.co.evil.com/600x400", // lookalike suffix is a different host
		"https://notplacehold.co/600x400",
	];
	const problems = auditPageTier(observation({ imageSources: sources }), null);
	assert.equal(problems.filter((problem) => problem.check === "external-image").length, 0);
});

test("external image: dedup on URL minus fragment, query retained", () => {
	const problems = auditPageTier(
		observation({
			imageSources: [
				"https://picsum.photos/seed/a/400/300",
				"https://picsum.photos/seed/a/400/300#fragment",
				"https://picsum.photos/seed/b/400/300",
			],
		}),
		null,
	);
	const keys = new Set(
		problems
			.filter((problem) => problem.check === "external-image")
			.map((problem) => pageProblemKey(problem)),
	);
	assert.equal(keys.size, 2);
	assert.equal(problems[0].identity, "https://picsum.photos/seed/a/400/300");
});

test("token drift: missing actual and unequal hex values drift", () => {
	const tokenSource = parseTokenSource(TOKENS_CSS, "tokens.css");
	const drifted = auditPageTier(
		observation({
			tokenValues: {
				"--brand-primary": "#4f46e5",
				"--surface-raised": "#f8fafc",
				"--space-md": "",
			},
		}),
		tokenSource,
	);
	const problems = drifted.filter((problem) => problem.check === "token-drift");
	assert.deepEqual(problems.map((problem) => problem.identity), ["--surface-raised", "--space-md"]);
	assert.ok(problems.every((problem) => problem.severity === "low"));
	assert.match(problems[0].evidence, /--surface-raised/);
	assert.match(problems[0].evidence, /#ffffff/);
	assert.match(problems[0].evidence, /#f8fafc/);
});

test("token drift: trim, hex case, 3/4-digit expansion, and exact strings all pass", () => {
	const tokenSource = parseTokenSource(TOKENS_CSS, "tokens.css");
	const problems = auditPageTier(
		observation({
			tokenValues: {
				"--brand-primary": "  #4F46E5 ",
				"--surface-raised": "#fff",
				"--space-md": "16px",
			},
		}),
		tokenSource,
	);
	assert.equal(problems.filter((problem) => problem.check === "token-drift").length, 0);
});

test("token drift: 4-digit expands to 8 for comparison", () => {
	const tokenSource = parseTokenSource(":root { --alpha: #ffff; }\n", "tokens.css");
	const pass = auditPageTier(observation({ tokenValues: { "--alpha": "#ffffffff" } }), tokenSource);
	assert.equal(pass.length, 0);
	const drift = auditPageTier(observation({ tokenValues: { "--alpha": "#ffffff00" } }), tokenSource);
	assert.equal(drift.filter((problem) => problem.check === "token-drift").length, 1);
});

test("token drift: hex vs rgb()/oklch() compare as different, like-for-like", () => {
	const tokenSource = parseTokenSource(":root { --brand: #4f46e5; }\n", "tokens.css");
	const problems = auditPageTier(observation({ tokenValues: { "--brand": "rgb(79, 70, 229)" } }), tokenSource);
	assert.equal(problems.filter((problem) => problem.check === "token-drift").length, 1);
	assert.match(problems[0].fix, /like-for-like|same notation/);
	const oklch = auditPageTier(
		observation({ tokenValues: { "--brand": "oklch(0.51 0.23 277)" } }),
		tokenSource,
	);
	assert.equal(oklch.filter((problem) => problem.check === "token-drift").length, 1);
});

test("token drift: undeclared page tokens are irrelevant; no source means no token problem", () => {
	const withSource = parseTokenSource(TOKENS_CSS, "tokens.css");
	const extra = auditPageTier(
		observation({ tokenValues: { "--brand-primary": "#4f46e5", "--surface-raised": "#ffffff", "--space-md": "16px", "--rogue-token": "red" } }),
		withSource,
	);
	assert.equal(extra.filter((problem) => problem.check === "token-drift").length, 0);
	const noSource = auditPageTier(
		observation({ tokenValues: { "--anything": "whatever" } }),
		null,
	);
	assert.equal(noSource.filter((problem) => problem.check === "token-drift").length, 0);
});

test("token drift: one finding per drifted name even when tiers disagree, via pageProblemKey", () => {
	const tokenSource = parseTokenSource(":root { --brand: #4f46e5; }\n", "tokens.css");
	const tierA = auditPageTier(observation({ tokenValues: { "--brand": "#000000" } }), tokenSource);
	const tierB = auditPageTier(observation({ tokenValues: { "--brand": "#111111" } }), tokenSource);
	assert.equal(tierA.length, 1);
	assert.equal(tierB.length, 1);
	assert.equal(pageProblemKey(tierA[0]), pageProblemKey(tierB[0]));
});

test("pageProblemKey: check and identity only; evidence, severity, and fix cannot leak in", () => {
	const base = { check: "filler-copy", identity: "feature one" };
	assert.equal(
		pageProblemKey(base),
		pageProblemKey({ ...base, evidence: "other", severity: "medium", fix: "other" }),
	);
	assert.notEqual(pageProblemKey(base), pageProblemKey({ ...base, check: "external-image" }));
});

test("parseTokenSource: valid flat root block with comments parses to trimmed literals", () => {
	const text = `/* brand tokens */
:root {
	--brand-primary: #4f46e5; /* measured */
	--space-md: 16px;
}
`;
	const source = parseTokenSource(text, "brand/tokens.css");
	assert.equal(source.source, "brand/tokens.css");
	assert.equal(source.expected.size, 2);
	assert.equal(source.expected.get("--brand-primary"), "#4f46e5");
	assert.equal(source.expected.get("--space-md"), "16px");
});

test("parseTokenSource: ordinary literal font strings and color functions parse", () => {
	const source = parseTokenSource(
		`:root {
	--font-body: "Inter var", system-ui, sans-serif;
	--font-mono: 'JetBrains Mono', ui-monospace, monospace;
	--brand: #4f46e5;
	--surface: rgb(255 255 255);
	--accent: oklch(0.51 0.23 277);
	--space-md: 16px;
	--ratio: 1.25;
	--weight: 400;
	--z: -1;
}
`,
		"tokens.css",
	);
	assert.equal(source.expected.size, 9);
	assert.equal(source.expected.get("--font-body"), `"Inter var", system-ui, sans-serif`);
	assert.equal(source.expected.get("--z"), "-1");
});

test("parseTokenSource: the regression inputs reject — no final semicolon, second selector swallowed", () => {
	assert.throws(() => parseTokenSource(":root { --accent: red }\n", "tokens.css"), /semicolon|terminated/i);
	assert.throws(
		() => parseTokenSource(":root { --accent: red } .other { --space: 16px; }\n", "tokens.css"),
		/semicolon|terminated|\{|selector/i,
	);
});

test("parseTokenSource: rejects duplicates, var() aliases, non-root selectors, at-rules, empty values, stray declarations", () => {
	const cases = [
		[":root { --a: 1px; --a: 2px; }", /duplicate/i],
		[":root { --a: var(--b); }", /var\(\)/i],
		[":root { --a: 1px; }\n.button { --b: 2px; }", /\.button|selector/i],
		["@media (min-width: 768px) { :root { --a: 1px; } }", /@media|at-rule/i],
		[":root { --a: ; }", /empty|--a/i],
		[":root { --a: 1px; }\n--stray: 2px;", /stray|root/i],
		["body { color: red; }", /root|selector/i],
		[":root { color: red; }", /color: red|custom propert|--/i],
		[':root { --a: url("x.png"); }', /literal|url/i],
		[":root { --a: ; }", /empty/i],
	];
	for (const [text, pattern] of cases) {
		assert.throws(() => parseTokenSource(text, "tokens.css"), pattern, `input "${text}" must throw`);
	}
});

test("parseTokenSource: nested braces and trailing rules reject before any browser opens", () => {
	const cases = [
		[":root { --a: { nested }; }", /\{|nested|literal/i],
		[":root { --a: 1px; } .b { --c: 2px; }", /\.b|selector|after/i],
		["@media screen { :root { --a: 1px; } }", /@media|at-rule/i],
	];
	for (const [text, pattern] of cases) {
		assert.throws(() => parseTokenSource(text, "tokens.css"), pattern, `input "${text}" must throw`);
	}
});

test("parseTokenSource: every error names the source", () => {
	assert.throws(() => parseTokenSource(":root { --a: ; }", "/work/brand/tokens.css"), /\/work\/brand\/tokens\.css/);
});

test("parseTokenSource: empty file and whitespace-only file throw", () => {
	assert.throws(() => parseTokenSource("", "tokens.css"), /:root/);
	assert.throws(() => parseTokenSource("   \n\t\n", "tokens.css"), /:root/);
});

test("auditPageTier: deterministic declaration/source order across mixed checks", () => {
	const tokenSource = parseTokenSource(TOKENS_CSS, "tokens.css");
	const problems = auditPageTier(
		observation({
			text: [{ kind: "innerText", value: "Feature two and sample content" }],
			imageSources: ["https://placehold.co/600x400", "https://picsum.photos/200"],
			tokenValues: { "--brand-primary": "#4f46e5", "--surface-raised": "green", "--space-md": "" },
		}),
		tokenSource,
	);
	assert.deepEqual(
		problems.map((problem) => `${problem.check}:${problem.identity}`),
		[
			"filler-copy:feature two",
			"filler-copy:sample content",
			"external-image:https://placehold.co/600x400",
			"external-image:https://picsum.photos/200",
			"token-drift:--surface-raised",
			"token-drift:--space-md",
		],
	);
	assert.ok(problems.every((problem) => problem.band === undefined));
});

test("auditPageTier: same filler string at every tier collapses via pageProblemKey", () => {
	const tiers = [360, 768, 1920].map((width) =>
		auditPageTier(observation({ text: [{ kind: "innerText", value: `Feature one at ${width}` }] }), null),
	);
	const keys = tiers.flat().map((problem) => pageProblemKey(problem));
	assert.equal(new Set(keys).size, 1);
});

test("CLI: audit-variant.mjs rejects a bad --design-context-tokens source with exit 1, never a skip", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "page-checks-"));
	const badTokens = path.join(dir, "bad-tokens.css");
	fs.writeFileSync(badTokens, ":root { --a: var(--b); }\n");
	try {
		let result;
		try {
			result = execFileSync(
				process.execPath,
				[
					path.join(import.meta.dirname, "audit-variant.mjs"),
					"file:///nonexistent/fixture.html?variant=A",
					path.join(dir, "out"),
					"--design-context-tokens",
					badTokens,
				],
				{ encoding: "utf8" },
			);
			assert.fail(`expected exit 1, got stdout: ${result}`);
		} catch (error) {
			assert.equal(error.status, 1);
			assert.match(String(error.stderr), /bad-tokens\.css/);
		}
		const missing = path.join(dir, "no-such-file.css");
		try {
			execFileSync(
				process.execPath,
				[
					path.join(import.meta.dirname, "audit-variant.mjs"),
					"file:///nonexistent/fixture.html?variant=A",
					path.join(dir, "out2"),
					"--design-context-tokens",
					missing,
				],
				{ encoding: "utf8" },
			);
			assert.fail("expected exit 1 for unreadable token source");
		} catch (error) {
			assert.equal(error.status, 1);
			assert.match(String(error.stderr), /no-such-file\.css/);
		}
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test("CLI: audit-variant.mjs rejects a nonempty existing output dir without deleting it", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "page-checks-"));
	const out = path.join(dir, "existing-out");
	fs.mkdirSync(out);
	const sentinel = path.join(out, "report.json");
	fs.writeFileSync(sentinel, "prior");
	try {
		try {
			execFileSync(
				process.execPath,
				[path.join(import.meta.dirname, "audit-variant.mjs"), "http://localhost:5173/?variant=A", out],
				{ encoding: "utf8" },
			);
			assert.fail("expected exit 1 for a nonempty output directory");
		} catch (error) {
			assert.equal(error.status, 1);
			assert.match(String(error.stderr), /existing-out|nonempty|not empty/i);
		}
		assert.equal(fs.readFileSync(sentinel, "utf8"), "prior", "the refusing run must not delete earlier reports");
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test("CLI: audit-variant.mjs rejects duplicate tier widths before opening a browser", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "page-checks-"));
	try {
		try {
			execFileSync(
				process.execPath,
				[
					path.join(import.meta.dirname, "audit-variant.mjs"),
					"http://localhost:5173/?variant=A",
					path.join(dir, "out"),
					"--tiers",
					"360,360",
				],
				{ encoding: "utf8" },
			);
			assert.fail("expected exit 1 for duplicate tiers");
		} catch (error) {
			assert.equal(error.status, 1);
			assert.match(String(error.stderr), /duplicate|360/i);
		}
		assert.equal(fs.existsSync(path.join(dir, "out")), false, "no report may exist for a rejected run");
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test("CLI: audit-variant.mjs rejects an unreadable URL and a URL without ?variant=", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "page-checks-"));
	try {
		for (const [label, url] of [["not a url", "not-a-url"], ["no variant", "http://localhost:5173/plain"]]) {
			try {
				execFileSync(
					process.execPath,
					[path.join(import.meta.dirname, "audit-variant.mjs"), url, path.join(dir, `out-${label.replace(/\s+/g, "-")}`)],
					{ encoding: "utf8" },
				);
				assert.fail(`expected exit 1 for ${label}`);
			} catch (error) {
				assert.equal(error.status, 1, label);
			}
		}
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

const auditWithCliStub = (name, evalOutput, consoleOutput, check) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "page-checks-"));
	const bin = path.join(dir, "node_modules", ".bin");
	fs.mkdirSync(bin, { recursive: true });
	fs.writeFileSync(path.join(bin, "playwright-cli"), `#!/usr/bin/env node
const command = process.argv[3];
if (command === "eval") process.stdout.write(${JSON.stringify(evalOutput)});
if (command === "console") process.stdout.write(${JSON.stringify(consoleOutput)});
`, { mode: 0o755 });
	const out = path.join(dir, name);
	try {
		let status = 0;
		let stderr = "";
		try {
			execFileSync(process.execPath, [
				path.join(import.meta.dirname, "audit-variant.mjs"),
				"http://localhost:5173/?variant=A", out, "--tiers", "360",
			], { encoding: "utf8", cwd: dir });
		} catch (error) {
			status = error.status;
			stderr = String(error.stderr);
		}
		const reportPath = path.join(out, "report.json");
		const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : null;
		check({ status, stderr, report });
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
};

const evalResult = (value) => `### Result\n${JSON.stringify(JSON.stringify(value))}\n### Ran Playwright code\n`;

test("CLI: missing, malformed, or wrong-shape eval output fails without a report or stack trace", () => {
	for (const [name, result] of [
		["missing-result", "### Page\n- Page URL: http://x\n"],
		["malformed-result", "### Result\nnot JSON\n"],
		["wrong-shape", evalResult({ overflow: false, problems: [] })],
	]) {
		auditWithCliStub(name, result, "", ({ status, stderr, report }) => {
			assert.equal(status, 1, name);
			assert.match(stderr, /in-page audit.*360/i);
			assert.doesNotMatch(stderr, /TypeError|\n\s+at /);
			assert.equal(report, null);
		});
	}
});

test("CLI: console counts outside the result payload do not imply a clean console", () => {
	const observation = evalResult({
		overflow: false, problems: [],
		page: { innerText: "Billing overview", placeholders: [], imageSources: [], tokenValues: {} },
	});
	auditWithCliStub("unknown-console", observation, "### Result\nUnrecognized\n### Events\nTotal messages: 0 (Errors: 0, Warnings: 0)\n", ({ status, report }) => {
		assert.equal(status, 0);
		assert.equal(report.consoleErrors, null);
		assert.equal(eligible(report), false);
		assert.deepEqual(report.tokenCheck, { status: "skip", reason: "no machine-readable design context" });
	});
});
