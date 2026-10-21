#!/usr/bin/env bash
# lib-codex.sh: load/smoke/transcript stages for Codex CLI 0.163.0.
# Authority: research 12 S3 — load proof `codex plugin list --json`,
# zero-credential oracle `codex debug prompt-input` (lists every plugin skill;
# assert the smoke skill by name — never a count: 59/61 under the list budget).

SMOKE_PHRASE="ask how a top expert would approach this task"

harness_prepare() {
  export CODEX_HOME="$HOME/.codex"
  mkdir -p "$CODEX_HOME"
}

harness_load() {
  local ver out
  ver="$(codex --version 2>&1 | head -1)"
  out="$OUT/codex-plugin-list.json"
  codex plugin list --json >"$out" 2>&1 || true
  if assert_grep load "plugin list" "$out" 'gfunc-skills@gfunc'; then
    ok load "cli=$ver; plugin list shows installed gfunc-skills@gfunc"
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
  skip smoke "CODEX_API_KEY/OPENAI_API_KEY not set; zero-credential oracle instead of a model call"
  out="$OUT/smoke-oracle.txt"
  codex debug prompt-input "hi" >"$out" 2>&1 || true
  if assert_grep smoke-oracle "oracle" "$out" 'gfunc-skills:sharpen'; then
    ok smoke-oracle "debug prompt-input lists gfunc-skills:sharpen with no credentials"
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

harness_finish() {
  :
}

break_install()    { mv /pack/.claude-plugin /pack/.claude-plugin.hidden; }  # codex reads the same marketplace catalog
break_load()       { codex plugin remove gfunc-skills@gfunc --json >/dev/null 2>&1 || true; }
break_smoke() {
  if [ -n "${CODEX_API_KEY:-${OPENAI_API_KEY:-}}" ]; then
    rm -rf "$CODEX_HOME"/plugins/cache/gfunc/gfunc-skills/*/skills/sharpen
  else
    codex plugin remove gfunc-skills@gfunc --json >/dev/null 2>&1 || true
  fi
}
break_transcript() { newest_file "$CODEX_HOME/sessions" 'rollout-*.jsonl' | xargs -r truncate -s 0; }
