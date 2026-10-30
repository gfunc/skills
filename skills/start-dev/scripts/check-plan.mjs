#!/usr/bin/env node
// Validates a plan against the one shape statement in ../references/plan-shape.mjs.
// The shape owns every rule; this file parses the document and walks the shape.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { shape, validators } from "../references/plan-shape.mjs";

const USAGE = "Usage: node check-plan.mjs --spawn-bound <minutes|unlimited> <plan.md>";
const args = process.argv.slice(2);
let spawnBound = null;
const positional = [];
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--spawn-bound") {
		const value = args[++i];
		if (value === "unlimited") spawnBound = { unlimited: true };
		else if (value && /^[1-9]\d*$/.test(value)) spawnBound = { minutes: Number(value) };
		else {
			console.error(USAGE);
			process.exit(2);
		}
	} else if (args[i].startsWith("--")) {
		console.error(USAGE);
		process.exit(2);
	} else positional.push(args[i]);
}
if (!spawnBound || positional.length !== 1) {
	console.error(USAGE);
	process.exit(2);
}
const file = positional[0];
let text;
try {
	text = fs.readFileSync(file, "utf8");
} catch (error) {
	console.error(`check-plan: cannot read ${file}: ${error.message}`);
	process.exit(2);
}

const lines = text.split(/\r?\n/);
const planDir = path.dirname(path.resolve(file));
const problems = [];
const fail = (line, message) => problems.push(`${file}:${line + 1}: ${message}`);
const exists = (value) => {
	const candidate = value.replace(/^`|`$/g, "").trim();
	if (!candidate) return false;
	return [candidate, path.resolve(planDir, candidate), path.resolve(process.cwd(), candidate)].some((p) => {
		try {
			return fs.existsSync(p);
		} catch {
			return false;
		}
	});
};

// ---------- parse ----------
const inFence = new Array(lines.length).fill(false);
const fenceLang = new Array(lines.length).fill(null);
let fence = null;
for (let i = 0; i < lines.length; i++) {
	const line = lines[i];
	const open = line.match(/^\s*```\s*(\S*)/);
	if (!fence && open) {
		fence = { lang: open[1] || "", start: i };
		inFence[i] = true;
		fenceLang[i] = fence.lang;
		continue;
	}
	if (fence && /^\s*```/.test(line)) {
		inFence[i] = true;
		fenceLang[i] = fence.lang;
		fence = null;
		continue;
	}
	if (fence) {
		inFence[i] = true;
		fenceLang[i] = fence.lang;
	}
}

const headings = [];
for (let i = 0; i < lines.length; i++) {
	if (inFence[i]) continue;
	const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
	if (match) headings.push({ level: match[1].length, title: match[2].trim(), line: i });
}

const sections = new Map();
for (let h = 0; h < headings.length; h++) {
	const heading = headings[h];
	if (heading.level !== 2) continue;
	const end = h + 1 < headings.length ? headings[h + 1].line : lines.length;
	sections.set(heading.title, { title: heading.title, line: heading.line, body: lines.slice(heading.line + 1, end), bodyStart: heading.line + 1 });
}

const boxesIn = (body, start) =>
	body
		.map((text, index) => ({ text: text.trim(), line: start + index }))
		.filter((box) => /^- \[[ x]\] /.test(box.text))
		.map((box) => ({ ...box, body: box.text.replace(/^- \[[ x]\] /, "") }));

