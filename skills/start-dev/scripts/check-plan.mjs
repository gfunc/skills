#!/usr/bin/env node
import fs from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const RULE =
	"Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";
const LANES = /Ten lanes on `[^`<>]+` at the PR head/;
const SURFACES = ["ui", "cli", "library", "backend"];
const DECISIONS = ["exists", "exists-stale", "create-after-first-drivable-batch", "create-before-amendment", "not-required"];
const FORMAL_DECISIONS = ["exists", "exists-stale", "create", "not-required"];
const READINESS_FIELDS = ["Decision", "Surface", "Drivability", "Boundary", "Evidence", "Skill", "Map", "Formal", "Formal property", "Owner"];
const FEATURE_ENTRY = /`[A-Za-z0-9][A-Za-z0-9_-]*#[A-Za-z0-9][A-Za-z0-9_-]*`/;
const MAP_UPDATE = /\bmap[- ]update\b|\bupdate(?:s|d|ing)?\b[^.\n]*\bfeature (?:map|entry)\b|\bfeature (?:map|entry)\b[^.\n]*\bupdate(?:s|d|ing)?\b/i;
const CREATION_TASK = /\bcreate-verification-skill\b/i;
const LANE_ARTIFACT = { ui: { re: /Save `[^`]+`/, name: "screenshot" }, cli: { re: /Log `[^`]+`/, name: "log" } };
const SUB_BLOCKS = [
	"Depends on.",
	"Files.",
	"Build.",
	"You see.",
	"Verify, unit.",
	"Verify, live.",
	"Verify, formal.",
	"Verify, perf.",
	"Review gate.",
	"Merge.",
];
const PROGRAM_H3 = ["Arm the program", "Spawn owners", "PR mechanics", "Verdict and merge", "Boot recipe"];
const PROGRAM_STATUS_MARKER = "status message";
const REMOTE_READ_MARKER = "git show origin/main:";
const PLUGIN_TOKEN = /`([^`\n]+)`/g;
const CONTINUATION_LINE = /^Continuation: \S/;
const HOW_TO_READ_MARKERS = [
	"One box is one unit of work",
	"names the evidence",
	"Check a box only when its evidence exists",
	"playbooks/",
	RULE,
];
const PERF_ITEMS = ["Metric.", "Probe.", "Baseline.", "Rule."];
const BOX = /^\s*- \[[ x]\] (.*)$/;

const file = process.argv[2];
if (!file) {
	console.error("Usage: node check-plan.mjs <plan.md>");
	process.exit(2);
}

const raw = fs.readFileSync(file, "utf8").split(/\r?\n/);
const problems = [];
const notes = [];
const fail = (line, message) => problems.push(`${file}:${line}: ${message}`);

let start = 0;
if (raw[0] === "---") {
	start = raw.indexOf("---", 1) + 1;
}

const lines = [];
let fence = null;
const openingFence = (text) => {
	const match = text.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
	if (!match || (match[1][0] === "`" && match[2].includes("`"))) return null;
	return { char: match[1][0], length: match[1].length };
};
const closingFence = (text, opening) => {
	const match = text.match(/^ {0,3}(`+|~+)[ \t]*$/);
	return Boolean(
		match &&
		match[1][0] === opening.char &&
		match[1].length >= opening.length,
	);
};
for (let i = start; i < raw.length; i++) {
	const text = raw[i];
	const n = i + 1;
	let code = Boolean(fence);
	if (fence && closingFence(text, fence)) {
		code = false;
		fence = null;
	} else if (!fence) {
		fence = openingFence(text);
		code = Boolean(fence);
	}
	lines.push({ n, text, code });
	if (code) continue;
	const prose = text
		.replace(/`[^`]*`/g, "`")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\]\([^)]*\)/g, "]");
	if (/[\u2013\u2014]/.test(prose)) fail(n, "long dash");
	if (/[\u2018\u2019\u201c\u201d]/.test(prose)) fail(n, "curly quote");
	const isSurfaceLine = /^Surface:\s*(ui|cli|library|backend)\s*$/.test(text.trim());
	const isChangeLine = /^Change:\s*(user-facing|internal)\s*$/.test(text.trim());
	const isContinuationLine = /^Continuation: \S/.test(text.trim());
	if (/: \S/.test(prose) && !isSurfaceLine && !isChangeLine && !isContinuationLine) fail(n, "mid-sentence colon");
}

