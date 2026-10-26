1. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.
2. CI green is an input to a verdict, not a verdict.
3. Inconclusive is not a pass.
4. Playwright is the control skill.
5. Save screenshots to `.scratch/<feature-slug>/shots/<pr>/worker-<n>/`.
6. Evidence is exit codes and output tails, never a self-report.
7. No rebase, no merge, no retarget, no force-push, no out-of-scope fixes.
8. One writer per branch.
9. Exactly one stacker touches topology.
10. The root never pushes. Owners push only their own branch.
11. Never touch the main checkout or shared state, tracker and prod/UAT included.
12. No `rm -rf`, precise-target deletion only.
13. Stay under the verification ceiling.
14. Append-only edits on hand-written shared files.
15. Generated code off-limits.
16. Reviewers never edit.
17. Long gates tee to `.scratch/<feature>/logs/`.
18. Never touch the pstack mirror repo.
19. Never commit `.scratch`.
20. Run subagent commands in the foreground with a timeout; no detached fire-and-forget.
21. Prove new or changed tests can fail. Run them against the pre-change code or a known-bad state (negative control).
22. Briefs point at files and paths; never inline bulk content (sparse context pointers).
23. Reach the human only for irreversible actions, genuine product or preference calls no experiment settles, a standing order contradicting observed reality, missing credentials or permissions, a dependency cycle, a required re-slice, or a dead end that survived a replan.
24. Never reach the human for retries, CI flake triage, frontier nudges, format fixes, in-scope refusals, or "should I keep going".
25. Models are per-plan, named at authoring time; standing orders carry no role-to-alias mapping. Role names are feature, refactoring, bug-fix, judgment and prose, swarm workers; harness aliases are chosen per plan.