const tablesIn = (body, start) => {
	const tables = [];
	let current = null;
	for (let i = 0; i < body.length; i++) {
		const line = body[i].trim();
		if (line.startsWith("|")) {
			if (!current) current = { start: start + i, rows: [] };
			current.rows.push(line);
		} else if (current) {
			tables.push(current);
			current = null;
		}
	}
	if (current) tables.push(current);
	return tables
		.map((table) => {
			const cells = table.rows.map((row) =>
				row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
			const separator = cells.findIndex((row) => row.every((cell) => /^:?-{3,}:?$/.test(cell)));
			if (separator < 0) return null;
			return { start: table.start, header: cells[separator - 1] ?? [], rows: cells.slice(separator + 1) };
		})
		.filter(Boolean);
};

// ---------- document rules ----------
const documentRules = shape.documentRules ?? {};
for (let i = 0; i < lines.length; i++) {
	if (inFence[i]) continue;
	let prose = lines[i].replace(/`[^`]*`/g, "");
	for (const rule of Object.values(documentRules)) {
		if (rule.lineExceptions?.some((re) => re.test(lines[i]))) continue;
		let test = prose;
		for (const token of rule.neutralize ?? []) test = test.split(token).join("");
		const hit = rule.re.exec?.(test) ?? rule.re.test(test);
		if (hit) fail(i, rule.message);
	}
}

// ---------- title, intro, how to read ----------
const title = headings.find((heading) => heading.level === 1);
if (!title) fail(0, "no H1 title");
if (shape.title?.intro && title) {
	const firstH2 = headings.find((heading) => heading.level === 2);
	const end = firstH2 ? firstH2.line : lines.length;
	const intro = lines.slice(title.line + 1, end).filter((line) => line.trim());
	if (intro.length >= shape.title.intro.maxLines)
		fail(title.line, `intro is ${intro.length} lines, under ${shape.title.intro.maxLines} required`);
}

const howToRead = sections.get("How to read this");
if (!howToRead) fail(0, 'no "## How to read this" section');
else {
	const joined = howToRead.body.join("\n");
	for (const marker of shape.howToRead?.markers ?? [])
		if (!joined.includes(marker)) fail(howToRead.line, `How to read this lacks "${marker}"`);
}

// ---------- sections order ----------
const h2 = headings.filter((heading) => heading.level === 2).map((heading) => heading.title);
for (const forbidden of shape.sections?.forbiddenHeadings ?? [])
	if (h2.includes(forbidden)) fail(headings.find((heading) => heading.title === forbidden).line, `retired heading "${forbidden}" is not allowed`);

const close = sections.get(shape.close?.title ?? "Close the run");
if (!close) fail(0, `no "## ${shape.close?.title ?? "Close the run"}" section`);

const prSectionPattern = shape.sections?.prSection?.pattern;
const prHeads = headings.filter(
	(heading) => heading.level === 2 && prSectionPattern?.test(`## ${heading.title}`) &&
		(!close || heading.line < close.line) &&
		(headings.find((h) => h.title === "Run graph")?.line ?? 0) < heading.line,
);
if (prHeads.length !== 1) fail(prHeads[0]?.line ?? 0, `expected exactly one PR section, found ${prHeads.length}`);

if (close) {
	const after = headings.filter((heading) => heading.level === 2 && heading.line > close.line);
	for (const heading of after)
		if (!/^Appendix/.test(heading.title)) fail(heading.line, `section after Close the run must be an Appendix, got "${heading.title}"`);
	if (!after.length) fail(close.line, `Close the run must be followed by "## ${shape.appendices?.firstRequired ?? "Prototype evidence"}"`);
	else if (!after[0].title.includes(shape.appendices?.firstRequired ?? "Prototype evidence"))
		fail(after[0].line, `first appendix must be "${shape.appendices?.firstRequired}"`);
}

// ---------- readiness ----------
const readiness = sections.get("Verification readiness");
const readinessValues = {};
if (!readiness) fail(0, 'no "## Verification readiness" section');
else {
	const table = tablesIn(readiness.body, readiness.bodyStart)[0];
	const fields = shape.readiness.table.fields;
	if (!table) fail(readiness.line, "Verification readiness has no table");
	else {
		const seen = new Set();
		for (const row of table.rows) {
			const name = row[0];
			const raw = (row[1] ?? "").trim();
			const value = raw.replace(/^`|`$/g, "").trim();
			if (!name) continue;
			if (seen.has(name)) fail(table.start, `Verification readiness repeats table field "${name}"`);
			seen.add(name);
			readinessValues[name] = value;
			const field = fields.find((entry) => entry.name === name);
			if (!field) continue;
			if (field.enum && !field.enum.includes(value)) fail(table.start, `unknown ${name} "${value}"`);
			if (field.validator) {
				const needsRaw = ["readinessEvidence", "resolvablePath"].includes(field.validator);
				const result = validators[field.validator](needsRaw ? raw : value, { readiness: readinessValues, exists });
				for (const message of [].concat(result ?? [])) if (message) fail(table.start, `${name}: ${message}`);
			}
		}
		for (const field of fields)
			if (field.required && !seen.has(field.name)) fail(readiness.line, `Verification readiness lacks table field "${field.name}"`);
		if (readinessValues.Surface && !shape.readiness.table.fields.find((f) => f.name === "Surface").enum.includes(readinessValues.Surface))
			fail(table.start, `unknown Surface "${readinessValues.Surface}"`);
		if (readinessValues.Decision === "not-required" && !["library", "backend"].includes(readinessValues.Surface))
			fail(table.start, "Decision not-required is only allowed for library or backend surfaces");
	}
}

// ---------- run graph ----------
const runGraph = sections.get("Run graph");
const laneRows = [];
const unitIds = [];
if (!runGraph) fail(0, 'no "## Run graph" section');
else {
	const graphBox = [];
	for (let i = runGraph.bodyStart; i < runGraph.bodyStart + runGraph.body.length; i++)
		if (fenceLang[i] === "mermaid") graphBox.push({ line: i, text: lines[i] });
	if (!graphBox.length) fail(runGraph.line, "Run graph has no mermaid fence");
	else {
		const body = graphBox.map((entry) => entry.text).join("\n");
		if (!/graph TD/.test(body)) fail(graphBox[0].line, 'Run graph must declare "graph TD"');
		if (shape.runGraph?.forbidden?.waveSubgraphs?.test(body)) fail(graphBox[0].line, "wave subgraphs are retired");
		const nodes = new Map();
		const edges = [];
		const gates = [];
		for (const entry of graphBox) {
			const text = entry.text;
			for (const match of text.matchAll(/([A-Za-z0-9_]+)\[([^\]]+)\]/g)) {
				nodes.set(match[1], { label: match[2], line: entry.line });
				if (match[2].startsWith("gate: ")) gates.push(match[2].slice(6).trim());
			}
			for (const match of text.matchAll(/([A-Za-z0-9_]+)\s*-->\s*(?:\|[^|]*\|\s*)?([A-Za-z0-9_]+)/g))
				edges.push([match[1], match[2]]);
		}
		const units = [...nodes.entries()].filter(([, node]) => node.label.startsWith("unit: "));
		if (!units.length) fail(graphBox[0].line, "Run graph has no unit node");
		for (const [id, node] of units) {
			unitIds.push(id);
			const result = validators.unitNodeLabel(node.label);
			if (result) fail(node.line, result);
		}
		const prNodes = [...nodes.values()].filter((node) => node.label.startsWith("pr: "));
		if (prNodes.length !== 1) fail(graphBox[0].line, `Run graph needs exactly one pr node, found ${prNodes.length}`);
		for (const required of shape.runGraph?.gates?.required ?? [])
			if (!gates.some((gate) => gate.startsWith(required))) fail(graphBox[0].line, `Run graph lacks a gate: ${required}`);
		for (const gate of gates)
			if (!(shape.runGraph?.gates?.allowed ?? []).some((allowed) => gate.startsWith(allowed)))
				fail(graphBox[0].line, `unknown gate "${gate}"`);
		// acyclic
		const state = new Map();
		const visit = (id, stack) => {
			if (state.get(id) === 1) return true;
			if (state.get(id) === 2) return false;
			state.set(id, 1);
			for (const [, to] of edges.filter(([from]) => from === id)) if (visit(to, [...stack, id])) return true;
			state.set(id, 2);
			return false;
		};
		for (const id of nodes.keys()) if (visit(id, [])) { fail(graphBox[0].line, "Run graph is cyclic"); break; }
	}
	if (!runGraph.body.some((line) => /^\*\*Critical path\.\*\*/.test(line.trim())))
		fail(runGraph.line, "Run graph lacks a Critical path line");
}