const h2 = (l) => (!l.code && l.text.startsWith("## ") ? l.text.slice(3).trim() : null);
const sections = [];
for (const l of lines) {
	const title = h2(l);
	if (title !== null) sections.push({ title, n: l.n, body: [] });
	else if (sections.length) sections.at(-1).body.push(l);
}
const find = (title) => sections.find((s) => s.title === title);
const bodyText = (s) => s.body.map((l) => l.text).join("\n");
const boxes = (ls) => ls.filter((l) => !l.code && BOX.test(l.text)).map((l) => ({ n: l.n, text: l.text.match(BOX)[1] }));

const readiness = find("Verification readiness");
if (!readiness) fail(1, 'no "## Verification readiness" section');
const readinessFields = new Map();
const cellValue = (text) => {
	const value = text.trim();
	const ticked = value.match(/^`([^`]+)`$/);
	return (ticked ? ticked[1] : value).trim();
};
if (readiness) {
	for (const l of readiness.body) {
		if (l.code) continue;
		const match = l.text.match(/^\s*\|([^|]+)\|([^|]+)\|\s*$/);
		if (!match) continue;
		const name = match[1].trim();
		const value = cellValue(match[2]);
		if (name === "Field" || /^-+$/.test(name)) continue;
		if (readinessFields.has(name)) fail(l.n, `Verification readiness repeats table field "${name}"`);
		readinessFields.set(name, { value, n: l.n });
	}
	for (const name of READINESS_FIELDS) {
		if (!readinessFields.get(name)?.value) fail(readiness.n, `Verification readiness lacks table field "${name}"`);
	}
}
const readinessValue = (name) => readinessFields.get(name)?.value ?? "";
const readinessLine = (name) => readinessFields.get(name)?.n ?? readiness?.n ?? 1;
const decision = readinessValue("Decision");
const readinessSurface = readinessValue("Surface");
const formalDecision = readinessValue("Formal");
if (readiness && decision && !DECISIONS.includes(decision))
	fail(readinessLine("Decision"), `unknown Verification readiness Decision "${decision}" (expected ${DECISIONS.join("|")})`);
if (readiness && readinessSurface && !SURFACES.includes(readinessSurface))
	fail(readinessLine("Surface"), `unknown Verification readiness Surface "${readinessSurface}" (expected ${SURFACES.join("|")})`);
if (readiness && formalDecision && !FORMAL_DECISIONS.includes(formalDecision))
	fail(readinessLine("Formal"), `unknown Verification readiness Formal "${formalDecision}" (expected ${FORMAL_DECISIONS.join("|")})`);
if (decision === "exists") {
	for (const name of ["Skill", "Map"]) {
		const value = readinessValue(name);
		const candidates = [resolve(process.cwd(), value), resolve(dirname(file), value)];
		if (value && !candidates.some((candidate) => fs.existsSync(candidate)))
			fail(readinessLine(name), `Verification readiness ${name} path does not resolve: ${value}`);
	}
}
const maintenanceRoute = readinessValue("Maintenance route");
if (decision === "exists-stale" && (!maintenanceRoute || !maintenanceRoute.includes("maintain-verification-skill")))
	fail(readinessLine("Maintenance route"), "exists-stale requires a maintenance route");
if (formalDecision === "exists-stale" && (!maintenanceRoute || !maintenanceRoute.includes("maintain-formal-verification-skill")))
	fail(readinessLine("Maintenance route"), "Formal exists-stale requires a maintenance route");
if (formalDecision === "not-required" && readinessValue("Formal property") !== "none")
	fail(readinessLine("Formal property"), 'Formal not-required requires Formal property "none" so the design signal is none');
if (decision === "not-required" && readinessSurface && !["library", "backend"].includes(readinessSurface))
	fail(readinessLine("Decision"), "Verification readiness not-required is only allowed for library/backend surfaces");

const installedPluginPaths = (text) => {
	const tokens = [...text.matchAll(PLUGIN_TOKEN)].flatMap((match) => match[1].split(/\s+/));
	return [...new Set(tokens.filter((token) =>
		token.startsWith("/") &&
		token.includes("/plugins/") &&
		token.includes("/skills/") &&
		token.endsWith(".md") &&
		!token.includes("<") &&
		!token.includes(">") &&
		!token.includes("*")
	))];
};

const validateInstalledPluginPaths = (paths, line) => {
	for (const pluginPath of paths) {
		const at = pluginPath.indexOf("/skills/");
		const pluginDir = pluginPath.slice(0, at);
		if (!fs.existsSync(pluginDir)) {
			notes.push(`installed plugin root is not present, path not validated: ${pluginPath}`);
			continue;
		}
		if (!fs.existsSync(pluginPath)) {
			fail(line, `installed plugin file does not exist: ${pluginPath}`);
			continue;
		}
		if (!fs.statSync(pluginPath).isFile())
			fail(line, `installed plugin path is not a file: ${pluginPath}`);
	}
};

const h1 = lines.findIndex((l) => !l.code && l.text.startsWith("# "));
if (h1 === -1) fail(1, "no H1 title");
const howToRead = find("How to read this");
if (!howToRead) fail(1, 'no "## How to read this" section');
if (h1 !== -1 && howToRead) {
	const intro = lines.slice(h1 + 1).filter((l) => l.n < howToRead.n && l.text.trim() !== "");
	if (intro.length >= 10) fail(lines[h1].n, `intro is ${intro.length} lines, under ten required`);
	for (const marker of HOW_TO_READ_MARKERS) {
		if (!bodyText(howToRead).includes(marker)) fail(howToRead.n, `How to read this lacks "${marker}"`);
	}
}

const program = find("Program checklist");
if (!program) fail(1, 'no "## Program checklist" section');
else {
	const h3s = program.body.filter((l) => !l.code && l.text.startsWith("### ")).map((l) => l.text.slice(4).trim());
	let cursor = 0;
	for (const name of PROGRAM_H3) {
		const at = h3s.findIndex((t, i) => i >= cursor && t.startsWith(name));
		if (at === -1) fail(program.n, `Program checklist lacks "### ${name}" in order`);
		else cursor = at + 1;
	}
	const programText = bodyText(program);
	if (!programText.includes(PROGRAM_STATUS_MARKER))
		fail(program.n, `Program checklist lacks "${PROGRAM_STATUS_MARKER}"`);
	const pluginPaths = installedPluginPaths(programText);
	validateInstalledPluginPaths(pluginPaths, program.n);
	const hasRemoteRead = programText.includes(REMOTE_READ_MARKER);
	if (!hasRemoteRead && pluginPaths.length === 0)
		fail(program.n, `Program checklist lacks a read source: "${REMOTE_READ_MARKER}" or an installed plugin path`);
	if (!hasRemoteRead && pluginPaths.length && /Re-read the execution playbook from trunk/.test(programText))
		fail(program.n, "tick prompt reads the playbook from trunk; name the installed plugin path");
	if (!program.body.some((l) => !l.code && CONTINUATION_LINE.test(l.text.trim())))
		fail(program.n, "Program checklist lacks a \"Continuation: <mechanism>\" line naming the active profile's continuation mechanism");
}

if (readiness && program && sections.indexOf(readiness) > sections.indexOf(program))
	fail(readiness.n, 'Verification readiness must precede "## Program checklist"');
if (readiness && howToRead && sections.indexOf(readiness) < sections.indexOf(howToRead))
	fail(readiness.n, 'Verification readiness must follow "## How to read this"');

let graph = null;
const runGraph = find("Run graph");
if (!runGraph) fail(1, 'no "## Run graph" section');
else {
	const fence = runGraph.body.find((l) => l.code && l.text.trim().startsWith("```mermaid"));
	if (!fence) fail(runGraph.n, 'Run graph lacks a ```mermaid block');
	else {
		const lines = runGraph.body.filter((l) => l.code);
		const text = lines.map((l) => l.text).join("\n");
		if (!/^\s*graph TD\s*$/m.test(text)) fail(fence.n, "Run graph must declare graph TD");
		const tasks = [...text.matchAll(/\[(?:task|pr|feature): [^\]]+\]/g)].map((m) => m[0]);
		if (tasks.length === 0) fail(fence.n, "Run graph has no task, pr, or feature node");
		for (const task of tasks) {
			if (!/ lane [^\]]+/.test(task)) fail(fence.n, `Run graph node ${task} has no file lane`);
		}
		const gates = [...text.matchAll(/\[gate: ([^\]]+)\]/g)].map((m) => m[1]);
		if (!gates.includes("feature")) fail(fence.n, 'Run graph lacks the feature gate node "[gate: feature]"');
		if (!gates.includes("review")) fail(fence.n, 'Run graph lacks the review gate node "[gate: review]"');
		const waves = [...text.matchAll(/subgraph W\d+\[/g)];
		if (waves.length === 0) fail(fence.n, "Run graph has no wave subgraph W<n>");
		const nodes = new Set();
		const graphNodes = new Map();
		const edges = [];
		let currentWave = null;
		for (const line of lines) {
			const subgraph = line.text.match(/^\s*subgraph\s+([A-Za-z0-9_-]+)(?:\[[^\]]*\])?/);
			if (subgraph) currentWave = subgraph[1];
			else if (/^\s*end\s*$/.test(line.text)) currentWave = null;
			for (const match of line.text.matchAll(/([A-Za-z0-9_-]+)\[((?:task|pr|feature|gate): [^\]]+)\]/g)) {
				const previous = graphNodes.get(match[1]);
				graphNodes.set(match[1], {
					id: match[1],
					label: match[2],
					kind: match[2].slice(0, match[2].indexOf(":")),
					n: line.n,
					wave: previous?.wave ?? currentWave,
				});
			}
			const m = line.text.match(/^\s*([A-Za-z0-9_-]+)(?:\[[^\]]*\])?\s*-->(?:\|([^|]*)\|)?\s*([A-Za-z0-9_-]+)/);
			if (m) {
				nodes.add(m[1]); nodes.add(m[3]); edges.push([m[1], m[3]]);
			} else {
				const decl = line.text.match(/^\s*([A-Za-z0-9_-]+)\[/);
				if (decl) nodes.add(decl[1]);
			}
		}
		graph = { nodes: [...graphNodes.values()], edges };
		const color = new Map();
		const stack = [...nodes];
		const state = new Map();
		let cyclic = false;
		const visit = (id) => {
			if (state.get(id) === 1) { cyclic = true; return; }
			if (state.get(id) === 2) return;
			state.set(id, 1);
			for (const [from, to] of edges) if (from === id) visit(to);
			state.set(id, 2);
		};
		for (const id of stack) visit(id);
		if (cyclic) fail(fence.n, "Run graph is cyclic");
		if (!runGraph.body.some((l) => !l.code && (/^\*\*Critical path\.\*\*/.test(l.text.trim()) || l.text.trim().startsWith("Critical path:"))))
			fail(runGraph.n, 'Run graph section lacks a "Critical path" line');
	}
}

