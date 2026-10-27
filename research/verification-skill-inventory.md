# Verification-skill inventory and provenance

**Question.** What verification-skill material does the gfunc pack already ship, and how does it relate to pstack?

**Source of truth.** gfunc/skills `origin/main` at `36f2492689a27d7a13d177dd0406d2bd373f4744` — "Merge pull request #7 from gfunc/release/0.3.0" (v0.3.0). pstack mirror at `/home/jason/projects/pstack`, HEAD `e44668c2aad92eacf4e84df47984121fefb11b82`. The mirror was read only; nothing in pstack or the four skills was modified.

**Method.** The main checkout is on `ci/version-bump`, so every gfunc claim below comes from a tree exported with `git archive origin/main`, not from the checkout. For the four skills, the checkout happened to match `origin/main` (`diff -r` produced no output), but `setup-pstack` and `setup-workspace` do not, so their quotes use the exported tree. I ran `diff -r`, `sha256sum`, `git ls-tree`, `scripts/sync-upstream`, and read-only `ls`/`cat`/`diff` against the installed plugin. No skill was executed.

## The answer in one paragraph

All four skills ship on `origin/main`. The two formal-verification skills are byte-identical to pstack. `create-verification-skill` and `maintain-verification-skill` each differ from pstack in exactly one file, `SKILL.md`, and only in the harness-profile adaptation: gfunc adds a `**Harness profile.**` paragraph and replaces pstack's hardcoded harness-folder list with the active profile's `Skill folders` field. `vendor-manifest.txt` lists all four as vendored paths; its header explicitly declares the two non-formal skills as intended local modifications, while the formal pair is not declared. `scripts/sync-upstream` confirms this classification today: formal pair `clean/clean → ok`, the other two `clean/mod → local modification (intended)`, because pstack HEAD equals the manifest BASE. Editing a gfunc copy does not touch pstack. Against the mirror as-is, three paths would stay local-only; but the mirror's already-fetched `origin/main` is 9 commits ahead and changes `create-formal-verification-skill/SKILL.md`, so an edit there becomes a `3-WAY MERGE` row as soon as the mirror is fast-forwarded. The other three have no upstream change in those commits. `origin/main`'s `setup-pstack` still offers both generators in optional steps 7 and 8, and `origin/main`'s `setup-workspace` offers verification generation and maintenance and routes to the two non-formal skills. The installed plugin is version **0.2.2**, not 0.2.1, and contains all four skills byte-identical to `origin/main` — none is missing.

## a. Do the four skills exist on `origin/main`?

Yes. All seven files:

```text
skills/create-formal-verification-skill/SKILL.md                        5141 bytes
skills/create-verification-skill/SKILL.md                               6985 bytes
skills/create-verification-skill/references/feature-map-example/README.md      2601
skills/create-verification-skill/references/feature-map-example/create-note.md 2926
skills/create-verification-skill/references/feature-map-example/search.md      3478
skills/maintain-formal-verification-skill/SKILL.md                      7012 bytes
skills/maintain-verification-skill/SKILL.md                             5294 bytes
```

Command: `git ls-tree -r --long origin/main -- skills/create-verification-skill skills/maintain-verification-skill skills/create-formal-verification-skill skills/maintain-formal-verification-skill`.

`references/frozen-skills.tsv` does not mention any verification skill; the frozen set is the Matt Pocock ports, so these four are not frozen by that mechanism.

## b. Byte-level diff against pstack

Command per skill:

```bash
git archive origin/main -- skills/<name> | tar -x -C <tmp>
diff -r --exclude=.git <tmp>/skills/<name> /home/jason/projects/pstack/skills/<name>
sha256sum <every file on both sides>
```

| Skill | Differing files | Result |
|---|---|---|
| `create-verification-skill` | `SKILL.md` only | 3 reference files byte-identical; `SKILL.md` differs |
| `maintain-verification-skill` | `SKILL.md` only | differs |
| `create-formal-verification-skill` | none | byte-identical |
| `maintain-formal-verification-skill` | none | byte-identical |

SHA-256 evidence:

```text
create-verification-skill/SKILL.md
  origin/main 668fa0d8f74cf472f9485eed537e972bc591d7e83cf84a4753a39931806a08d8
  pstack      bba612e8b81a02df0f49e6f6911f3b543c8c7d9f1f3c13ae6c0e2d58cc8c3ad3
  all three feature-map-example files: equal hashes on both sides

maintain-verification-skill/SKILL.md
  origin/main 1ebe160a943d1278e5808eb5738e8523cdfdfc6f3de8d14c9b67f42474e08309
  pstack      5943f7747da6aafcf5c1063c988e725c97e415866f5c7746279012f35cb49815

create-formal-verification-skill/SKILL.md
  both        6c934cd15a9583533ff9b7a9cad62775d7e80402d26d3ba7f74f79ea21a1d8eb

maintain-formal-verification-skill/SKILL.md
  both        0c96f54293542d3818b68754562b338073958781a9684454611dca37592e2d2c
```

