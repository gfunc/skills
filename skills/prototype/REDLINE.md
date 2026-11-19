# REDLINE — polish an existing UI by audited variants

Take this branch when the input is an existing page or app and the question is polish (appearance refinement, not new structure). If there is no existing page, route [VARIANTS](VARIANTS.md) and state the assumption; if the question is logic or interaction, route LOGIC or VARIANTS. The real page runs under its own start command.

The whole decision is executable. `scripts/decide-redline.mjs` over a run directory of report files is the definition of reject, rank, and pick; this file never restates its field-level logic, so no prose copy can drift. The rule as data lives in `references/redline-shape.mjs`. The run directory lives inside the prototype directory (`.scratch/<effort>/prototype/<slug>/redline/<run>/`).

## The three clauses

1. **Reject.** A variant with any open blocker or high finding, any console error, or horizontal overflow at any tier is out. The cure is fix and re-audit, never argument.
2. **Rank.** Survivors rank by fewest open medium findings. Nits never gate and never rank; carry them into the winner's fix list or drop them consciously.
3. **Pick.** The computed winner stands. A human pick may confirm it, break a tie among the top survivors, or override it only with a typed dissent naming the disputed rows, which is copied verbatim into the record. A pick naming a rejected variant is an error, and a tie with no reachable human auto-breaks with the assumption stated in `winner.json`.

Rows to audit are the twelve mandatory rows in `references/redline-shape.mjs` (`ROWS`), each citing its anchor in `references/design-laws.md` (`#grouping`, `#responsiveness`, `#motor`, and so on); craft judgement beyond the rows leans on `references/design-principles.md` §15-§16. The artifact always wins over both references.

## Steps

1. **Audit every variant.** Run `node scripts/audit-variant.mjs "<url-with-?variant=>" <run-dir>/<variant>` on the real page. Start with a fresh run directory and audit all variants at the same tier widths. Each audit opens its own browser session and writes `report.json` and one PNG per tier. For a trusted local artifact that needs `file://` access, explicitly set `PLAYWRIGHT_MCP_ALLOW_UNRESTRICTED_FILE_ACCESS=1` for that invocation only.

   Filler phrases are **nit** review cues. Keep legitimate examples and quotations. Add a **high** review finding only when the rendered copy actually violates the brief. A URL on a dedicated placeholder-image service is a **medium** finding; the URL alone does not show that the image loaded. Supply evidence and a fix for each review finding. If the console count is `null`, inspect the console and supply the count before the variant can qualify.

   Pass `--design-context-tokens <tokens.css>` only for a source that follows the [restricted token format](references/design-context.md#optional-tokenscss). Token drift is a **nit**. The audit compares declared root values as strings, not equivalent color notations or actual component use. `tokenCheck.status: "checked"` means the comparison ran. Without a source it records `tokenCheck.status: "skip"` and emits no token finding.
2. **Decide.** Run `node scripts/decide-redline.mjs <run-dir> [--pick pick.json]`. It reads the variant reports and writes `winner.json`. Bare report paths work too. Exit 0 means a winner. Exit 2 means no eligible variant or an invalid pick. Exit 3 means invalid input, including unequal tier sets. On exit 3, no new decision is written.
3. **Capture.** Use the [completion gate](SKILL.md#completion-gate). Keep the reports, PNGs, and `winner.json`, including a rejection with no winner. Keep losing variants with their reports. Applying a winner to production requires a separate operator invocation.

## Credits

- Severity taxonomy and the per-URL audit: `ui-ux-pro-max` (MIT, © 2024 Next Level Builder), adapted from `stack/scripts/design-audit.mjs` and its gate policy; no upstream text reproduced.
- Rubric ancestry: `wondelai/design-checklists` (MIT) — the checklists-as-epics lineage behind scoring-by-counts rather than by-number.
- `laws-of-ux` checklist shape only; its content is CC BY-NC-ND and is never lifted.
- Filler phrases and dedicated image hosts adapt the [OpenDesign artifact linter](https://github.com/nexu-io/open-design/blob/f2ecaa3f88e1eba001379ea845e7b7754310ea6d/apps/daemon/src/lint-artifact.ts) (Apache-2.0). REDLINE audits rendered observations and uses its own finding bands.