const close = find("Close the program");
if (!close) fail(1, 'no "## Close the program" section');
const programIndex = sections.indexOf(program);
const closeIndex = sections.indexOf(close);
const runGraphIndex = sections.indexOf(runGraph);
const prSections = programIndex === -1 || closeIndex === -1
  ? []
  : sections.slice(programIndex + 1, closeIndex).filter((s) => s !== runGraph);
if (prSections.length === 0) fail(1, "no PR sections between Program checklist and Close the program");

const report = [];
const prInfo = [];
for (const pr of prSections) {
	const heads = [];
	for (const l of pr.body) {
		if (l.code) continue;
		const m = l.text.match(/^\*\*([^*]+)\*\*(.*)$/);
		if (m && SUB_BLOCKS.includes(m[1])) heads.push({ name: m[1], n: l.n, rest: m[2].trim(), lines: [] });
		else if (heads.length) heads.at(-1).lines.push(l);
	}
	const names = heads.map((h) => h.name);
	if (names.join("|") !== SUB_BLOCKS.join("|")) {
		fail(pr.n, `${pr.title}: sub-blocks are [${names.join(", ")}], expected [${SUB_BLOCKS.join(", ")}]`);
	}
	const block = (name) => heads.find((h) => h.name === name);
	const counts = {};
	for (const h of heads) counts[h.name] = boxes(h.lines).length;

	let surface = "ui";
	const surfaceLines = pr.body.filter((l) => !l.code && /^Surface:/.test(l.text.trim()));
	if (surfaceLines.length > 1) fail(surfaceLines[1].n, `${pr.title}: more than one Surface line`);
	if (surfaceLines.length) {
		const value = surfaceLines[0].text.trim().replace(/^Surface:\s*/, "");
		if (!SURFACES.includes(value)) fail(surfaceLines[0].n, `${pr.title}: unknown Surface "${value}" (expected ${SURFACES.join("|")})`);
		else surface = value;
	}

	const changeLines = pr.body.filter((l) => !l.code && /^Change:/.test(l.text.trim()));
	let change = LANE_ARTIFACT[surface] ? "user-facing" : "internal";
	if (changeLines.length > 1) fail(changeLines[1].n, `${pr.title}: more than one Change line`);
	if (changeLines.length === 0) fail(pr.n, `${pr.title}: no Change line`);
	else {
		const value = changeLines[0].text.trim().replace(/^Change:\s*/, "");
		if (!["user-facing", "internal"].includes(value)) fail(changeLines[0].n, `${pr.title}: unknown Change "${value}" (expected user-facing|internal)`);
		else change = value;
	}
	const mapUpdates = boxes(pr.body).filter((b) => MAP_UPDATE.test(b.text));
	if (change === "user-facing" && mapUpdates.length === 0)
		fail(changeLines[0]?.n ?? pr.n, `${pr.title}: Change user-facing requires a map-update box`);
	if (change === "internal" && mapUpdates.length > 0)
		fail(mapUpdates[0].n, `${pr.title}: Change internal must not carry a map-update box`);

	const depends = block("Depends on.");
	if (depends && depends.rest === "") fail(depends.n, `${pr.title}: Depends on names nothing`);
	for (const name of ["Files.", "Build.", "You see.", "Verify, unit.", "Merge."]) {
		const b = block(name);
		if (b && boxes(b.lines).length === 0) fail(b.n, `${pr.title}: ${name} has no box`);
	}
	for (const name of ["Verify, unit.", "Verify, live.", "Verify, perf."]) {
		const b = block(name);
		if (b && !b.rest.startsWith(RULE)) fail(b.n, `${pr.title}: ${name} does not open with the rule`);
	}

	const live = block("Verify, live.");
	if (live) {
		const artifact = LANE_ARTIFACT[surface];
		if (artifact) {
			if (!LANES.test(live.rest)) fail(live.n, `${pr.title}: Verify, live lacks "Ten lanes on \`<swarm workers model>\` at the PR head" with the model filled in`);
			const lanes = boxes(live.lines).map((b) => ({ ...b, m: b.text.match(/^Lane (\d+)\. /) }));
			const numbers = lanes.filter((b) => b.m).map((b) => Number(b.m[1])).sort((a, b) => a - b);
			if (numbers.join(",") !== "1,2,3,4,5,6,7,8,9,10") fail(live.n, `${pr.title}: lanes are [${numbers.join(",")}], expected 1 to 10`);
			for (const lane of lanes) {
				if (!lane.m) fail(lane.n, `${pr.title}: live box is not a lane`);
				else if (!artifact.re.test(lane.text)) fail(lane.n, `${pr.title}: lane ${lane.m[1]} names no ${artifact.name}`);
				else if (!lane.text.includes("Pass when")) fail(lane.n, `${pr.title}: lane ${lane.m[1]} has no pass predicate`);
				if (lane.m && !FEATURE_ENTRY.test(lane.text))
					fail(lane.n, `${pr.title}: lane ${lane.m[1]} names no backticked <feature-id>#<sub-id> feature entry`);
				if (lane.m?.[1] === "1" && !(["regression", "trunk", "head", "load-bearing"].every((marker) => lane.text.toLowerCase().includes(marker))))
					fail(lane.n, `${pr.title}: lane 1 does not name the regression journey on trunk and head`);
			}
		} else if (boxes(live.lines).length === 0) {
			fail(live.n, `${pr.title}: Verify, live has no box`);
		}
	}

	let formalCovered = false;
	const formal = block("Verify, formal.");
	if (!formal) {
		if (["create", "exists"].includes(formalDecision)) fail(pr.n, `${pr.title}: Formal ${formalDecision} requires a Verify, formal block`);
		else fail(pr.n, `${pr.title}: Verify, formal block is required`);
	} else {
		const formalBoxes = boxes(formal.lines);
		const notCovered =
			(formal.rest === "Not covered." && formalBoxes.length === 0) ||
			(formal.rest === "" && formalBoxes.length === 1 && formalBoxes[0].text === "Not covered.");
		if (formalDecision === "not-required") {
			if (!notCovered) fail(formal.n, `${pr.title}: Formal not-required requires "Not covered." only`);
		} else if (!notCovered) {
			formalCovered = true;
			const items = formalBoxes.map((b) => b.text.split(" ")[0]);
			for (const name of ["Command.", "Property.", "Covered.", "Run."]) {
				if (!items.includes(name)) fail(formal.n, `${pr.title}: Verify, formal lacks "${name}" box`);
			}
		}
	}

	const perf = block("Verify, perf.");
	if (perf) {
		const items = boxes(perf.lines).map((b) => b.text.split(" ")[0]);
		if (items.join("|") !== PERF_ITEMS.join("|")) fail(perf.n, `${pr.title}: perf boxes are [${items.join(", ")}], expected [${PERF_ITEMS.join(", ")}]`);
	}

	const gate = block("Review gate.");
	if (gate) {
		if (!LANE_ARTIFACT[surface] && !gate.rest.startsWith("None.")) {
			fail(gate.n, `${pr.title}: Review gate must be "None. <PR id> is not review-gated." for ${surface} surfaces`);
		}
		const gateBoxes = boxes(gate.lines);
		if (gate.rest.startsWith("None.")) {
			if (gateBoxes.length) fail(gate.n, `${pr.title}: Review gate says None but has boxes`);
		} else {
			const text = gate.lines.map((l) => l.text).join("\n");
			if (gateBoxes.length === 0) fail(gate.n, `${pr.title}: Review gate has no box`);
			for (const word of ["screenshot", "video", "operator"]) {
				if (!text.includes(word)) fail(gate.n, `${pr.title}: Review gate lacks "${word}"`);
			}
		}
	}

	prInfo.push({ pr, surface, change, formalCovered });
	const total = boxes(pr.body).length;
	const cells = SUB_BLOCKS.filter((s) => s !== "Depends on.").map((s) => `${s.replace(/[ ,.]+/g, "-").replace(/-$/, "").toLowerCase()}=${counts[s] ?? 0}`);
	report.push(`${pr.title}  boxes=${total}  ${cells.join(" ")}`);
}