### `create-verification-skill/SKILL.md`

`diff -r` reported `9,11c9`, i.e. origin/main lines 9–11 replace pstack line 9. There are two semantic changes, both harness-profile adaptation:

1. Origin/main adds a profile directive that pstack lacks (`skills/create-verification-skill/SKILL.md:9`):

   > **Harness profile.** Read the active profile before harness-dependent work; `profile` is absolute, or relative to `profile-root` (`plugin` means the installed plugin root), and a parent passes its child the resolved absolute path; stop the affected action if the profile is unavailable.

2. Origin/main rewrites the `<skills>` sentence to read the profile instead of enumerating hosts (`skills/create-verification-skill/SKILL.md:11`):

   > … `<skills>` is the project skill folder the active profile's `Skill folders` field names; read that field before choosing it. If the repo already keeps skills in that folder, use it. …

   Pstack's corresponding line 9 instead says:

   > … `<skills>` is your harness's project skill folder: `.cursor/skills/` in Cursor, `.claude/skills/` in Claude Code, `.pi/skills/` in Pi, `.agents/skills/` in Codex, OpenCode, and others. If the repo already keeps skills in one of these, use that one. …

The three `references/feature-map-example/` files (`README.md`, `create-note.md`, `search.md`) are byte-identical, so the gfunc divergence is confined to the profile abstraction in the parent skill.

### `maintain-verification-skill/SKILL.md`

`diff -r` reported two hunks, again only harness-profile wording:

