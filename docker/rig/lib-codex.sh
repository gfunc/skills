#!/usr/bin/env bash
# lib-codex.sh: load/context/negative/smoke/transcript stages for Codex CLI
# 0.163.0.
#
# Codex has no trusted plugin adapter by design. The no-key proof surface is
# the explicit selection route: `scripts/resolve-harness --harness codex`
# prints the pointer, and `codex debug prompt-input -c
# developer_instructions=...` shows it in the model-visible developer message.
# `codex plugin list` is inventory only.

SMOKE_PHRASE="ask how a top expert would approach this task"

harness_prepare() {
  export CODEX_HOME="$HOME/.codex"
  mkdir -p "$CODEX_HOME"
}

# codex_context_artifact <pack> <out-prefix> — resolver + prompt render.
codex_context_artifact() {
  local pack="$1" out="$2" pointer
  if ! pointer="$( cd "$pack" && scripts/resolve-harness --harness codex )"; then
    fail context "explicit resolver failed for $pack"
    return 1
  fi
  printf '%s\n' "$pointer" >"$out.pointer.txt"
  codex debug prompt-input -c "developer_instructions=\"$pointer\"" "Reply with exactly OK." \
    >"$out.json" 2>&1 || {
      fail context "codex debug prompt-input failed: $(tail -1 "$out.json")"
      return 1
    }
  extract_context "$out.json" "$out.txt"
}

