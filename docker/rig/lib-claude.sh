#!/usr/bin/env bash
# lib-claude.sh: load/context/negative/smoke/transcript stages for Claude Code
# 2.1.307.
#
# No-key proof surface: the plugin's SessionStart hook is emitted as a
# `system/hook_response` event before the auth failure, so the adapter line is
# visible in the stream and in the transcript. Inventory (`plugin details`) is
# never accepted as context proof; it only proves the plugin registered.

SMOKE_PHRASE="ask how a top expert would approach this task"

harness_prepare() {
  export CLAUDE_CONFIG_DIR="$HOME/.claude"
  mkdir -p "$CLAUDE_CONFIG_DIR"
}

harness_load() {
  local ver out want
  ver="$(claude --version 2>&1 | head -1)"
  want="$(ls -d "$PACK"/skills/*/ | wc -l | tr -d ' ')"
  agents="$(ls "$PACK"/agents/*.md 2>/dev/null | wc -l | tr -d ' ')"
  out="$OUT/claude-plugin-details.txt"
  claude plugin details gfunc-skills@gfunc >"$out" 2>&1 || true
  assert_grep load "plugin details" "$out" "Skills ($want)" || return
  assert_grep load "plugin details" "$out" "Agents ($agents)" || return
  assert_grep load "plugin details" "$out" "Hooks (2)" || return
  if ! scripts/install --harness claude >"$OUT/claude-reinstall.txt" 2>&1; then
    fail load "reinstall failed: $(tail -1 "$OUT/claude-reinstall.txt")"
    return
  fi
  ok load "cli=$ver; plugin details lists Skills ($want), Agents ($agents), Hooks (2); reinstall idempotent"
}

# claude_context_probe <plugin-dir-or-empty> <out-prefix> [config-dir]
# Runs one no-key session and extracts the hook_response text. With a plugin
# dir the session loads that copy in place; otherwise the installed plugin
# loads normally. Negative probes get a fresh config dir so the installed
# plugin cannot mask the corrupt copy.
claude_context_probe() {
  local plugin_dir="$1" out="$2" cfg="${3:-}"
  local args=(-p "hi" --output-format stream-json --verbose)
  [ -z "$plugin_dir" ] || args+=(--plugin-dir "$plugin_dir")
  if [ -n "$cfg" ]; then
    mkdir -p "$cfg"
    CLAUDE_CONFIG_DIR="$cfg" timeout 120 claude "${args[@]}" >"$out.stream.jsonl" 2>&1 || true
  else
    timeout 120 claude "${args[@]}" >"$out.stream.jsonl" 2>&1 || true
  fi
  extract_context "$out.stream.jsonl" "$out.txt"
}

harness_context() {
  local out

  out="$OUT/claude-context"
  claude_context_probe "" "$out"
  if assert_context_artifact context "plugin" "$out.txt" claude "$PACK"; then
    matrix plugin-direct PASS "SessionStart hook response carried the adapter; profile=$PACK/references/harnesses/claude.md"
    ok context "plugin-direct: no-key SessionStart hook delivered the adapter line"
  else
    matrix plugin-direct FAIL "hook adapter/profile assertion failed"
  fi

  # A direct --init-only run is a second no-key surface: it exits 0 and the
  # debug log records the hook output without a model call.
  if timeout 120 claude --init-only --debug-file "$OUT/claude-init-debug.log" \
       >"$OUT/claude-init.jsonl" 2>&1; then
    if grep -qF "harness=claude" "$OUT/claude-init-debug.log" 2>/dev/null; then
      ok context "--init-only: SessionStart hook output present in the debug log"
    else
      fail context "--init-only did not record the SessionStart hook output"
    fi
  else
    fail context "--init-only failed"
  fi

  # The SubagentStart hook is the documented child mechanism. The hook output
  # is verifiable without a model; a fresh child dispatch is not observable
  # headlessly, so the cell stays MANUAL rather than being called a pass.
  if CLAUDE_PLUGIN_ROOT="$PACK" bash "$PACK/hooks/harness-context.sh" SubagentStart \
       >"$OUT/claude-subagent-hook.json" 2>&1; then
    if grep -qF '"hookEventName":"SubagentStart"' "$OUT/claude-subagent-hook.json" \
       && grep -qF "harness=claude" "$OUT/claude-subagent-hook.json"; then
      matrix plugin-child MANUAL "SubagentStart hook emits the adapter; fresh child dispatch needs a model and is not headlessly observable"
      ok context "plugin-child: SubagentStart hook contract emits harness=claude (manual gate for live child)"
    else
      matrix plugin-child FAIL "SubagentStart hook output is missing the adapter or event name"
    fi
  else
    matrix plugin-child FAIL "SubagentStart hook failed to run"
  fi

  clone_positive context claude /pack
  clone_shared context /pack
  matrix clone-child MANUAL "parent-supplied profile line; no headless fresh child dispatch in this rig"
}

