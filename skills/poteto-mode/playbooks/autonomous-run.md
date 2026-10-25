### Autonomous run

**You own the exit condition. Define done, then drive to it without stopping.**

**Harness profile.** Read the active profile before harness-dependent work; `profile` is absolute, or relative to `profile-root` (`plugin` means the installed plugin root), and a parent passes its child the resolved absolute path; stop the affected action if the profile is unavailable.

1. State the exit condition as a checkable predicate before the first iteration (tests green, repro fixed, all N PRs merged, pixel-diff zero).
2. Pick the continuation mechanism the active profile names; Kimi `/goal`, Cursor and Claude `/loop`, Codex and Pi an external cron. The goal objective is the predicate; put the exit predicate in it where the harness has one, and set a goal token budget or turn budget where the harness supports it (`SetGoalBudget` on Kimi). A goal checkpoints across turns instead of holding one giant turn; the 10-25 run held one 12.2h turn with 371.3M input tokens and two compactions. CronCreate is for timed audits, not continuation. An event to watch (CI, a merge, a ref advancing) gets a watcher subagent that wakes you on the event, with a long time-based heartbeat as fallback. No event gets a fixed-interval heartbeat sized to when the result is worth re-checking. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section.
3. Each iteration makes the smallest change the evidence justifies, verifies it against the predicate, commits if it advanced, discards changes that didn't help. Belt-and-suspenders that "might help" gets reverted, not left to ride.
   Sequence the work via the **sequence-verifiable-units** principle skill, verifying each unit before the next instead of batching checks at the end.
4. Mid-run discoveries are yours. Address broken skills, related bugs, flaky verifiers, review noise, tooling failures, orphaned follow-ups, and fixable drift yourself via poteto-mode. Put out-of-band fixes in their own PR. Do not park reversible work for the human or use `AskQuestion`. Surface only irreversible actions, genuine product or preference calls no experiment can settle, or a real dead end. Keep the predicate as the main drive, and return to it after each side fix.
5. Checkpoint every iteration via the **show-me-your-work** skill, a row for what changed and whether the predicate moved.
6. Stop when the predicate is met. A plateau is not a stop, so keep going and pivot your approach to push past it. Surface a genuine dead end rather than spinning, and never relax the predicate to declare victory.

**Reply:** the exit condition, iterations run, what landed, what was discarded, final predicate state.
