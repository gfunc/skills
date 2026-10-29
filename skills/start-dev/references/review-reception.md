# Review reception

The fixer reads this once per run, before the first fix round. It is the discipline for receiving a review, not a guide to writing one.

## The pattern

1. **Read the whole review without reacting.** No fix, no reply, until every finding has been read.
2. **Restate the requirement in your own words.** If the restatement differs from the finding, the finding is ambiguous and the reviewer settles it.
3. **Verify it against the code.** A finding that contradicts the code is information, not an obstacle. Cite the line you checked.
4. **Evaluate it for this codebase.** A technically sound suggestion for another codebase can still be wrong here.
5. **Respond with an acknowledgment or a rejection.** Both are technical statements, not social ones.
6. **Implement one item at a time, with a test each.** A batch of fixes hides which change broke what.

## Rejection

A rejection requires evidence: a code line, a failing or passing test, or a spec line. Record it as a ruling in the progress log:

`Ruling: <the finding> <why the code disagrees> <cost if wrong>`

The reviewer adjudicates the ruling at the scoped re-check. An accepted finding that is neither implemented nor rejected is a silent discard, and the progress log must show one or the other for every finding.

## What is not reception

- Agreeing to be agreeable. A finding accepted without verification is as bad as one refused without evidence.
- Fixing in the controller. The fixer implements; the controller never edits the branch.
- Restarting the whole review because one finding was wrong. The scoped re-check covers the fixes; new findings on untouched code go to the log.
