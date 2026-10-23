# Harness adapters

Every adapter delivers the same pointer, never the profile body:

```text
harness=<name>
profile-root=<absolute pack root | plugin>
profile=<absolute profile path | references/harnesses/<name>.md>
Read the named profile before harness-dependent work.
```

`profile-root=plugin` is the deterministic locator for static prompt artifacts
that cannot know the installation path at authoring time (Kimi
`systemPromptPath`, the Cursor plugin rule). `plugin` means the installed
plugin root — the directory containing the host manifest (`kimi.plugin.json`
or `.cursor-plugin/`) — not the authoring checkout. A skill's own directory at
`<plugin-root>/skills/<name>/` is two levels below it. Cloud Cursor children
receive the line from the parent and must not use a local absolute path. Every
other adapter resolves `profile-root` to an absolute path and puts the absolute
profile path in `profile`.

| Host | Artifact | Delivery |
| --- | --- | --- |
| Kimi | `kimi.plugin.json` → `systemPromptPath` | Enabled plugin appends `references/adapters/kimi.md` to the system prompt. |
| Claude | `.claude-plugin/plugin.json` → `hooks/claude-hooks.json` → `hooks/harness-context.sh` | `SessionStart` reaches the main agent; `SubagentStart` reaches each fresh child before its first prompt. The non-default filename is deliberate: `hooks/hooks.json` is also Codex's and Cursor's discovery path, and a trusted Codex hook must never deliver `harness=claude`. |
| Pi | `extensions/harness-contract.ts` | Package extension adds a `before_agent_start` prompt section. No build. |
| Cursor | `rules/harness-contract.mdc` (`alwaysApply: true`) | Always-applied plugin rule. Component precedence still needs the rig proof. |
| Codex | none | **Explicit selection only.** Installing or enabling a Codex plugin does not trust its hooks, and no Codex hook artifact is shipped. The Claude hook config lives behind Claude's manifest and is not Codex's `hooks/hooks.json` discovery path. |

## Clone and Codex selection

Run the resolver at session start:

```bash
scripts/resolve-harness --harness codex
# or, for the session:
GFUNC_HARNESS=codex scripts/resolve-harness
```

Precedence is `--harness`, then `GFUNC_HARNESS`, then a warned fallback that
recognizes host-owned environment markers (`CLAUDECODE`; Codex
`CODEX_THREAD_ID`/`CODEX_SESSION_ID`/`CODEX_SANDBOX*`; `PI_SESSION_FILE`;
`CURSOR_AGENT`/`CURSOR_PLUGIN_ROOT`; `KIMI_PLUGIN_ROOT` in plugin hook
processes). Kimi has no reliable shell marker, so Kimi clone use is explicit
selection too. Ambiguous detection and no match exit non-zero with the
explicit options; the resolver never guesses.

The resolver checks that the named profile exists, prints the pointer, and
writes nothing anywhere. Simultaneous harnesses may use one shared root, and a
read-only root works.

A missing profile is a stop, not a fallback: the affected harness-dependent
action stops while harness-neutral work may continue. The Claude hook and Pi
extension still deliver the pointer plus a `HARNESS CONTRACT UNAVAILABLE`
notice; the static Kimi and Cursor artifacts rely on the reader stopping at the
missing file.
