// The one statement of a plan's shape. check-plan.mjs resolves this registry and
// walks it to validate a plan; emit-plan renders the authoring shell from it via
// renderShell. One shape, current only: no versions and no contract line.

export const RULE =
	"Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";

export const SURFACES = ["ui", "cli", "library", "backend"];
export const DECISIONS = [
	"exists",
	"exists-stale",
	"create-after-first-drivable-batch",
	"create-before-amendment",
	"not-required",
];
export const FORMAL_DECISIONS = ["exists", "exists-stale", "create", "not-required"];
export const DRIVABILITY_STATES = ["drivable", "drivable-with-boundary", "not-drivable"];

// Unit anchor. One uppercase letter then alphanumerics: covers the plan's own
// ids (T1, T6, T10A, U3), stays a legal mermaid node id, and rejects t1, 1T,
// T-1 and T_1.
export const UNIT_ID_SOURCE = "^[A-Z][A-Za-z0-9]+$";
export const UNIT_ID = new RegExp(UNIT_ID_SOURCE);

export const READINESS_FIELDS = [
	"Decision",
	"Surface",
	"Drivability",
	"Boundary",
	"Evidence",
	"Driver proof",
	"Isolation",
	"Gate duration",
	"Skill",
	"Map",
	"Formal",
	"Formal property",
	"Maintenance route",
	"Owner",
];
export const PR_HEAD_LINES = ["Surface", "Change"];
export const SUB_BLOCKS = [
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
export const LANE_TABLE_COLUMNS = ["Unit", "Deliverable", "File lane", "Worktree", "Scoped tests", "Budget", "Depends on"];
export const FORMAL_ITEMS = ["Command.", "Property.", "Covered.", "Run."];
export const PERF_ITEMS = ["Metric.", "Probe.", "Baseline.", "Rule."];

const REGEX_SPECIAL = /[.+^${}()|[\]\\?]/;
const globToRegExp = (glob) => {
	let source = "";
	for (let i = 0; i < glob.length; i++) {
		const ch = glob[i];
		if (ch === "*") {
			if (glob[i + 1] === "*") {
				source += ".*";
				i++;
			} else {
				source += "[^/]*";
			}
		} else {
			source += REGEX_SPECIAL.test(ch) ? `\\${ch}` : ch;
		}
	}
	return new RegExp(`^${source}${glob.endsWith("/") ? "" : "$"}`);
};

// Validators carry the signature (value, ctx) and return null when the value
// passes. Scalar validators return one message string; collection validators
// return an array of messages. The driver prefixes every message with its own
// location. The ctx keys each validator reads are named in its body.
export const validators = {
	unitId(value) {
		return UNIT_ID.test(value) ? null : `unit id "${value}" does not match /${UNIT_ID_SOURCE}/`;
	},
	readinessEvidence(value) {
		if (!/`[^`]+`/.test(value)) return "must name the launch or e2e command in backticks";
		if (!/\bready\b/i.test(value)) return "must name the ready signal";
		if (!/\bjourneys?\b/i.test(value)) return "must name one driven journey";
		if (!/\d{4}-\d{2}-\d{2}/.test(value)) return "must carry the timestamp";
		return null;
	},
	driverProof(value, ctx) {
		if (ctx.readiness.Decision !== "exists") return null;
		if (!value || /^none$/i.test(value)) return "exists requires driver proof, not none";
		if (!/known-bad|control/i.test(value)) return "must name the known-bad control";
		return null;
	},
	isolation(value) {
		return /single-stack|per-lane/i.test(value) ? null : "must be single-stack or per-lane";
	},
	gateDuration(value) {
		return /\d/.test(value) ? null : "must carry minutes per layer";
	},
	// A spawn duration in whole minutes. ctx.spawnBound is { minutes } or
	// { unlimited: true }. ctx.record, when present, names the lane-table row.
	spawnMinutes(value, ctx) {
		if (!/^[1-9]\d*$/.test(value)) return "must be a positive whole number of minutes";
		if (!ctx.spawnBound || ctx.spawnBound.unlimited) return null;
		return Number(value) > ctx.spawnBound.minutes
			? `${value} minutes exceeds the spawn bound of ${ctx.spawnBound.minutes}`
			: null;
	},
	unitBudget(value, ctx) {
		const message = validators.spawnMinutes(value, ctx);
		if (!message) return null;
		const id = ctx.record?.id ?? "unit";
		return `unit "${id}" budget ${message}`;
	},
	laneTimeout(value, ctx) {
		const message = validators.spawnMinutes(value, ctx);
		if (!message) return null;
		return `lane ${ctx.lane ?? "?"} timeout ${message}`;
	},
	formalProperty(value, ctx) {
		if (ctx.readiness.Formal === "not-required" && value !== "none")
			return 'Formal not-required requires Formal property "none"';
		return null;
	},
	maintenanceRoute(value, ctx) {
		const route = value ?? "";
		if (ctx.readiness.Decision === "exists-stale" && !route.includes("maintain-verification-skill"))
			return "Decision exists-stale requires a maintain-verification-skill route";
		if (ctx.readiness.Formal === "exists-stale" && !route.includes("maintain-formal-verification-skill"))
			return "Formal exists-stale requires a maintain-formal-verification-skill route";
		return null;
	},
	resolvablePath(value, ctx) {
		if (ctx.readiness.Decision !== "exists") return null;
		return ctx.exists(value) ? null : `path does not resolve: ${value}`;
	},
	unitNodeLabel(label) {
		const match = label.match(/^unit: (\S+) (.+) lane (\S+)$/);
		if (!match) return 'unit node label is not "unit: <id> <deliverable> lane <glob>"';
		return validators.unitId(match[1]);
	},
	filesBoxes(value) {
		const problems = [];
		for (const box of value) {
			if (!/^(Create|Edit|Delete) `[^`]+`\.?$/.test(box))
				problems.push(`Files box is not "Create|Edit|Delete \`<path>\`" with exactly one path: ${box}`);
		}
		return problems;
	},
	globToRegExp,
	laneCoversPath(lane, path) {
		return lane
			.split(",")
			.map((glob) => glob.trim())
			.filter(Boolean)
			.some((glob) => globToRegExp(glob).test(path));
	},
	laneCoverage(value, ctx) {
		const problems = [];
		for (const path of value) {
			const covered = ctx.laneRows.some((row) => validators.laneCoversPath(row.fileLane, path));
			if (!covered) problems.push(`Files path falls inside no unit file lane: ${path}`);
		}
		return problems;
	},
	unitAnchorSet(value, ctx) {
		const problems = [];
		const rowIds = ctx.laneRows.map((row) => row.id);
		for (const id of value) if (!rowIds.includes(id)) problems.push(`Run graph unit "${id}" has no lane table row`);
		for (const id of rowIds) if (!value.includes(id)) problems.push(`lane table unit "${id}" has no Run graph unit node`);
		return problems;
	},
	dependsOnIds(value, ctx) {
		if (/^none$/i.test(value.trim())) return [];
		const problems = [];
		for (const id of value.split(",").map((id) => id.trim()).filter(Boolean)) {
			if (!ctx.laneRows.some((row) => row.id === id)) problems.push(`depends on names unknown unit "${id}"`);
		}
		return problems;
	},
};

