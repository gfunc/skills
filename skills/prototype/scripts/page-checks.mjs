// Pure page-check policy for the REDLINE audit: filler copy, placeholder-image
// services, and declared-token drift. audit-variant.mjs adapts the browser
// evaluator's JSON into PageObservation and owns bands, screenshots, and the
// report; nothing here touches the DOM, the filesystem, or the tier ladder.
// The pattern and host tables and the value normalization stay private.
//
// Filler phrases and image hosts adapt nexu-io/open-design's artifact linter (Apache-2.0; see REDLINE.md).

/**
 * Text that a person can see at one viewport tier.
 * @typedef {object} TextObservation
 * @property {"innerText" | "control-placeholder"} kind
 * @property {string} value
 */

/**
 * Domain observation for one tier. The CLI creates this after validating the
 * browser evaluator's JSON. It is not the evaluator's wire object.
 * @typedef {object} PageObservation
 * @property {TextObservation[]} text
 * @property {string[]} imageSources Absolute currentSrc or src values.
 * @property {Readonly<Record<string, string>>} tokenValues Root custom-property
 * values keyed by declared token name. An empty string means missing.
 */

/**
 * A parsed, binding token contract.
 * @typedef {object} TokenSource
 * @property {string} source Non-empty path or source name used in diagnostics.
 * @property {ReadonlyMap<string, string>} expected Case-sensitive custom-property
 * names mapped to trimmed literal values. The map is never mutated by checks.
 */

/**
 * @typedef {"filler-copy" | "external-image" | "token-drift"} PageCheck
 */

/**
 * A domain problem before the CLI adds its report band and screenshot path.
 * identity never contains a tier, evidence path, or incidental whitespace.
 * @typedef {object} PageProblem
 * @property {PageCheck} check
 * @property {"medium" | "low"} severity Input to MACHINE_TO_BAND.
 * @property {string} identity Normalized filler text, normalized URL, or token name.
 * @property {string} evidence Exact DOM or token observation, not a PNG path.
 * @property {string} fix Concrete repair and re-audit instruction.
 */

const FILLER_PATTERNS = [
	/\bfeature\s+(one|two|three|1|2|3)\b/gi,
	/\blorem\s+ipsum\b/gi,
	/\bdolor\s+sit\s+amet\b/gi,
	/\bplaceholder\s+text\b/gi,
	/\bsample\s+content\b/gi,
];

// Dedicated placeholder-image services only. Unsplash (and its subdomains) is
// an ordinary photo host: the URL proves nothing about filler.
const PLACEHOLDER_HOSTS = new Set([
	"placehold.co",
	"placekitten.com",
	"via.placeholder.com",
	"picsum.photos",
	"loremflickr.com",
]);

// Like-for-like string comparison: trim, lowercase hex, and expand 3/4-digit
// hex to 6/8 so trivial spellings agree. No conversion between hex, rgb(),
// and oklch() — equivalent colors in different notations compare as drift.
const normalizeTokenValue = (value) => {
	const trimmed = value.trim();
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(trimmed);
	if (!hex) return trimmed;
	const digits = hex[1].toLowerCase();
	if (digits.length === 6 || digits.length === 8) return `#${digits}`;
	return `#${digits.split("").map((digit) => digit + digit).join("")}`;
};

const placeholderImageIdentity = (value) => {
	let url;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") return null;
	const host = url.hostname.toLowerCase();
	const listed = [...PLACEHOLDER_HOSTS].some(
		(service) => host === service || host.endsWith(`.${service}`),
	);
	if (!listed) return null;
	url.hash = "";
	return url.href;
};

const fillerIdentity = (matched) => matched.replace(/\s+/g, " ").trim().toLowerCase();

const fillerFindings = (observation) => {
	const problems = [];
	for (const { kind, value } of observation.text) {
		for (const pattern of FILLER_PATTERNS) {
			for (const matched of value.matchAll(pattern)) {
				const identity = fillerIdentity(matched[0]);
				if (problems.some((problem) => problem.check === "filler-copy" && problem.identity === identity)) continue;
				problems.push({
					check: "filler-copy",
					severity: "low",
					identity,
					evidence: `rendered ${kind} matched "${matched[0]}"`,
					fix: `Review "${matched[0]}": keep it if it is brief-derived (a quoted example is legitimate), else replace with brief-derived copy, then re-audit.`,
				});
			}
		}
	}
	return problems;
};

