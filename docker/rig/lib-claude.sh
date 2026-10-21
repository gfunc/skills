#!/usr/bin/env bash
# lib-claude.sh: load/smoke/transcript stages for Claude Code 2.1.296.
# Authority: research 12 S2 — local-marketplace install (scripts/install),
# load proof `claude plugin details`, zero-credential oracle is the same
# command; smoke skill `sharpen` asserted by name with its unique phrase.

SMOKE_PHRASE="ask how a top expert would approach this task"

harness_prepare() {
  export CLAUDE_CONFIG_DIR="$HOME/.claude"
  mkdir -p "$CLAUDE_CONFIG_DIR"
}

harness_load() {
  local ver out
  ver="$(claude --version 2>&1 | head -1)"
  out="$OUT/claude-plugin-details.txt"
  claude plugin details gfunc-skills@gfunc >"$out" 2>&1 || true
  if assert_grep load "plugin details" "$out" "Skills (61)" \
     && assert_grep load "plugin details" "$out" "Agents (2)"; then
    ok load "cli=$ver; plugin details inventories Skills (61), Agents (2)"
  fi
}

harness_smoke() {
  local out="$OUT/smoke.json"
  if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    timeout 300 claude \
      -p "/gfunc-skills:sharpen Quote the first sentence of this skill verbatim. Then reply DONE." \
      --output-format json --permission-mode dontAsk --max-budget-usd 1 \
      >"$out" 2>&1 || true
    if assert_grep smoke "smoke output" "$out" '"is_error":false' \
       && assert_grep smoke "smoke output" "$out" "$SMOKE_PHRASE" \
       && assert_grep smoke "smoke output" "$out" "DONE"; then
      ok smoke "real model call dispatched /gfunc-skills:sharpen and quoted the skill"
    fi
    return
  fi
  skip smoke "ANTHROPIC_API_KEY not set; zero-credential oracle instead of a model call"
  out="$OUT/smoke-oracle.txt"
  claude plugin details gfunc-skills@gfunc >"$out" 2>&1 || true
  if assert_grep smoke-oracle "oracle" "$out" "Skills (61)" \
     && assert_grep smoke-oracle "oracle" "$out" "Agents (2)"; then
    ok smoke-oracle "plugin details inventories Skills (61), Agents (2) without credentials"
  fi
  # Structural run (research 12 S2.2): system/init is emitted before the auth
  # failure, so one no-key -p run both proves the plugin loads in-session and
  # leaves a real current-format transcript for the trail reader.
  out="$OUT/claude-structural.jsonl"
  timeout 120 claude -p "hi" --output-format stream-json --verbose >"$out" 2>&1 || true
  if assert_grep smoke-oracle "structural run" "$out" '"subtype":"init"' \
     && assert_grep smoke-oracle "structural run" "$out" 'gfunc-skills'; then
    ok smoke-oracle "no-key session init lists the gfunc-skills plugin"
  fi
}

harness_transcript() {
  local f report
  f="$(newest_file "$CLAUDE_CONFIG_DIR/projects" '*.jsonl')"
  if [ -z "$f" ]; then
    fail transcript "no session transcript under $CLAUDE_CONFIG_DIR/projects"
    return
  fi
  cp "$f" "$OUT/"
  report="$OUT/claude-trail-report.txt"
  if timeout 60 python3 "$RIG/trail_report.py" claude "$f" >"$report" 2>&1; then
    ok transcript "$(sed -n '1p;/^models:/p' "$report" | tr '\n' ' ' | sed 's/  */ /g')"
  else
    fail transcript "trail reader: $(tail -1 "$report")"
  fi
}

harness_finish() {
  :
}

break_install()    { mv /pack/.claude-plugin /pack/.claude-plugin.hidden; }
break_load()       { claude plugin uninstall gfunc-skills@gfunc -y >/dev/null 2>&1 || true; }
break_smoke() {
  if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    rm -rf /pack/skills/sharpen          # local marketplace is read in place
  else
    claude plugin uninstall gfunc-skills@gfunc -y >/dev/null 2>&1 || true
  fi
}
break_transcript() { newest_file "$CLAUDE_CONFIG_DIR/projects" '*.jsonl' | xargs -r truncate -s 0; }