1. Origin/main adds the same `**Harness profile.**` paragraph (`skills/maintain-verification-skill/SKILL.md:9`), absent from pstack at line 9.
2. Step 0 is rewritten (`origin/main:27` versus `pstack:25`):

   > Origin/main: **Locate the target.** Read the project skill folder from the active profile's `Skill folders` field, then find the verification skill to maintain: the project-local skill whose body has launch/drive sections and a feature map (usually `verify-*/` in that folder). …

   > Pstack: **Locate the target.** Find the verification skill to maintain: the project-local skill whose body has launch/drive sections and a feature map (usually `verify-*/` in the project's skill folder: `.cursor/skills/`, `.claude/skills/`, `.pi/skills/`, or `.agents/skills/`). …

No other file exists in either copy, so this one hunk pair is the whole divergence.

### Formal pair

`create-formal-verification-skill/SKILL.md` and `maintain-formal-verification-skill/SKILL.md` are single-file skills and are byte-identical to pstack. `diff -r` printed nothing; the SHA-256 values match exactly. They carry no harness-profile adaptation.

## c. Vendor-manifest and `sync-upstream` classification

### Manifest

`vendor-manifest.txt` has two relevant layers.

The header comment declares which divergences are intended (`vendor-manifest.txt:4-9`):

```text
# Intended local modifications (kept deliberately diverged from the mirror;
# sync-upstream reports these as "local modification (intended)"):
#   skills/architect/  skills/arena/  skills/automate-me/  skills/create-verification-skill/
#   skills/figure-it-out/  skills/how/  skills/interrogate/  skills/maintain-verification-skill/
#   ...
```

So `create-verification-skill` and `maintain-verification-skill` are explicitly declared intended local modifications (`vendor-manifest.txt:6-7`). The two formal-verification skills are **not** in that declaration.

The path list includes all four (`vendor-manifest.txt:18-19,25-26`):

```text
skills/create-formal-verification-skill/
skills/create-verification-skill/
skills/maintain-formal-verification-skill/
skills/maintain-verification-skill/
```

The BASE commit is `vendor-manifest.txt:10`: `e44668c2aad92eacf4e84df47984121fefb11b82`, which equals the pstack mirror HEAD (`git -C /home/jason/projects/pstack rev-parse HEAD`).

### `scripts/sync-upstream`

The script reads BASE and each manifest path (`scripts/sync-upstream:18,36-71`). For each path it computes:

- `upstream=changed` when `mirror BASE..HEAD` touches the path (`scripts/sync-upstream:40-44`);
- `local=mod` when the vendored copy differs from `mirror@BASE` (`scripts/sync-upstream:52-59`);
- action: both → `3-WAY MERGE` (`:61-64`), upstream only → `fast-forward copy from mirror` (`:65-66`), local only → `local modification (intended)` (`:67-68`).

Actual output today, filtered to the four paths:

```text
PATH                                                    UPSTREAM  LOCAL  ACTION
-----                                                   --------  -----  ------
skills/create-formal-verification-skill                 clean     clean  ok
skills/create-verification-skill                        clean     mod    local modification (intended)
skills/maintain-formal-verification-skill               clean     clean  ok
skills/maintain-verification-skill                      clean     mod    local modification (intended)
```

Command: `cd /home/jason/projects/skills && scripts/sync-upstream | grep -E 'verification|^PATH|^-----'`.

### The mirror's fetched `origin/main` is 9 commits ahead

The mirror's own status is `main...origin/main [behind 9]`. No fetch was run, but the already-present remote-tracking ref is readable:

```bash
git -C /home/jason/projects/pstack log --oneline HEAD..origin/main
git -C /home/jason/projects/pstack diff --name-status HEAD origin/main -- \
  skills/create-verification-skill skills/maintain-verification-skill \
  skills/create-formal-verification-skill skills/maintain-formal-verification-skill
```

Only one of the four paths appears:

```text
M	skills/create-formal-verification-skill/SKILL.md
```

Commit `eed1440 upstream: cursor/plugins/pstack @ e73df47` adds one paragraph to that file (`pstack origin/main:35`), telling the next agent to read TLA+ check results with pstack's [`/statechart`](../statechart/SKILL.md) skill. This is the only verification-path change in the fetched 9 commits.

Consequences:

- On the mirror as it stands, `sync-upstream` still reports `create-formal-verification-skill` as `clean/clean → ok`.
- Once the mirror is fast-forwarded to its fetched `origin/main`, `create-formal-verification-skill` becomes `upstream=changed`, `local=clean` → `fast-forward copy from mirror`. That is a safe lift **only if gfunc has not edited the file**.
- If gfunc edits `create-formal-verification-skill` before that sync, the same row becomes `upstream=changed`, `local=mod` → `3-WAY MERGE` (`scripts/sync-upstream:61-64`). **This is the one path where a local edit now can collide with an already-fetched upstream change.**
- The other three paths have no change in the fetched 9 commits, so their current classification stands.

### Would editing them create an upstream diff or a sync conflict?

- **Editing a gfunc copy:** no pstack diff, because the mirror is untouched. Against the mirror as-is, `sync-upstream` reports `local=mod`/`upstream=clean`; for the two non-formal skills that is the declared, expected state. For `create-formal-verification-skill`, an edit would show as `local modification (intended)` today but become `3-WAY MERGE` once the fetched upstream paragraph lands. For `maintain-formal-verification-skill`, an edit would also show as `local modification (intended)` — the script does not parse the header's intended list — but it would be undeclared in the manifest comment, i.e. visible drift a reviewer must judge.
- **No conflict against the mirror as-is:** every row has `upstream=clean`, so no row can be `3-WAY MERGE` today.
- **Conflict against the fetched upstream:** advancing the mirror to its `origin/main` makes `create-formal-verification-skill` `upstream=changed`; a concurrent local edit is a `3-WAY MERGE`. With no local edit, it is a clean `fast-forward copy from mirror` (`:65-66`).
- **Editing pstack itself:** that would create an upstream diff by definition. For `create-formal-verification-skill` (local clean) the report would be fast-forward; for `create-verification-skill` and `maintain-verification-skill` (already local mod) the same edit would force a `3-WAY MERGE`.
- README states the policy: local modifications are intended, "but they stay visible per path through the manifest and git history" (`README.md:83-85`), and the manifest's job is to name every pstack-origin path and its base SHA (`README.md:52`).
- Repo policy narrows what a local diff may be: "Vendored pstack paths keep upstream content; harness-adapter hunks and the `.scratch` store convention are the only allowed local diffs" (`AGENTS.md:6`). The existing create/maintain divergences are harness-adapter hunks and fit that rule. An edit to either formal skill that is not a harness-adapter hunk would violate the policy even where `sync-upstream` merely reports it as a local modification.

## d. What `setup-workspace` and `setup-pstack` say on `origin/main`

Both skills exist. Quotes below are from the `origin/main` tree; line numbers are that tree's.

### `skills/setup-workspace/SKILL.md`

The description promises verification coverage (`:3`), and discovery includes "project-local verification skills in the active profile's skill folders" (`:21`). The offer policy is explicit (`:32`):

> Offer missing model configuration once. Offer verification generation once when no project-local skill exists, even if a harness already exists. Offer maintenance once for a usable skill that appears stale or incomplete. Record declines and do not repeat these offers in this run. Installation is not an automatic offer or prerequisite. Run it only on an explicit request.

Section 6 is titled "Complete only selected verification work" (`:64`) and routes only to the two non-formal skills (`:66`):

> When several verification skills exist, obtain an explicit target choice before maintenance. Read the selected skill and map. For a usable stale or incomplete skill, route the accepted offer to [maintain-verification-skill](../maintain-verification-skill/SKILL.md). An unusable structure is a reported gap, not permission to replace it. For an absent skill, route accepted generation to [create-verification-skill](../create-verification-skill/SKILL.md). Wrap an existing harness instead of duplicating it.

It sets a proof bar for those runs (`:74`): generation must execute launch, doctor, at least one mapped real journey, evidence capture, and cleanup; maintenance must exercise every mapped feature and re-prove corrections.

One internal tension to note: the closing line says this router does **not** own pstack's verification offers (`:84`):

> … start-dev specifics live in its own skill; this router does not own pstack's verification offers, which setup-pstack keeps.

Yet the same file still offers verification generation and maintenance itself at `:32` and routes accepted work at `:66`. Whatever the intended division, `origin/main` currently contains both the generic offer and the disclaimer.

### `skills/setup-pstack/SKILL.md`

On `origin/main`, `setup-pstack` is still the model-configuration skill (`:1-14`) and it contains two optional verification offers at the end:

`skills/setup-pstack/SKILL.md:78-80`:

> ### 7. Offer a verification skill (optional)
>
> Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.

`skills/setup-pstack/SKILL.md:82-84`:

> ### 8. Offer a formal verification skill (optional)
>
> Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.

So on `origin/main`, `setup-pstack` offers both **generators** only — not the maintainers — and the two gates differ: step 7 accepts "a `verify-*` skill, **or an existing harness**"; step 8 accepts only "a project skill that runs a model checker, a proof, or another verifier". Both say "offer once" and "On no, move on without pushing".

Checkout caveat: the `ci/version-bump` working tree contains a substantially rewritten `setup-pstack` whose line 12 says "do not … offer verification generation", and a `setup-workspace` whose closing line drops the `start-dev`/pstack sentence. Those are **not** `origin/main` and were not used for the quotes above.

## e. Installed plugin check (read-only)

Path: `/home/jason/.kimi-code/plugins/managed/gfunc-skills`.

- The installed version is **0.2.2**, not 0.2.1 as the ticket states. All three metadata files agree: `kimi.plugin.json`, `plugin.json`, and `.claude-plugin/plugin.json` each contain `"version": "0.2.2"`.
- All four skill directories are present:
  - `skills/create-verification-skill/` — 4 files
  - `skills/maintain-verification-skill/` — 1 file
  - `skills/create-formal-verification-skill/` — 1 file
  - `skills/maintain-formal-verification-skill/` — 1 file
- `diff -r` of each installed skill against the `origin/main` export printed nothing: **all four are byte-identical to `origin/main`**. The installed plugin therefore lacks none of them.
- The plugin's skill directory contains 67 entries; the four verification skills are included alongside the rest of the pack.

No write, install, or update was performed against the plugin.

## Evidence limits

- The pstack mirror's own status is `main...origin/main [behind 9]`. Its already-fetched remote-tracking ref is 9 commits ahead of the local mirror, and that ref changes `skills/create-formal-verification-skill/SKILL.md` (section c). `sync-upstream` compares `mirror@BASE..mirror HEAD`, so its "upstream clean" output means "unchanged in the local mirror", not "unchanged on the mirror's `origin/main`" and not "unchanged on `backnotprop/pstack` GitHub HEAD". No fetch was run, by design (pstack is read-only here); the true upstream may be further ahead than the local tracking ref.
- The four gfunc skills in the `ci/version-bump` working tree matched `origin/main`; `setup-pstack` and `setup-workspace` did not. All gfunc line citations come from `git archive origin/main`, not the checkout.
- The installed plugin is 0.2.2, an update from the ticket's 0.2.1 premise; presence and byte equality were checked, but nothing was executed from it.
- This is textual evidence. No skill was invoked, and no generated verification skill was run.

## Commands run (representative)

```bash
cd /home/jason/projects/skills
git rev-parse origin/main                         # 36f2492...
git ls-tree -r --name-only origin/main | grep -E 'verification-skill|formal-verification'
git archive origin/main -- skills/<name> | tar -x -C .scratch/start-dev-verification/tmp-origin-main
diff -r --exclude=.git <exported>/skills/<name> /home/jason/projects/pstack/skills/<name>
sha256sum <files on both sides>
scripts/sync-upstream | grep -E 'verification|^PATH|^-----'
git -C /home/jason/projects/pstack rev-parse HEAD
git -C /home/jason/projects/pstack log --oneline HEAD..origin/main
git -C /home/jason/projects/pstack diff --name-status HEAD origin/main -- skills/<four>
git -C /home/jason/projects/pstack diff HEAD origin/main -- skills/create-formal-verification-skill/SKILL.md
ls -d /home/jason/.kimi-code/plugins/managed/gfunc-skills/skills/*verification*
diff -r <exported>/skills/<name> /home/jason/.kimi-code/plugins/managed/gfunc-skills/skills/<name>
```