// ---------- PR section ----------
const prHead = prHeads[0];
if (prHead) {
	const pr = sections.get(prHead.title) ?? {
		title: prHead.title,
		line: prHead.line,
		body: lines.slice(prHead.line + 1, close ? close.line : lines.length),
		bodyStart: prHead.line + 1,
	};
	const subBlocks = [];
	for (let i = 0; i < pr.body.length; i++) {
		const match = pr.body[i].trim().match(/^\*\*([^*]+)\*\*(.*)$/);
		if (match && shape.pr.subBlocks.order.includes(match[1]))
			subBlocks.push({ name: match[1], rest: match[2].trim(), line: pr.bodyStart + i, index: i });
	}
	const names = subBlocks.map((block) => block.name);
	if (JSON.stringify(names) !== JSON.stringify(shape.pr.subBlocks.order))
		fail(pr.line, `sub-blocks are [${names.join(", ")}], expected [${shape.pr.subBlocks.order.join(", ")}]`);

	const blockBody = (name) => {
		const block = subBlocks.find((entry) => entry.name === name);
		if (!block) return null;
		const others = subBlocks.filter((entry) => entry.index > block.index).map((entry) => entry.index);
		const end = others.length ? Math.min(...others) : pr.body.length;
		return { ...block, lines: pr.body.slice(block.index + 1, end), start: pr.bodyStart + block.index + 1 };
	};
	const blockBoxes = (name) => {
		const block = blockBody(name);
		return block ? boxesIn(block.lines, block.start) : [];
	};
	const blockText = (name) => {
		const block = blockBody(name);
		return block ? [block.rest, ...block.lines].join("\n") : "";
	};

	// head lines
	for (const headLine of shape.pr.headLines ?? []) {
		const matches = pr.body
			.map((line, index) => ({ line: pr.bodyStart + index, text: line.trim() }))
			.filter((entry) => entry.text.startsWith(`${headLine.name}: `));
		if (matches.length !== 1) fail(pr.line, `expected exactly one ${headLine.name} line, found ${matches.length}`);
		else if (!headLine.pattern.test(matches[0].text)) fail(matches[0].line, `unknown ${headLine.name} "${matches[0].text}"`);
	}
	const surfaceMatch = pr.body.map((line) => line.trim()).find((line) => line.startsWith("Surface: "));
	const surface = surfaceMatch?.slice(9).trim() ?? "ui";

	// Files
	const filesBoxes = blockBoxes("Files.");
	if (filesBoxes.length < 1) fail(pr.line, "Files has no box");
	const filesPaths = [];
	for (const box of filesBoxes) {
		const match = box.body.match(/^(Create|Edit|Delete) `([^`]+)`\.?$/);
		if (!match) fail(box.line, `Files box is not "Create|Edit|Delete \`<path>\`": ${box.body}`);
		else filesPaths.push(match[2]);
	}

	// Build: lane table
	const build = blockBody("Build.");
	let laneTable = null;
	if (build) {
		const tables = tablesIn(build.lines, build.start);
		laneTable = tables.find((table) =>
			JSON.stringify(table.header.map((cell) => cell.replace(/`/g, ""))) === JSON.stringify(shape.pr.blocks["Build."].laneTable.columns.map((column) => column.header)));
		if (!laneTable) fail(build.line, `Build lacks the lane table with columns ${shape.pr.blocks["Build."].laneTable.columns.map((c) => c.header).join(" | ")}`);
		else {
			const columns = shape.pr.blocks["Build."].laneTable.columns;
			for (const row of laneTable.rows) {
				const record = {};
				columns.forEach((column, index) => { record[column.key] = (row[index] ?? "").replace(/`/g, "").trim(); });
				if (laneRows.some((existing) => existing.id === record.id)) fail(laneTable.start, `lane table repeats unit "${record.id}"`);
				for (const column of columns) {
					if (column.required && !record[column.key]) fail(laneTable.start, `lane row "${record.id}" lacks ${column.header}`);
					if (column.pattern && record[column.key] && !column.pattern.test(record[column.key]))
						fail(laneTable.start, `lane row "${record.id}" has an invalid ${column.header}`);
					if (column.validator && record[column.key]) {
						const result = validators[column.validator](record[column.key], { laneRows, readiness: readinessValues, spawnBound, record });
						for (const message of [].concat(result ?? [])) if (message) fail(laneTable.start, message);
					}
				}
				laneRows.push(record);
			}
			if (!laneRows.length) fail(laneTable.start, "lane table has no unit rows");
		}
		const proseBoxes = boxesIn(build.lines, build.start).filter((box) => !laneTable?.rows.some((row) => row.join("|").includes(box.body.slice(0, 10))));
		if (proseBoxes.length < 1) fail(build.line, "Build has no prose box");
		const mapBoxes = boxesIn(build.lines, build.start).filter((box) => /map update/i.test(box.body));
		const changeLine = pr.body.map((line) => line.trim()).find((line) => line.startsWith("Change: "));
		if (changeLine === "Change: user-facing") {
			if (!mapBoxes.length) fail(build.line, "Change user-facing requires a map update box");
			for (const box of mapBoxes) if (!/`[^`]*features\/[^`]*`/.test(box.body)) fail(box.line, "map update box names no backticked features/ path");
		} else if (mapBoxes.length) fail(build.line, "Change internal must not carry a map update box");
	}

	// cross rules
	const laneViolations = validators.laneCoverage(filesPaths, { laneRows });
	for (const message of [].concat(laneViolations ?? [])) if (message) fail(pr.line, message);
	const anchorViolations = validators.unitAnchorSet(unitIds, { laneRows });
	for (const message of [].concat(anchorViolations ?? [])) if (message) fail(pr.line, message);

	// block-level minimums
	for (const name of ["You see.", "Verify, unit.", "Verify, live.", "Review gate.", "Merge."])
		if (blockBoxes(name).length < 1) fail(pr.line, `${name} has no box`);
	if (!blockText("Verify, unit.").includes(shape.rule)) fail(pr.line, "Verify, unit. does not open with the rule");
	if (!blockText("Verify, live.").includes(shape.rule)) fail(pr.line, "Verify, live. does not open with the rule");
	if (!blockText("Verify, formal.").includes(shape.rule)) fail(pr.line, "Verify, formal. does not open with the rule");
	if (!blockText("Verify, perf.").includes(shape.rule)) fail(pr.line, "Verify, perf. does not open with the rule");

	// final-gate lanes
	const liveText = blockText("Verify, live.");
	if (!/Lanes on `[^`]+` at the PR head/.test(liveText)) fail(pr.line, "Verify, live lacks the Lanes declaration");
	const laneBoxes = blockBoxes("Verify, live.").map((box) => ({ ...box, match: box.body.match(/^Lane (\d+)\. /) })).filter((box) => box.match);
	const numbers = laneBoxes.map((box) => Number(box.match[1]));
	if (!numbers.length) fail(pr.line, "Verify, live has no lane");
	else if (numbers.join(",") !== numbers.map((_, index) => index + 1).join(","))
		fail(pr.line, `lanes are [${numbers.join(",")}], expected contiguous numbering from 1`);
	const artifact = shape.pr.blocks["Verify, live."].artifactBySurface[surface];
	for (const lane of laneBoxes) {
		if (!lane.body.includes("Live-only:")) fail(lane.line, `lane ${lane.match[1]} has no Live-only sentence`);
		const timeout = lane.body.match(/`Timeout (\d+)`/);
		if (!timeout) fail(lane.line, `lane ${lane.match[1]} names no backticked timeout`);
		else {
			const message = validators.laneTimeout(timeout[1], { spawnBound, lane: lane.match[1] });
			if (message) fail(lane.line, message);
		}
		if (!lane.body.includes("Pass when")) fail(lane.line, `lane ${lane.match[1]} has no pass predicate`);
		if (!/`[^`]+#[^`]+`/.test(lane.body)) fail(lane.line, `lane ${lane.match[1]} names no backticked feature entry`);
		if (artifact && !lane.body.includes(artifact.verb)) fail(lane.line, `lane ${lane.match[1]} names no ${artifact.noun}`);
		if (lane.match[1] === "1" && !["trunk", "head"].every((marker) => lane.body.toLowerCase().includes(marker)))
			fail(lane.line, "lane 1 must run the regression journey on trunk and head");
	}

	// formal
	const formal = readinessValues.Formal ?? "not-required";
	const formalText = blockText("Verify, formal.");
	const formalBoxes = blockBoxes("Verify, formal.");
	if (formal === "not-required") {
		if (!formalBoxes.some((box) => /^Not covered\.$/.test(box.body.trim()))) fail(pr.line, 'Formal not-required requires "Not covered."');
		if (formalBoxes.length > 1) fail(pr.line, 'Formal not-required allows only the "Not covered." box');
	} else {
		const items = shape.pr.blocks["Verify, formal."].items;
		for (const item of items) {
			const box = formalBoxes.find((entry) => entry.body.startsWith(item.name));
			if (!box) { fail(pr.line, `Verify, formal lacks "${item.name}"`); continue; }
			const body = box.body.slice(item.name.length).trim();
			if (item.body.re && !item.body.re.test(body)) fail(box.line, `${item.name} names no ${item.body.message}`);
			if (item.also && !item.also.re.test(body)) fail(box.line, `${item.name} names no ${item.also.message}`);
		}
		if (!formalText.includes(shape.rule)) fail(pr.line, "Verify, formal does not open with the rule");
	}

	// perf items order
	const perfBoxes = blockBoxes("Verify, perf.");
	const perfNames = perfBoxes.map((box) => (box.body.match(/^[A-Z][a-z]+\./) ?? [""])[0]);
	if (JSON.stringify(perfNames) !== JSON.stringify(shape.pr.blocks["Verify, perf."].items))
		fail(pr.line, `perf boxes are [${perfNames.join(", ")}], expected [${shape.pr.blocks["Verify, perf."].items.join(", ")}]`);

	// review gate
	const reviewText = blockText("Review gate.");
	if (!/reviewer/i.test(reviewText)) fail(pr.line, "Review gate names no reviewer");
	if (!/operator/i.test(reviewText)) fail(pr.line, "Review gate names no operator");
	const depth = shape.pr.blocks["Review gate."].reviewDepth;
	if (laneRows.length > depth.unitThreshold && !/area reviewer/i.test(reviewText))
		fail(pr.line, `above ${depth.unitThreshold} units the Review gate names the area split`);

	// merge
	if (blockBoxes("Merge.").length < 1) fail(pr.line, "Merge has no box");
}

// ---------- close ----------
if (close) {
	if (boxesIn(close.body, close.bodyStart).length < 1) fail(close.line, "Close the run has no box");
}

// ---------- report ----------
for (const line of lines.slice(0, 0)) void line;
const bound = spawnBound.unlimited ? "unlimited" : `${spawnBound.minutes} minutes`;
console.log(`${prHeads.length} PR sections, ${problems.length} problems, spawn bound ${bound}`);
for (const problem of problems) console.error(problem);
process.exit(problems.length ? 1 : 0);