const imageFindings = (observation) => {
	const problems = [];
	for (const source of observation.imageSources) {
		const identity = placeholderImageIdentity(source);
		if (!identity) continue;
		if (problems.some((problem) => problem.identity === identity)) continue;
		problems.push({
			check: "external-image",
			severity: "medium",
			identity,
			evidence: `observed image src/currentSrc ${source}`,
			fix: `Replace the placeholder-service image ${source} with a real project asset, then re-audit.`,
		});
	}
	return problems;
};

const tokenFindings = (observation, tokenSource) => {
	if (!tokenSource) return [];
	const problems = [];
	for (const [name, declared] of tokenSource.expected) {
		const actual = observation.tokenValues[name] ?? "";
		if (normalizeTokenValue(actual) === normalizeTokenValue(declared)) continue;
		const shown = actual.trim() === "" ? "(missing on :root)" : actual.trim();
		problems.push({
			check: "token-drift",
			severity: "low",
			identity: name,
			evidence: `${name}: declared "${declared.trim()}", rendered "${shown}"`,
			fix: `Align ${name} with the declared value "${declared.trim()}" (comparison is like-for-like: use the same notation), then re-audit.`,
		});
	}
	return problems;
};

const QUOTED = String.raw`(?:"(?:[^"\\\r\n]|\\[^\r\n])*"|'(?:[^'\\\r\n]|\\[^\r\n])*')`;
const COMMENT_OR_STRING = new RegExp(`${QUOTED}|/\\*[\\s\\S]*?\\*/|/\\*`, "g");
const DELIMITER = new RegExp(`${QUOTED}|[{};]`, "g");
const DECIMAL = String.raw`[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?`;
const NUMBER = `${DECIMAL}(?:%|[a-z]+)?`;
const CHANNEL = `${DECIMAL}%?`;
const HUE = `${DECIMAL}(?:deg|grad|rad|turn)?`;
const OPTIONAL_ALPHA = String.raw`(?:\s*/\s*${CHANNEL})?`;
const modernChannels = (...channels) => channels.join(String.raw`\s+`) + OPTIONAL_ALPHA;
const legacyChannels = (first) => String.raw`${first}(?:\s*,\s*${CHANNEL}){2,3}`;
const COLOR_SPACE = "(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)";
const COLOR_FUNCTIONS = [
	String.raw`rgba?\(\s*(?:${legacyChannels(CHANNEL)}|${modernChannels(CHANNEL, CHANNEL, CHANNEL)})\s*\)`,
	String.raw`hsla?\(\s*(?:${legacyChannels(HUE)}|${modernChannels(HUE, CHANNEL, CHANNEL)})\s*\)`,
	String.raw`hwb\(\s*${modernChannels(HUE, CHANNEL, CHANNEL)}\s*\)`,
	String.raw`(?:ok)?lab\(\s*${modernChannels(CHANNEL, CHANNEL, CHANNEL)}\s*\)`,
	String.raw`(?:ok)?lch\(\s*${modernChannels(CHANNEL, CHANNEL, HUE)}\s*\)`,
	String.raw`color\(\s*${COLOR_SPACE}(?:\s+${CHANNEL}){1,4}${OPTIONAL_ALPHA}\s*\)`,
];
const IDENTIFIER = String.raw`(?:--|-?[a-z_])[\w-]*`;
const ATOM = [QUOTED, NUMBER, ...COLOR_FUNCTIONS, "#[0-9a-f]{3,4}", "#[0-9a-f]{6}(?:[0-9a-f]{2})?", IDENTIFIER];
const TOKEN_ATOM = new RegExp(`^(?:${ATOM.join("|")})$`, "i");

