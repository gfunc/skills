#!/usr/bin/env bash
# lib-pi.sh: load/context/negative/smoke/transcript stages for pi-coding-agent
# 1.3.0.
#
# No-key proof surface: the package extension adds the adapter as a named
# prompt section, and the mock model request contains it. `pi list` is
# inventory only; it never satisfies the context cell.

SMOKE_PHRASE="ask how a top expert would approach this task"

harness_prepare() {
  export PI_CODING_AGENT_DIR="$HOME/.pi/agent"
  mkdir -p "$PI_CODING_AGENT_DIR/agents"
  cat > "$PI_CODING_AGENT_DIR/models.json" <<EOF
{
  "\$schema": "https://pi.dev/schemas/models.schema.json",
  "providers": {
    "mock": {
      "baseUrl": "$(mock_base_url)",
      "api": "openai-completions",
      "apiKey": "mock-key",
      "models": [{ "id": "mock-1" }]
    }
  }
}
EOF
  # Agents are not package resources (research 12 S4.6): copy them into the
  # agent dir for parity with the codex install step.
  cp /pack/agents/*.md "$PI_CODING_AGENT_DIR/agents/" 2>/dev/null || true
}

# pi_neg_config <dir> — config root for a package loaded via `pi -e`.
pi_neg_config() {
  mkdir -p "$1"
  cp "$PI_CODING_AGENT_DIR/models.json" "$1/models.json"
}

# pi_probe_context <package-dir> <config-dir> <out-prefix> [use-e]
# use-e=1 loads the package per invocation (`pi -e`) for negative copies;
# otherwise the installed package in the config root is used.
pi_probe_context() {
  local pack="$1" cfg="$2" out="$3" use_e="${4:-0}"
  local args=(-p --mode json --model mock/mock-1 "Reply with exactly OK.")
  [ "$use_e" = "1" ] && args=(-e "$pack" "${args[@]}")
  : > /tmp/mock-llm/requests.log
  ( cd "$pack" && PI_CODING_AGENT_DIR="$cfg" timeout 180 pi "${args[@]}" ) \
    >"$out.session.jsonl" 2>&1 || true
  extract_context /tmp/mock-llm/requests.log "$out.txt"
}

harness_load() {
  local ver out
  ver="$(pi --version 2>&1 | head -1)"
  out="$OUT/pi-list.txt"
  pi list >"$out" 2>&1 || true
  assert_grep load "pi list" "$out" "/pack" || return
  if ! scripts/install --harness pi >"$OUT/pi-reinstall.txt" 2>&1; then
    fail load "reinstall failed: $(tail -1 "$OUT/pi-reinstall.txt")"
    return
  fi
  ok load "cli=$ver; pi list shows the installed package; reinstall idempotent"
}

harness_context() {
  local out

  ensure_mock || { matrix plugin-direct FAIL "mock unavailable"; return; }
  out="$OUT/pi-context"
  pi_probe_context /pack "$PI_CODING_AGENT_DIR" "$out"
  if assert_context_artifact context "plugin" "$out.txt" pi "$PACK"; then
    matrix plugin-direct PASS "before_agent_start extension section in the mock request; profile=$PACK/references/harnesses/pi.md"
    ok context "plugin-direct: package extension delivered the adapter line without a build"
  else
    matrix plugin-direct FAIL "extension adapter/profile assertion failed"
  fi

  # Pi has no stock subagent tool; the pack deliberately ships no subagent
  # extension. The contract is a disclosed sequential fallback, not a hidden
  # pass.
  if [ -e "$PACK/extensions/subagent" ]; then
    matrix plugin-child FAIL "pack unexpectedly ships a subagent extension; matrix must be updated"
  else
    matrix plugin-child MANUAL "no stock Pi subagent tool and no extension shipped; sequential fallback with disclosure"
  fi

  clone_positive context pi /pack
  clone_shared context /pack
  matrix clone-child MANUAL "parent-supplied profile line; Pi has no stock child agent to observe headlessly"
}

harness_negative() {
  local neg out cfg

  clone_negative negative pi /pack

  # Missing profile: the extension still delivers a pointer but must add the
  # HARNESS CONTRACT UNAVAILABLE disclosure.
  neg="/tmp/pi-neg-missing"
  copy_pack /pack "$neg"
  rm -f "$neg/references/harnesses/pi.md"
  cfg="$HOME/.pi/agent-neg-missing"
  pi_neg_config "$cfg"
  out="$OUT/pi-neg-missing-context"
  pi_probe_context "$neg" "$cfg" "$out" 1
  expect_context_rejected negative "missing-profile" "$out.txt" pi "$neg" || return
  grep -q "HARNESS CONTRACT UNAVAILABLE" "$out.txt" \
    || { fail negative "missing-profile control: extension did not disclose unavailability"; return; }

  # Listing-only: `pi list` still shows the positive install while a copy with
  # no extension delivers no adapter line.
  neg="/tmp/pi-neg-noext"
  copy_pack /pack "$neg"
  rm -f "$neg/extensions/harness-contract.ts"
  cfg="$HOME/.pi/agent-neg-noext"
  pi_neg_config "$cfg"
  out="$OUT/pi-neg-noext-context"
  pi_probe_context "$neg" "$cfg" "$out" 1
  expect_context_rejected negative "listing-only" "$out.txt" pi "$neg" || return
  listing_is_not_proof negative "$OUT/pi-list.txt" "$OUT/context-reason-listing-only.txt"

  # Poisoned other-harness profiles must not reach the active extension.
  neg="/tmp/pi-neg-poison"
  copy_pack /pack "$neg"
  poison_other_profiles "$neg" pi
  cfg="$HOME/.pi/agent-neg-poison"
  pi_neg_config "$cfg"
  out="$OUT/pi-neg-poison-context"
  pi_probe_context "$neg" "$cfg" "$out" 1
  if assert_context_artifact negative "poison" "$out.txt" pi "$neg"; then
    ok negative "poison control: other-harness profiles were not selected"
  fi
}

harness_smoke() {
  local out report
  ensure_mock || return
  out="$OUT/smoke.jsonl"
  ( cd /pack && timeout 180 pi -p --mode json --model mock/mock-1 \
    "/skill:sharpen Quote the first sentence of the skill verbatim. Then reply DONE." \
    >"$out" 2>&1 ) || true
  if assert_grep smoke "smoke stream" "$out" 'sharpen/SKILL.md' \
     && assert_grep smoke "smoke stream" "$out" "$SMOKE_PHRASE" \
     && assert_grep smoke "smoke stream" "$out" 'agent_settled'; then
    ok smoke "mock model call injected the /skill:sharpen body"
  fi
}

harness_transcript() {
  local f report
  f="$(newest_file "$PI_CODING_AGENT_DIR/sessions" '*.jsonl')"
  if [ -z "$f" ]; then
    fail transcript "no session file under $PI_CODING_AGENT_DIR/sessions"
    return
  fi
  cp "$f" "$OUT/"
  report="$OUT/pi-trail-report.txt"
  if timeout 60 python3 "$RIG/trail_report.py" pi "$f" >"$report" 2>&1; then
    ok transcript "$(sed -n '1p;/^record_types:/p' "$report" | tr '\n' ' ' | sed 's/  */ /g')"
  else
    fail transcript "trail reader: $(tail -1 "$report")"
  fi
}

harness_finish() { :; }

break_install() {
  cat > /usr/local/bin/pi <<'EOF'
#!/bin/sh
echo "pi: simulated install failure (RIG_BREAK pi:install)" >&2
exit 1
EOF
  chmod +x /usr/local/bin/pi
}
break_load()  { pi remove /pack >/dev/null 2>&1 || true; }
break_context() { mv /pack/extensions/harness-contract.ts /pack/extensions/harness-contract.ts.hidden; }
break_negative() { rm -rf /tmp/pi-neg-missing /tmp/pi-neg-noext /tmp/pi-neg-poison; }
break_smoke() { rm -rf /pack/skills/sharpen; }   # pi loads the package in place
break_transcript() { newest_file "$PI_CODING_AGENT_DIR/sessions" '*.jsonl' | xargs -r truncate -s 0; }