export const shape = {
	rule: RULE,

	// Doc-wide rules. The driver owns fence tracking and applies these to prose
	// only, after stripping backticked spans.
	documentRules: {
		longDash: { re: /[\u2013\u2014]/, message: "long dash" },
		curlyQuote: { re: /[\u2018\u2019\u201c\u201d]/, message: "curly quote" },
		midSentenceColon: {
			re: /: \S/,
			message: "mid-sentence colon",
			lineExceptions: [/^Surface:/, /^Change:/, /^Continuation:/],
			// A lane's required `Live-only:` sentence; the driver neutralizes
			// these spans before testing, as backticked spans are stripped.
			neutralize: ["Live-only:"],
		},
	},

	title: {
		kind: "h1",
		required: true,
		intro: { maxLines: 10, beforeSection: "How to read this" },
	},

	sections: {
		// "{pr}" marks the PR section's position; its heading pattern is below.
		order: ["How to read this", "Verification readiness", "Run graph", "{pr}", "Close the run"],
		forbiddenHeadings: [
			"Program checklist",
			"Arm the program",
			"Spawn owners",
			"PR mechanics",
			"Verdict and merge",
			"Boot recipe",
		],
		prSection: {
			placeholder: "## <PR title> (<PR id>)",
			pattern: /^## \S.* \([^)]+\)$/,
			exactlyOne: true,
			between: ["Run graph", "Close the run"],
		},
		afterClose: { appendicesOnly: true, firstAppendixIncludes: "Prototype evidence" },
	},

	howToRead: {
		required: true,
		markers: [
			"One box is one unit of work",
			"names the evidence",
			"Check a box only when its evidence exists",
			"playbooks/",
			RULE,
		],
	},

	readiness: {
		required: true,
		after: "How to read this",
		table: {
			header: ["Field", "Value"],
			noRepeatedFields: true,
			fields: [
				{ name: "Decision", required: true, enum: DECISIONS },
				{ name: "Surface", required: true, enum: SURFACES },
				{ name: "Drivability", required: true, enum: DRIVABILITY_STATES },
				{ name: "Boundary", required: true },
				{ name: "Evidence", required: true, validator: "readinessEvidence" },
				{ name: "Driver proof", required: true, validator: "driverProof" },
				{ name: "Isolation", required: true, validator: "isolation" },
				{ name: "Gate duration", required: true, validator: "gateDuration" },
				{ name: "Skill", required: true, validator: "resolvablePath" },
				{ name: "Map", required: true, validator: "resolvablePath" },
				{ name: "Formal", required: true, enum: FORMAL_DECISIONS },
				{ name: "Formal property", required: true, validator: "formalProperty" },
				{ name: "Maintenance route", required: true, validator: "maintenanceRoute" },
				{ name: "Owner", required: true },
			],
		},
		conditional: [
			{ when: 'Decision = "exists"', requires: ["a driver proof that names the known-bad control", "Skill and Map paths that resolve"] },
			{ when: 'Decision = "not-required"', requires: ["Surface is library or backend"] },
			{ when: 'Formal = "not-required"', requires: ['Formal property is "none"'] },
			{ when: 'Decision or Formal = "exists-stale"', requires: ["a Maintenance route naming the maintain skill"] },
		],
	},

	runGraph: {
		required: true,
		mermaid: { required: true, declares: "graph TD" },
		nodeKinds: ["unit", "pr", "gate"],
		unitNode: { labelPrefix: "unit: ", validator: "unitNodeLabel", laneRequired: true },
		prNode: { exactlyOne: true, labelPattern: /^pr: \S/ },
		gates: { required: ["final"], allowed: ["final", "review", "formal"] },
		forbidden: { waveSubgraphs: /subgraph W\d+\[/ },
		acyclic: true,
		criticalPath: { required: true },
	},

	pr: {
		headLines: [
			{ name: "Surface", pattern: /^Surface: (ui|cli|library|backend)$/, enum: SURFACES, exactlyOne: true },
			{ name: "Change", pattern: /^Change: (user-facing|internal)$/, enum: ["user-facing", "internal"], exactlyOne: true },
		],
		subBlocks: { order: SUB_BLOCKS, exact: true },
		blocks: {
			"Depends on.": { rest: { required: true, notEmpty: true, message: "Depends on names nothing" } },
			"Files.": {
				minBoxes: 1,
				onePathPerBox: true,
				boxPattern: /^(Create|Edit|Delete) `[^`]+`\.?$/,
				kinds: ["Create", "Edit", "Delete"],
				validator: "filesBoxes",
				crossRules: [
					{
						name: "laneCoverage",
						validator: "laneCoverage",
						rule: "every Files path falls inside some lane table row's file lane",
					},
				],
			},
			"Build.": {
				order: ["laneTable", "proseBoxes"],
				proseBoxes: { min: 1 },
				mapUpdateBox: {
					requiredWhen: 'Change = "user-facing"',
					forbiddenWhen: 'Change = "internal"',
					naming: "a backticked features/ entry path",
				},
				laneTable: {
					oneRowPerUnit: true,
					columns: [
						{ key: "id", header: "Unit", required: true, pattern: UNIT_ID, patternSource: UNIT_ID_SOURCE, validator: "unitId" },
						{ key: "deliverable", header: "Deliverable", required: true },
						{ key: "fileLane", header: "File lane", required: true },
						{ key: "worktree", header: "Worktree", required: true },
						{ key: "scopedTests", header: "Scoped tests", required: true },
						{ key: "budget", header: "Budget", required: true, validator: "unitBudget" },
						{ key: "dependsOn", header: "Depends on", required: true, validator: "dependsOnIds" },
					],
				},
				crossRules: [
					{
						name: "unitAnchorSet",
						validator: "unitAnchorSet",
						rule: "Run graph unit ids and lane table row ids are the same set",
					},
				],
			},
			"You see.": { minBoxes: 1 },
			"Verify, unit.": { ruleRest: true, minBoxes: 1 },
			"Verify, live.": {
				ruleRest: true,
				lanesDeclaration: "Lanes on `<model>` at the PR head",
				laneCountRule: "one per changed feature entry plus regression",
				minLanes: 1,
				numbering: "contiguous from 1",
				lane1: "the regression journey on trunk and head",
				perLane: {
					liveOnly: "a `Live-only:` sentence",
					passPredicate: "a `Pass when` predicate",
					featureEntry: "a backticked `<feature-id>#<sub-id>` entry",
						timeout: "a backticked `Timeout <minutes>`",
				},
				artifactBySurface: {
					ui: { verb: "Save", noun: "screenshot" },
					cli: { verb: "Log", noun: "transcript" },
					library: null,
					backend: null,
				},
			},
			"Verify, formal.": {
				ruleRest: true,
				byDecision: {
					create: { items: FORMAL_ITEMS },
					exists: { items: FORMAL_ITEMS },
					"exists-stale": {
						items: FORMAL_ITEMS,
						requires: ["a maintain-formal-verification-skill route in Verification readiness"],
					},
					"not-required": { items: ["Not covered."], only: true },
				},
				items: [
					{ name: "Command.", body: { re: /`[^`]+`/, message: "backticked command" } },
					{ name: "Property.", body: { re: /\S+/, message: "one-sentence property" } },
					{ name: "Covered.", body: { re: /`[^`]+`/, message: "backticked covered files or functions" } },
					{ name: "Run.", body: { re: /`[^`]+`/, message: "evidence path" }, also: { re: /pass when/i, message: "pass predicate" } },
				],
			},
			"Verify, perf.": { ruleRest: true, items: PERF_ITEMS, orderExact: true },
			"Review gate.": {
				minBoxes: 1,
				words: ["reviewer", "operator"],
				reviewDepth: {
					unitThreshold: 8,
					lineThreshold: 1500,
					above: "one area reviewer per unit group and one aggregating lead, both named in the plan",
					atOrBelow: "one reviewer",
				},
			},
			"Merge.": {
				minBoxes: 1,
				rule: "squash-merge on a clean verdict and green CI on the merge result",
				patchIdRule: "a rebase keeps the patch-id",
			},
		},
	},

	close: {
		title: "Close the run",
		required: true,
		content: "close assertions",
		minBoxes: 1,
		asserts: [
			"every unit merged with its evidence",
			"every changed user-facing behavior has its feature entry and at least one lane",
			"a created verify skill is proved once",
			"the report the execution playbook names reaches the operator",
		],
	},

	appendices: {
		afterCloseOnly: true,
		firstRequired: "Prototype evidence",
		titles: [
			"Appendix A. Prototype evidence",
			"Appendix B. Alternatives rejected",
			"Appendix C. Risks",
			"Appendix D. Links and reading list",
		],
	},
};

export default shape;

const READINESS_SHELL = {
	Decision: `<exists|exists-stale|create-after-first-drivable-batch|create-before-amendment|not-required>`,
	Drivability: `<drivable|drivable-with-boundary|not-drivable>`,
	Boundary: `<none, or the shared boundary each unit stays inside>`,
	Evidence: `<launch command, ready signal, one journey, timestamp>`,
	"Driver proof": `<one mapped journey plus one known-bad control at the head, or none>`,
	Isolation: `<single-stack at its fixed ports, or per-lane namespaces>`,
	"Gate duration": `<unit, live, formal, perf in minutes>`,
	Skill: `<verify-<app> path>`,
	Map: `<features/ path>`,
	Formal: `<exists|exists-stale|create|not-required>`,
	"Formal property": `<one-sentence property, or none>`,
	"Maintenance route": `none`,
	Owner: `<role>`,
};

// Renders the authoring shell. Every placeholder the retired skeleton carried
// for the sections that survive is renderable here; the retired program
// checklist lives in the execution playbook.
export function renderShell(options) {
	const required = ["feature", "title", "surface", "pr", "register"];
	const missing = required.filter((name) => !options[name]);
	if (missing.length) throw new TypeError(`renderShell: missing option ${missing.join(", ")}`);
	if (!SURFACES.includes(options.surface))
		throw new TypeError(`renderShell: surface "${options.surface}" is not one of ${SURFACES.join("|")}`);
	const { feature, title, surface, pr } = options;
	const register = options.register.trimEnd();
	const playbook = options.playbook ?? "single-pr";
	const live = shape.pr.blocks["Verify, live."];
	const artifact = live.artifactBySurface[surface] ?? { verb: "Save", noun: "artifact" };
	const depth = shape.pr.blocks["Review gate."].reviewDepth;
	const columns = shape.pr.blocks["Build."].laneTable.columns;
	const readinessTable = [
		`| ${shape.readiness.table.header.join(" | ")} |`,
		"|---|---|",
		...shape.readiness.table.fields.map((field) =>
			`| ${field.name} | ${field.name === "Surface" ? surface : READINESS_SHELL[field.name]} |`),
	];
	const laneTable = [
		`| ${columns.map((column) => column.header).join(" | ")} |`,
		`|${columns.map(() => "---").join("|")}|`,
		"| <id> | <one deliverable> | `<glob>` | `<worktree path>` | `<test command>` | <minutes> | <unit ids, or None> |",
	];
	const artifactPath = `\`.scratch/${feature}/shots/${pr}/worker-<n>/<slug>${surface === "ui" ? ".png" : ".txt"}\``;
	return `# ${title} plan

<Under ten lines. What changes, for whom, the rule the plan enforces, and the PR id.>

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The run executes \`skills/start-dev/playbooks/${playbook}.md\`. The main agent owns PR ${pr} and lands it on the clean verdict; a merge worker is the only writer of the branch.

Continuation: <the active profile's continuation mechanism. Where the profile has \`/goal\`, a goal whose completion criterion is the landed PR, foreground children, and no background polling and no audit tick. Where it has no goal, normal mode with the same no-polling rule.>

${RULE}

### Standing orders

${register}

## Verification readiness

${readinessTable.join("\n")}

Fill \`Maintenance route\` only when the app \`Decision\` or \`Formal\` is \`exists-stale\`; name the \`maintain-verification-skill\` and/or \`maintain-formal-verification-skill\` route the stale decision routes to. Keep \`none\` otherwise.

\`exists\` requires a driver proof. A driver being rewritten, or one without a known-bad control, routes to \`exists-stale\` and the maintain skill. \`Isolation\` decides the ready-set size. Each final-gate lane runs under the lane procedure in \`skills/start-dev/playbooks/single-pr.md\`, and its \`Timeout\` stays within the spawn bound.

## Run graph

\`\`\`mermaid
graph TD
  U1[unit: <id> <deliverable> lane <glob>]
  U2[unit: <id> <deliverable> lane <glob>]
  P[pr: ${pr} <the change> lane <glob>]
  U1 -->|blocks| U2
  U2 -->|blocks| P
  P --> GF[gate: final]
\`\`\`

**Critical path.** <The longest blocking chain, named with its gates.>

**Staffing.** <role-to-model map per unit; critical-dev and reviewer independence; the model-family diversity rule. Outside auto mode this map is presented to the operator before the first dispatch.>

**Risk.** <the risk register with a fallback per risk and the verification ceiling.>

## <Task as a verb phrase> (${pr})

Surface: ${surface}
Change: <user-facing|internal>

**Depends on.** None.

**Files.**

- [ ] Edit \`<path>\`.
- [ ] Create \`<path>\`.

**Build.**

${laneTable.join("\n")}

- [ ] <One change. Name the symbol and the file.>
- [ ] Map update. For this \`Change: user-facing\` PR, add or update the feature entry for every changed user-facing behavior under \`<features/ path>\` in the same PR. Give each changed user-facing feature at least one final-gate lane. Omit this box for \`Change: internal\`.

**You see.**

- [ ] <One observable result, with the exact log line or screen state.>

**Verify, unit.** ${RULE}

- [ ] <Test file and the case it gains.> Run \`<command>\`.

**Verify, live.** ${RULE} ${live.lanesDeclaration}.

- [ ] Lane 1. \`<feature-id>#<sub-id>\`. \`Live-only: <the claim a mocked unit test cannot make>.\` Regression lane against trunk. Drive the entry's load-bearing journey at trunk and head. If trunk lacks the feature, record that and gate <the behavior the diff adds plus the end state the user waits for>. ${artifact.verb} ${artifactPath}. Pass when <predicate>.
- [ ] Lane 2. \`<feature-id>#<sub-id>\`. \`Live-only: <the claim a mocked unit test cannot make>.\` <Drive this entry's journey under one condition.> ${artifact.verb} ${artifactPath}. Pass when <predicate>.

Add or remove lanes so every changed feature entry has at least one, plus the regression journey on lane 1. The lane count is ${live.laneCountRule}; there is no fixed lane count.

**Verify, formal.** ${RULE}

<Keep the four formal boxes for \`Formal: create\`, \`exists\`, or \`exists-stale\`. For \`exists-stale\`, name the \`maintain-formal-verification-skill\` route and owner in \`## Verification readiness\`, then run the maintained check in the Run box. For \`Formal: not-required\`, keep only the Not covered box. Delete whichever branch the PR's Formal decision does not use.>

- [ ] Command. \`<command>\`.
- [ ] Property. <One-sentence property.>
- [ ] Covered. \`<Paths and symbols.>\`
- [ ] Run. Save \`<output evidence path>\`. Pass when <predicate>. Advance the formal sync commit when the passing model still describes the code.
- [ ] Not covered.

**Verify, perf.** ${RULE}

- [ ] Metric. <What is measured at both trunk and head. If trunk lacks the feature, also name the diff-added work and the end-to-end state the user waits for.>
- [ ] Probe. <The command or procedure, run at trunk and at the head, interleaved. Both sides must produce the metric.>
- [ ] Baseline. Record the trunk <value> first.
- [ ] Rule. <Head against trunk, with the number that fails. If the scenarios differ, add absolute budgets for the diff-added work and the user-visible end state instead of an invalid ratio.>

**Review gate.** The operator reviews before merge.

- [ ] The independent reviewer reads the diff and the lane evidence. This plan has <n> units; above ${depth.unitThreshold} units or ${depth.lineThreshold} changed lines, name one area reviewer per unit group and the aggregating lead. At or below it, one reviewer reads it all.
- [ ] One fix round, then a scoped re-check of the changed findings only.
- [ ] The operator reads the evidence and the verdict in chat before merge. ${surface === "ui" ? "Screenshots stand in for the lanes; a video only when a lane's property lives in time." : `${artifact.noun[0].toUpperCase()}${artifact.noun.slice(1)}s stand in for the lanes.`}

**Merge.**

- [ ] Squash-merge on a clean verdict and green CI on the merge result. The patch-id rule applies if a rebase is needed.

## Close the run

- [ ] Every unit in the lane table is merged with its scoped tests green and its evidence recorded in the progress log.
- [ ] Every changed user-facing behavior has its feature entry updated in the same PR, and every changed entry has at least one final-gate lane.
- [ ] <For \`create-after-first-drivable-batch\` or \`create-before-amendment\`, the verify skill exists and was proved once, with its transcript saved.>
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

<Each open question a prototype answered, with the branch, the SHA, and the artifact links. Each question that stays unproven.>

## Appendix B. Alternatives rejected

<Each approach weighed and why it lost.>

## Appendix C. Risks

<Each risk with the unit it lands in and what the owner watches.>

## Appendix D. Links and reading list

<Docs to read before editing. Which units get \`skills/how/SKILL.md\` and \`skills/interrogate/SKILL.md\`. The trail per \`skills/show-me-your-work/SKILL.md\`.>
`;
}