const prKey = (text) => {
	const clean = text.replace(/^(?:pr|feature):\s*/, "").trim();
	const match = clean.match(/\bPR[ -]?([A-Za-z0-9_-]+)/i);
	return (match ? match[1] : clean).toLowerCase();
};
const graphPrNode = (pr) => graph?.nodes.find((node) =>
	["pr", "feature"].includes(node.kind) && prKey(node.label) === prKey(pr.title),
) ?? null;
const hasEdge = (from, to) => Boolean(graph?.edges.some(([source, target]) => source === from && target === to));
for (const info of prInfo) info.graphNode = graphPrNode(info.pr);
const livePrs = prInfo.filter((info) => ["ui", "cli"].includes(info.surface));
if (decision === "not-required" && livePrs.length > 0 && !["ui", "cli"].includes(readinessSurface))
	fail(readinessLine("Decision"), "Verification readiness not-required is only allowed for library/backend surfaces");

if (["create-after-first-drivable-batch", "create-before-amendment"].includes(decision)) {
	const carrier = decision === "create-before-amendment" ? livePrs[0] : livePrs.at(-1);
	const creationTasks = graph?.nodes.filter((node) => node.kind === "task" && CREATION_TASK.test(node.label)) ?? [];
	if (!carrier) fail(readinessLine("Decision"), `${decision} requires a ui/cli carrier PR`);
	if (creationTasks.length === 0)
		fail(readinessLine("Decision"), `${decision} requires a folded create-verification-skill task`);
	for (const task of creationTasks) {
		if (!/\slane\s+\S+/.test(task.label)) fail(task.n, "create-verification-skill task has no file lane");
	}
	const carrierNode = carrier ? graphPrNode(carrier.pr) : null;
	if (carrier && creationTasks.length > 0 && !carrierNode)
		fail(carrier.pr.n, `${carrier.pr.title}: creation carrier has no pr or feature node in Run graph`);
	else if (carrierNode && creationTasks.length > 0 && !creationTasks.some((task) => task.wave === carrierNode.wave))
		fail(readinessLine("Decision"), `${decision} requires a folded create-verification-skill task in ${carrier.pr.title}'s wave`);

	if (decision === "create-before-amendment") {
		const verificationGate = graph?.nodes.find((node) => node.kind === "gate" && node.label === "gate: verification");
		if (!verificationGate)
			fail(runGraph?.n ?? readinessLine("Decision"), 'Run graph lacks the verification gate node "[gate: verification]"');
		else {
			if (carrierNode && !hasEdge(carrierNode.id, verificationGate.id))
				fail(verificationGate.n, `verification gate does not follow carrier ${carrier.pr.title}`);
			const carrierIndex = livePrs.indexOf(carrier);
			for (const later of livePrs.slice(carrierIndex + 1)) {
				const laterNode = graphPrNode(later.pr);
				if (!laterNode) fail(later.pr.n, `${later.pr.title}: later ui/cli PR has no pr or feature node in Run graph`);
				else if (!hasEdge(verificationGate.id, laterNode.id))
					fail(verificationGate.n, `verification gate has no edge into later ui/cli ${later.pr.title}`);
			}
		}
	}
}

