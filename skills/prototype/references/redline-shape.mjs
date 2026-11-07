// The one statement of the REDLINE decision rule. decide-redline.mjs resolves
// this module and walks it; the tests pin its semantics. The rule is data so
// no prose copy exists to drift: REDLINE.md names this file as the executable
// definition and restates no field-level logic.
//
// Adapted from the studied ui-ux-pro-max severity/gate system (MIT, (c) 2024
// Next Level Builder) and wondelai/design-checklists rubric ancestry (MIT);
// row prose and semantics are ours. No upstream text is reproduced.

// The only severity scale. Nits never gate and never rank.
export const BANDS = ["blocker", "high", "medium", "nit"];

// The machine audit maps its three severities onto the band scale at this one
// site; nothing else translates scales.
export const MACHINE_TO_BAND = { high: "high", medium: "medium", low: "nit" };

// One audit ladder, shared by audit-variant.mjs and every tier-named field.
export const TIER_LADDER = [360, 390, 768, 1024, 1440, 1920];

// The twelve mandatory rows. Each declares its band and the design-laws.md
// anchor it cites; a finding names the row it came from.
export const ROWS = [
	{ id: "overflow", question: "Does the page overflow its viewport horizontally at any tier?", band: "high", lawAnchor: "#grouping" },
	{ id: "console", question: "Does the console stay clean of errors across the tier sweep?", band: "high", lawAnchor: "#responsiveness" },
	{ id: "state-visible", question: "Does every action land perceptible feedback without a jarring wait?", band: "high", lawAnchor: "#responsiveness" },
	{ id: "safe-targets", question: "Can every control be reached and hit without precision strain?", band: "high", lawAnchor: "#motor" },
	{ id: "signified", question: "Is every interactive element identifiable as interactive without hover?", band: "high", lawAnchor: "#familiarity" },
	{ id: "scannable", question: "Does the page parse into a few meaningful chunks at one glance?", band: "medium", lawAnchor: "#load" },
	{ id: "aligned", question: "Do reading paths stay smooth, with breaks only where a transition is meant?", band: "medium", lawAnchor: "#grouping" },
	{ id: "figure-ground", question: "Does every surface parse into figure and ground without ambiguity?", band: "medium", lawAnchor: "#grouping" },
	{ id: "contrast-coded", question: "Do critical categories survive grayscale and colour-vision differences?", band: "medium", lawAnchor: "#salience" },
	{ id: "critical-placement", question: "Do critical items sit where recall and habit look for them?", band: "medium", lawAnchor: "#ordering" },
	{ id: "smart-defaults", question: "Does the product absorb the irreducible work instead of pushing it downstream?", band: "nit", lawAnchor: "#complexity" },
	{ id: "one-thing-noticed", question: "Does at most one element per view get the highlight treatment?", band: "nit", lawAnchor: "#salience" },
];

export const ROW_IDS = ROWS.map((row) => row.id);

const validBand = (value) => BANDS.includes(value);
const validEvidence = (evidence) =>
	Array.isArray(evidence) && evidence.length > 0 &&
	evidence.every((entry) => typeof entry === "string" && entry.trim().length > 0);
const validTiers = (tiers) =>
	Array.isArray(tiers) && tiers.length > 0 && tiers.every((tier) => TIER_LADDER.includes(tier));

const findingProblem = (finding, index, name) => {
	if (typeof finding !== "object" || finding === null) return [`${name}: finding ${index} is not an object`];
	const problems = [];
	if (finding.row !== undefined && !ROW_IDS.includes(finding.row))
		problems.push(`${name}: finding ${index} names unknown row "${finding.row}"`);
	if (!finding.phase || typeof finding.phase !== "string")
		problems.push(`${name}: finding ${index} lacks phase`);
	if (!validBand(finding.band))
		problems.push(`${name}: finding ${index} band "${finding.band}" is not one of ${BANDS.join("|")}`);
	if (finding.source !== "machine" && finding.source !== "review")
		problems.push(`${name}: finding ${index} source "${finding.source}" is not machine|review`);
	if (!validEvidence(finding.evidence))
		problems.push(`${name}: finding ${index} carries no non-empty evidence entries`);
	if (!finding.fix || typeof finding.fix !== "string")
		problems.push(`${name}: finding ${index} lacks fix`);
	return problems;
};

// The boundary: turns one report.json into a Report, or an error naming the
// file and the offending field. Freeform notes never parse; unknown keys fail
// rather than ride along.
export function parseReport(text, name = "report.json") {
	const problems = [];
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return { error: `${name}: not valid JSON` };
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
		return { error: `${name}: not a JSON object` };
	const allowed = ["variant", "url", "tiers", "consoleErrors", "overflowTiers", "findings"];
	for (const key of Object.keys(parsed))
		if (!allowed.includes(key)) problems.push(`${name}: unknown field "${key}"`);
	if (typeof parsed.variant !== "string" || !parsed.variant.trim())
		problems.push(`${name}: field "variant" is missing or not a non-empty string`);
	if (typeof parsed.url !== "string" || !parsed.url.trim())
		problems.push(`${name}: field "url" is missing or not a non-empty string`);
	if (!validTiers(parsed.tiers))
		problems.push(`${name}: field "tiers" is missing or holds tiers outside ${TIER_LADDER.join("/")}`);
	if (typeof parsed.consoleErrors !== "number" || !Number.isInteger(parsed.consoleErrors) || parsed.consoleErrors < 0)
		problems.push(`${name}: field "consoleErrors" is not a non-negative integer`);
	if (!Array.isArray(parsed.overflowTiers) || parsed.overflowTiers.some((tier) => !TIER_LADDER.includes(tier)))
		problems.push(`${name}: field "overflowTiers" is not a list of ladder tiers`);
	if (!Array.isArray(parsed.findings))
		problems.push(`${name}: field "findings" is missing or not an array`);
	else parsed.findings.forEach((finding, index) => problems.push(...findingProblem(finding, index, name)));
	if (problems.length) return { error: problems.join("; ") };
	return {
		variant: parsed.variant,
		url: parsed.url,
		tiers: [...parsed.tiers],
		consoleErrors: parsed.consoleErrors,
		overflowTiers: [...parsed.overflowTiers],
		findings: parsed.findings.map((finding) => ({
			...(finding.row !== undefined ? { row: finding.row } : {}),
			phase: finding.phase,
			band: finding.band,
			source: finding.source,
			evidence: [...finding.evidence],
			fix: finding.fix,
		})),
	};
}

