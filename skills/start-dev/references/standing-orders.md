1. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.
2. CI green is an input to a verdict, not a verdict.
3. Inconclusive is not a pass.
4. Drive through the surface's control skill; on this stack, the project's `verify-<app>` skill, which uses the profile's UI driver.
5. Every user-facing behavior change adds or updates its feature entry in the same PR; `Change: internal` PRs carry no map-update box.
6. A PR that changes formal-covered code runs the formal check; when the passing model still describes the code, advance the formal sync commit in the same PR, and route a failure or model mismatch to maintenance.
7. Save screenshots to `.scratch/<feature-slug>/shots/<pr>/worker-<n>/`.
8. Evidence is exit codes and output tails, never a self-report.
9. No rebase, no merge, no retarget, no force-push, no out-of-scope fixes.
10. One writer per branch.
11. Exactly one stacker touches topology.
12. The root never pushes. Owners push only their own branch.
13. Never touch the main checkout or shared state, tracker and prod/UAT included.
14. No `rm -rf`, precise-target deletion only.
15. Stay under the verification ceiling.
16. Append-only edits on hand-written shared files.
17. Generated code off-limits.
18. Reviewers never edit.
19. Long gates tee to `.scratch/<feature>/logs/`.
20. Never touch the pstack mirror repo.
21. Never commit `.scratch`.
22. Run subagent commands in the foreground with a timeout; no detached fire-and-forget.
23. Prove new or changed tests can fail. Run them against the pre-change code or a known-bad state (negative control).
24. Briefs point at files and paths; never inline bulk content (sparse context pointers).
25. Reach the human only for irreversible actions, genuine product or preference calls no experiment settles, a standing order contradicting observed reality, missing credentials or permissions, a dependency cycle, a required re-slice, or a dead end that survived a replan.
26. Never reach the human for retries, CI flake triage, frontier nudges, format fixes, in-scope refusals, or "should I keep going".
27. Models are per-plan, named at authoring time; standing orders carry no role-to-alias mapping. Role names are feature, refactoring, bug-fix, judgment and prose, swarm workers; harness aliases are chosen per plan.
