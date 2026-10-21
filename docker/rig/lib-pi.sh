#!/usr/bin/env bash
# lib-pi.sh: load/smoke/transcript stages for pi-coding-agent 1.3.0.
# Authority: research 12 S4 — load proof `pi list`; the smoke always runs
# against the OpenAI-compatible mock (models.json, research 12 S0), so it is
# green with zero credentials. `/skill:` injects even disable-model-invocation
# skills (research 12 S4.6); assert the injected body by its unique phrase.

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

harness_load() {
  local ver out
  ver="$(pi --version 2>&1 | head -1)"
  out="$OUT/pi-list.txt"
  pi list >"$out" 2>&1 || true
  if assert_grep load "pi list" "$out" "/pack"; then
    ok load "cli=$ver; pi list shows the installed package"
  fi
}

harness_smoke() {
  local out report
  ensure_mock || return
  out="$OUT/smoke.jsonl"
  (cd /pack && timeout 180 pi -p --mode json --model mock/mock-1 \
    "/skill:sharpen Quote the first sentence of the skill verbatim. Then reply DONE." \
    >"$out" 2>&1) || true
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

harness_finish() {
  :
}

break_install() {
  # pi tolerates every pack-level corruption (empty dir, EISDIR/ENOTDIR
  # settings, unreadable agent dir — all verified) and the installer
  # re-derives the pack path from its own location, so corrupt the install
  # tool itself: a shim pi that fails the install stage.
  cat > /usr/local/bin/pi <<'EOF'
#!/bin/sh
echo "pi: simulated install failure (RIG_BREAK pi:install)" >&2
exit 1
EOF
  chmod +x /usr/local/bin/pi
}
break_load()  { pi remove /pack >/dev/null 2>&1 || true; }
break_smoke() { rm -rf /pack/skills/sharpen; }   # pi loads the package in place
break_transcript() { newest_file "$PI_CODING_AGENT_DIR/sessions" '*.jsonl' | xargs -r truncate -s 0; }