if (decision === "create-after-first-drivable-batch" && close) {
	const closeBoxes = boxes(close.body);
	const skillPath = readinessValue("Skill");
	if (!closeBoxes.some((b) => (b.text.includes(skillPath) || /verification skill/i.test(b.text)) && /\bexists?\b/i.test(b.text)))
		fail(close.n, "create-after-first-drivable-batch requires Close the program to assert that the verification skill exists");
	if (!closeBoxes.some((b) => /\b(?:prove[- ]once|proved once|proven once)\b/i.test(b.text)))
		fail(close.n, "create-after-first-drivable-batch requires Close the program to assert prove-once evidence");
}

if (["create", "exists"].includes(formalDecision)) {
	const formalGate = graph?.nodes.find((node) => node.kind === "gate" && node.label === "gate: formal");
	if (!formalGate) fail(runGraph?.n ?? readinessLine("Formal"), 'Run graph lacks the formal gate node "[gate: formal]"');
	const coveredPrs = prInfo.filter((info) => info.formalCovered);
	if (coveredPrs.length === 0)
		fail(readinessLine("Formal"), `Formal ${formalDecision} requires at least one covered-code PR to run the formal check`);
	else if (formalGate) {
		const firstNode = graphPrNode(coveredPrs[0].pr);
		if (!firstNode) fail(coveredPrs[0].pr.n, `${coveredPrs[0].pr.title}: formal covered-code PR has no pr or feature node in Run graph`);
		else if (!hasEdge(firstNode.id, formalGate.id))
			fail(formalGate.n, `formal gate does not follow first covered-code ${coveredPrs[0].pr.title}`);
		for (const later of coveredPrs.slice(1)) {
			const laterNode = graphPrNode(later.pr);
			if (!laterNode) fail(later.pr.n, `${later.pr.title}: later formal covered-code PR has no pr or feature node in Run graph`);
			else if (!hasEdge(formalGate.id, laterNode.id))
				fail(formalGate.n, `formal gate has no edge into later covered-code ${later.pr.title}`);
		}
	}
}

if (closeIndex !== -1) {
	const tail = sections.slice(closeIndex + 1);
	for (const s of tail) {
		if (!s.title.startsWith("Appendix")) fail(s.n, `"## ${s.title}" after Close the program is not an appendix`);
	}
	if (!tail.some((s) => s.title.includes("Prototype evidence"))) fail(close.n, 'no "## Appendix ... Prototype evidence" section');
}

for (const line of report) console.log(line);
console.log(`${prSections.length} PR sections, ${problems.length} problems`);
for (const p of problems) console.error(p);
for (const note of notes) console.error(`note: ${note}`);
process.exit(problems.length ? 1 : 0);