harness_negative() {
  local neg out

  clone_negative negative claude /pack

  # Plugin-level missing profile: the hook must disclose unavailability and
  # the adapter reader must reject the pointer.
  neg="/tmp/claude-neg-missing"
  copy_pack /pack "$neg"
  rm -f "$neg/references/harnesses/claude.md"
  out="$OUT/claude-neg-missing-context"
  claude_context_probe "$neg" "$out" "$HOME/.claude-neg"
  expect_context_rejected negative "missing-profile" "$out.txt" claude "$neg" || return
  grep -q "HARNESS CONTRACT UNAVAILABLE" "$out.txt" \
    || { fail negative "missing-profile control: hook did not disclose unavailability"; return; }

  # Listing-only: the installed plugin still inventories skills while a copy
  # with no hook artifact delivers no adapter line.
  neg="/tmp/claude-neg-nohooks"
  copy_pack /pack "$neg"
  rm -f "$neg/hooks/claude-hooks.json"
  out="$OUT/claude-neg-nohooks-context"
  claude_context_probe "$neg" "$out" "$HOME/.claude-neg"
  expect_context_rejected negative "listing-only" "$out.txt" claude "$neg" || return
  listing_is_not_proof negative "$OUT/claude-plugin-details.txt" "$OUT/context-reason-listing-only.txt"

  # Poisoned other-harness profiles must not reach the active hook context.
  neg="/tmp/claude-neg-poison"
  copy_pack /pack "$neg"
  poison_other_profiles "$neg" claude
  out="$OUT/claude-neg-poison-context"
  claude_context_probe "$neg" "$out" "$HOME/.claude-neg"
  if assert_context_artifact negative "poison" "$out.txt" claude "$neg"; then
    ok negative "poison control: other-harness profiles were not selected"
  fi
}

harness_smoke() {
  local out want
  if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    out="$OUT/smoke.json"
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
  skip smoke "ANTHROPIC_API_KEY not set; context stage owns the no-key adapter proof"
  want="$(ls -d "$PACK"/skills/*/ | wc -l | tr -d ' ')"
  agents="$(ls "$PACK"/agents/*.md 2>/dev/null | wc -l | tr -d ' ')"
  out="$OUT/smoke-oracle.txt"
  claude plugin details gfunc-skills@gfunc >"$out" 2>&1 || true
  if assert_grep smoke-oracle "oracle" "$out" "Skills ($want)" \
     && assert_grep smoke-oracle "oracle" "$out" "Agents ($agents)"; then
    ok smoke-oracle "plugin details inventories Skills ($want), Agents ($agents) without credentials (inventory only)"
  fi
  # Structural run: system/init is emitted before the auth failure, so one
  # no-key -p run leaves a real current-format transcript for the trail reader.
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

harness_finish() { :; }

break_install()    { mv /pack/.claude-plugin /pack/.claude-plugin.hidden; }
break_load()       { claude plugin uninstall gfunc-skills@gfunc -y >/dev/null 2>&1 || true; }
break_context()    { mv /pack/hooks/claude-hooks.json /pack/hooks/claude-hooks.json.hidden; }
break_negative()   { rm -rf /tmp/claude-neg-missing /tmp/claude-neg-nohooks /tmp/claude-neg-poison; }
break_smoke() {
  if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    rm -rf /pack/skills/sharpen          # local marketplace is read in place
  else
    claude plugin uninstall gfunc-skills@gfunc -y >/dev/null 2>&1 || true
  fi
}
break_transcript() { newest_file "$CLAUDE_CONFIG_DIR/projects" '*.jsonl' | xargs -r truncate -s 0; }