const OPEN_BANDS = ["blocker", "high", "medium"];

const openFindings = (report) => report.findings.filter((finding) => OPEN_BANDS.includes(finding.band));

const mediumCount = (report) =>
	report.findings.filter((finding) => finding.band === "medium").length;

// Eligibility is the predicate: zero open blocker or high findings, zero
// console errors, no overflow at any tier. Nits never gate.
export function eligible(report) {
	return (
		report.findings.every((finding) => finding.band !== "blocker" && finding.band !== "high") &&
		report.consoleErrors === 0 &&
		report.overflowTiers.length === 0
	);
}

const ineligibilityReasons = (report) => {
	const reasons = [];
	const blocking = report.findings.filter((finding) => finding.band === "blocker" || finding.band === "high");
	if (blocking.length) reasons.push(`${blocking.length} open blocker/high findings: ${blocking.map((finding) => finding.row ?? finding.phase).join(", ")}`);
	if (report.consoleErrors > 0) reasons.push(`${report.consoleErrors} console errors`);
	if (report.overflowTiers.length) reasons.push(`overflow at tier(s) ${report.overflowTiers.join(", ")}`);
	return reasons;
};

// Survivors rank by fewest open medium findings; nits never rank. Ties keep
// input order so the result is deterministic.
export function rank(reports) {
	return reports
		.map((report, index) => ({ report, index }))
		.filter(({ report }) => eligible(report))
		.sort((a, b) => mediumCount(a.report) - mediumCount(b.report) || a.index - b.index)
		.map(({ report }) => report);
}

export function decide(reports, pick) {
	if (reports.length === 0)
		throw new Error("decide: no reports");
	const rejected = reports
		.filter((report) => !eligible(report))
		.map((report) => ({ variant: report.variant, reasons: ineligibilityReasons(report) }));
	const survivors = rank(reports);
	const tier = survivors.length
		? survivors.filter((report) => mediumCount(report) === mediumCount(survivors[0])).map((report) => report.variant)
		: [];
	const tiedAtTop = tier;

	if (pick) {
		if (typeof pick !== "object" || pick === null)
			throw new Error("pick: not an object");
		for (const key of Object.keys(pick))
			if (!["variant", "dissent"].includes(key)) throw new Error(`pick: unknown field "${key}"`);
		if (typeof pick.variant !== "string" || !pick.variant.trim())
			throw new Error("pick: variant is missing or not a non-empty string");
		if (!survivors.some((report) => report.variant === pick.variant))
			throw new Error(`pick names ineligible or unknown variant "${pick.variant}"`);
		if (pick.dissent !== undefined) {
			if (typeof pick.dissent !== "object" || pick.dissent === null)
				throw new Error("pick: dissent is not an object");
			for (const key of Object.keys(pick.dissent))
				if (!["disputes", "reason"].includes(key)) throw new Error(`pick.dissent: unknown field "${key}"`);
			if (!Array.isArray(pick.dissent.disputes) || pick.dissent.disputes.length === 0)
				throw new Error("pick.dissent: disputes is missing or empty");
			if (!pick.dissent.disputes.every((dispute) => ROW_IDS.includes(dispute)))
				throw new Error(`pick.dissent: dispute "${pick.dissent.disputes.find((d) => !ROW_IDS.includes(d))}" names no known row`);
			if (typeof pick.dissent.reason !== "string" || !pick.dissent.reason.trim())
				throw new Error("pick.dissent: reason is missing or empty");
		}
		const winner = pick.variant;
		if (tiedAtTop.includes(winner)) {
			// The pick resolves an open tie from inside tiedAtTop.
			return { winner, kind: "tie-broken", tiedAtTop, rejected, ...(pick.dissent ? { dissent: pick.dissent } : {}) };
		}
		if (survivors[0].variant === winner) {
			return { winner, kind: "confirmed", tiedAtTop, rejected, ...(pick.dissent ? { dissent: pick.dissent } : {}) };
		}
		// An override: the pick names a survivor the computed ranking did not
		// place first, so a typed dissent naming disputed rows is required and
		// is copied verbatim into the record.
		if (!pick.dissent) throw new Error(`pick overrides computed winner "${survivors[0].variant}" with "${winner}" but carries no dissent`);
		return { winner, kind: "overridden", tiedAtTop, rejected, dissent: pick.dissent };
	}

	if (!survivors.length) {
		return { winner: null, kind: "all-rejected", tiedAtTop: [], rejected };
	}
	if (survivors.length === 1 || mediumCount(survivors[0]) !== mediumCount(survivors[1])) {
		return { winner: survivors[0].variant, kind: "confirmed", tiedAtTop: [survivors[0].variant], rejected };
	}
	// Tie with no pick: auto-break on the last key (input order), assumption stated.
	return {
		winner: survivors[0].variant,
		kind: "auto-tie-broken",
		tiedAtTop,
		rejected,
		assumption: `human unreachable; auto-broke the tie at [${tiedAtTop.join(", ")}] on the last key (report order)`,
	};
}