const isTokenValue = (value) => {
	let start = 0;
	let quote = "";
	let inFunction = false;
	for (let index = 0; index < value.length; index++) {
		const char = value[index];
		if (quote) {
			if (char === "\\") index++;
			else if (char === quote) quote = "";
		} else if (char === '"' || char === "'") quote = char;
		else if (char === "(") {
			if (inFunction) return false;
			inFunction = true;
		} else if (char === ")") {
			if (!inFunction) return false;
			inFunction = false;
		} else if (char === "," && !inFunction) {
			if (!TOKEN_ATOM.test(value.slice(start, index).trim())) return false;
			start = index + 1;
		}
	}
	return !quote && !inFunction && TOKEN_ATOM.test(value.slice(start).trim());
};

export function parseTokenSource(text, source) {
	const stripped = text.replace(COMMENT_OR_STRING, (part) => {
		if (part === "/*") throw new Error(`${source}: unterminated comment`);
		return part.startsWith("/*") ? " " : part;
	});
	const open = /^\s*:root\s*\{/.exec(stripped);
	if (!open) throw new Error(`${source}: expected one flat :root block with no wrapping selector or at-rule`);

	const expected = new Map();
	const body = stripped.slice(open[0].length);
	let start = 0;
	for (const { 0: delimiter, index } of body.matchAll(DELIMITER)) {
		if (delimiter.startsWith('"') || delimiter.startsWith("'")) continue;
		if (delimiter === "{") throw new Error(`${source}: nested blocks are outside the one-root grammar`);
		const declaration = body.slice(start, index).trim();
		if (delimiter === "}") {
			if (declaration) throw new Error(`${source}: declaration "${declaration.slice(0, 60)}" is not semicolon-terminated`);
			const trailing = body.slice(index + 1).trim();
			if (trailing) throw new Error(`${source}: content after the :root block: ${trailing.slice(0, 60)}`);
			if (!expected.size) throw new Error(`${source}: the :root block declares no custom properties`);
			return { source, expected };
		}
		start = index + 1;
		const match = /^(--[\w-]+)\s*:\s*([\s\S]*)$/.exec(declaration);
		if (!match) throw new Error(`${source}: declaration "${declaration.slice(0, 60)}" is not a --custom-property: value`);
		const [, name, value] = match;
		if (!value) throw new Error(`${source}: ${name} has an empty value`);
		if (!isTokenValue(value)) {
			if (/\bvar\(/i.test(value)) throw new Error(`${source}: ${name} uses var(); supply a binding literal value`);
			throw new Error(`${source}: ${name} is not a supported literal value`);
		}
		if (expected.has(name)) throw new Error(`${source}: duplicate declaration of ${name}`);
		expected.set(name, value);
	}
	throw new Error(`${source}: the :root block is not closed`);
}

/**
 * Apply every page-level policy to one rendered tier.
 *
 * Filler matching covers the five source regexes over text observations. URL
 * matching covers only HTTP and HTTPS placeholder-service hosts. Token diff
 * covers only names in tokenSource.expected. tokenSource === null performs no
 * token comparison and emits no token finding.
 *
 * The returned list can contain repeated identities. The emission loop owns
 * cross-tier suppression through pageProblemKey. No function here reads the
 * DOM, touches the filesystem, maps bands, or knows screenshot paths.
 *
 * @param {PageObservation} observation Trusted domain observation for this tier.
 * @param {TokenSource | null} tokenSource Parsed declarations, or null when absent.
 * @returns {PageProblem[]} Problems in deterministic source and declaration order.
 */
export function auditPageTier(observation, tokenSource) {
	return [
		...fillerFindings(observation),
		...imageFindings(observation),
		...tokenFindings(observation, tokenSource),
	];
}

/**
 * Return the sole dedup identity used by the page-problem emission loop.
 * Tier numbers, PNG paths, evidence text, and fixes cannot affect this key.
 *
 * @param {Pick<PageProblem, "check" | "identity">} problem Problem identity.
 * @returns {string} A key containing only check and normalized match identity.
 */
export function pageProblemKey(problem) {
	return `${problem.check}:${problem.identity}`;
}
