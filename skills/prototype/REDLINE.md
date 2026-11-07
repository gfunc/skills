# REDLINE — polish an existing UI by audited variants

Take this branch when the input is an existing page or app and the question is polish (appearance refinement, not new structure). If there is no existing page, route [VARIANTS](VARIANTS.md) and state the assumption; if the question is logic or interaction, route LOGIC or VARIANTS. The real page runs under its own start command.

The whole decision is executable. `scripts/decide-redline.mjs` over a run directory of report files is the definition of reject, rank, and pick; this file never restates its field-level logic, so no prose copy can drift. The rule as data lives in `references/redline-shape.mjs`.

## The three clauses

1. **Reject.** A variant with any open blocker or high finding, any console error, or horizontal overflow at any tier is out. The cure is fix and re-audit, never argument.
2. **Rank.** Survivors rank by fewest open medium findings. Nits never gate and never rank; carry them into the winner's fix list or drop them consciously.
3. **Pick.** The computed winner stands. A human pick may confirm it, break a tie among the top survivors, or override it only with a typed dissent naming the disputed rows, which is copied verbatim into the record. A pick naming a rejected variant is an error, and a tie with no reachable human auto-breaks with the assumption stated in `winner.json`.

Rows to audit are the twelve mandatory rows in `references/redline-shape.mjs` (`ROWS`), each citing its anchor in `references/design-laws.md` (`#grouping`, `#responsiveness`, `#motor`, and so on); craft judgement beyond the rows leans on `references/design-principles.md` §15-§16. The artifact always wins over both references.

## Steps

1. **Audit every variant** on the real page, one `?variant=` at a time: run `node scripts/audit-variant.mjs "<url-with-?variant=>" <run-dir>/<variant>` per variant. It drives the tier ladder, auto-scrolls before each shot, and writes `report.json` plus one PNG per tier. A review pass adds human findings to each report, every finding carrying evidence (a screenshot path or a console line) and a fix.
2. **Decide**: `node scripts/decide-redline.mjs <run-dir> [--pick pick.json]`. It prints the one-line decision and writes `winner.json`. Exit 0 is a winner; 2 means no eligible variant (fix and re-audit) or a bad pick; 3 means a malformed report.
3. **Capture.** Evidence is the run directory: every report.json, the PNGs, and `winner.json`. Apply the winner to the real code, archive the losing variants with their reports on the throwaway capture branch, then re-audit the real route once without the `?variant=` switch — folding back can itself regress, so the fold-back gate is a fresh audit, and it is skipped (not repeated) when the winner is already the live route.

## Credits

- Severity taxonomy and the per-URL audit: `ui-ux-pro-max` (MIT, © 2024 Next Level Builder), adapted from `stack/scripts/design-audit.mjs` and its gate policy; no upstream text reproduced.
- Rubric ancestry: `wondelai/design-checklists` (MIT) — the checklists-as-epics lineage behind scoring-by-counts rather than by-number.
- `laws-of-ux` checklist shape only; its content is CC BY-NC-ND and is never lifted.