harness_load() {
  local ver out installed
  ver="$(codex --version 2>&1 | head -1)"
  out="$OUT/codex-plugin-list.json"
  codex plugin list --json >"$out" 2>&1 || true
  assert_grep load "plugin list" "$out" 'gfunc-skills@gfunc' || return
  installed="$(python3 - "$out" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
for entry in data.get("installed", []):
    if entry.get("pluginId") == "gfunc-skills@gfunc":
        print(entry.get("installedPath") or "")
        break
PY
)"
  if ! scripts/install --harness codex >"$OUT/codex-reinstall.txt" 2>&1; then
    fail load "reinstall failed: $(tail -1 "$OUT/codex-reinstall.txt")"
    return
  fi
  ls "$CODEX_HOME"/agents/*.toml >/dev/null 2>&1 \
    || { fail load "codex agents not installed under $CODEX_HOME/agents"; return; }
  ok load "cli=$ver; plugin list shows installed gfunc-skills@gfunc; agents present; reinstall idempotent"
}

harness_context() {
  local out pointer

  out="$OUT/codex-context"
  if codex_context_artifact /pack "$out"; then
    if assert_context_artifact context "explicit" "$out.txt" codex "$PACK"; then
      if grep -qF '"role": "developer"' "$out.json" 2>/dev/null; then
        matrix plugin-direct PASS "explicit resolver line in codex debug prompt-input developer message; profile=$PACK/references/harnesses/codex.md"
        ok context "plugin-direct: explicit resolver line reached the developer message without a hook"
      else
        matrix plugin-direct FAIL "adapter line is not in a developer message"
      fi
    else
      matrix plugin-direct FAIL "adapter/profile assertion failed"
    fi
  else
    matrix plugin-direct FAIL "explicit resolver/prompt render failed"
  fi

  # Codex package manifests have no agents component and its plugin hooks are
  # untrusted by default. Fresh children need a parent-supplied line; the rig
  # cannot observe a headless spawn, so this stays a manual gate.
  matrix plugin-child MANUAL "parent-supplied profile line to a fresh child; Codex 0.163.0 has no plugin agent component and no headless child prompt surface"

  clone_positive context codex /pack
  clone_shared context /pack
  matrix clone-child MANUAL "parent-supplied profile line; no headless fresh child spawn in this rig"

  # The design ships no hook at Codex's discovery path. This is the
  # hooks-disabled/untrusted case: the explicit route works without a hook.
  local cache="$CODEX_HOME/plugins/cache/gfunc/gfunc-skills"
  if find "$cache" -name hooks.json -print -quit 2>/dev/null | grep -q .; then
    fail context "a hooks/hooks.json exists at Codex's discovery path; explicit-only contract is broken"
    return
  fi
  ok context "codex hooks untrusted/disabled: no hooks/hooks.json shipped; explicit route works"
}

harness_negative() {
  local neg out cfg

  clone_negative negative codex /pack

  # Plugin-level missing profile: the resolver is the explicit route, and it
  # must exit non-zero with the harness name and profile path.
  neg="/tmp/codex-neg-missing"
  copy_pack /pack "$neg"
  rm -f "$neg/references/harnesses/codex.md"
  out="$OUT/codex-neg-missing.txt"
  local rc=0
  ( cd "$neg" && scripts/resolve-harness --harness codex ) >"$out" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ] && grep -q "profile not found" "$out" && grep -q codex "$out"; then
    ok negative "missing-profile control: resolver stopped with '$(tail -1 "$out")'"
  else
    fail negative "missing-profile control: exit=$rc reason=$(tail -1 "$out")"
    return
  fi

  # Listing-only: the installed plugin remains listed while a copy without the
  # resolver has no explicit route to a pointer.
  neg="/tmp/codex-neg-noresolver"
  copy_pack /pack "$neg"
  rm -f "$neg/scripts/resolve-harness"
  out="$OUT/codex-neg-noresolver.txt"
  ( cd "$neg" && scripts/resolve-harness --harness codex ) >"$out" 2>&1 || true
  printf '%s\n' "resolver missing in $neg" >>"$out"
  expect_context_rejected negative "listing-only" "$out" codex "$neg" || return
  listing_is_not_proof negative "$OUT/codex-plugin-list.json" "$OUT/context-reason-listing-only.txt"

  # Poisoned other-harness profiles: the explicit resolver selects codex.md
  # and the rendered developer message must not carry another marker.
  neg="/tmp/codex-neg-poison"
  copy_pack /pack "$neg"
  local h
  for h in $(other_harnesses codex); do
    printf '\nRIG_POISON_%s\n' "$h" >> "$neg/references/harnesses/$h.md"
  done
  out="$OUT/codex-neg-poison"
  if codex_context_artifact "$neg" "$out"; then
    if assert_context_artifact negative "poison" "$out.txt" codex "$neg"; then
      ok negative "poison control: other-harness profiles were not selected"
    fi
  fi
}

harness_smoke() {
  local key out
  key="${CODEX_API_KEY:-${OPENAI_API_KEY:-}}"
  if [ -n "$key" ]; then
    out="$OUT/smoke.jsonl"
    CODEX_API_KEY="$key" timeout 300 codex exec \
      --skip-git-repo-check \
      --sandbox danger-full-access \
      --dangerously-bypass-hook-trust \
      --json \
      'Use $gfunc-skills:sharpen. Quote the first sentence of the skill verbatim. Then reply DONE.' \
      < /dev/null >"$out" 2>&1 || true
    if assert_grep smoke "smoke stream" "$out" "$SMOKE_PHRASE" \
       && assert_grep smoke "smoke stream" "$out" "DONE"; then
      ok smoke "codex exec injected \$gfunc-skills:sharpen and replied DONE"
    fi
    return
  fi
  skip smoke "CODEX_API_KEY/OPENAI_API_KEY not set; explicit context proof ran in the context stage"
  out="$OUT/smoke-oracle.txt"
  codex debug prompt-input "hi" >"$out" 2>&1 || true
  if assert_grep smoke-oracle "oracle" "$out" 'gfunc-skills:sharpen'; then
    ok smoke-oracle "debug prompt-input lists gfunc-skills:sharpen with no credentials (catalog inventory only)"
  fi
}

harness_transcript() {
  local f report
  f="$(newest_file "$CODEX_HOME/sessions" 'rollout-*.jsonl')"
  if [ -z "$f" ]; then
    skip transcript "no rollout generated (only key-backed codex exec runs write one)"
    return
  fi
  cp "$f" "$OUT/"
  report="$OUT/codex-trail-report.txt"
  if timeout 60 python3 "$RIG/trail_report.py" codex "$f" >"$report" 2>&1; then
    ok transcript "$(sed -n '1p;/^models:/p' "$report" | tr '\n' ' ' | sed 's/  */ /g')"
  else
    fail transcript "trail reader: $(tail -1 "$report")"
  fi
}

harness_finish() { :; }

break_install()    { mv /pack/.claude-plugin /pack/.claude-plugin.hidden; }  # codex reads the same marketplace catalog
break_load()       { codex plugin remove gfunc-skills@gfunc --json >/dev/null 2>&1 || true; }
break_context()    { rm -f /pack/scripts/resolve-harness; }
break_negative()   { rm -rf /tmp/codex-neg-missing /tmp/codex-neg-noresolver /tmp/codex-neg-poison; }
break_smoke() {
  if [ -n "${CODEX_API_KEY:-${OPENAI_API_KEY:-}}" ]; then
    rm -rf "$CODEX_HOME"/plugins/cache/gfunc/gfunc-skills/*/skills/sharpen
  else
    codex plugin remove gfunc-skills@gfunc --json >/dev/null 2>&1 || true
  fi
}
break_transcript() { newest_file "$CODEX_HOME/sessions" 'rollout-*.jsonl' | xargs -r truncate -s 0; }
