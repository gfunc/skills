#!/usr/bin/env bash
# lib-kimi.sh: load/smoke/transcript stages for kimi-code 2.2.0.
# Authority: research 12 S1 — no plugin install CLI (scripts/install pre-seeds
# the managed copy + installed.json); print mode does NOT dispatch /skill:
# (S1.3), so the smoke overlays sessionStart.skill on the managed copy and the
# assertion is plugin.session_start content in wire.jsonl. The run always uses
# the OpenAI-compatible mock (S0/S1.2), so it is green with zero credentials.

SMOKE_PHRASE="ask how a top expert would approach this task"
KIMI_MANAGED_REL="plugins/managed/gfunc-skills"

harness_prepare() {
  export KIMI_CODE_HOME="$HOME/.kimi-code"
  mkdir -p "$KIMI_CODE_HOME"
  cat > "$KIMI_CODE_HOME/config.toml" <<EOF
default_model = "mock/mock-1"

[providers.mock]
type = "openai"
base_url = "$(mock_base_url)"
api_key_env = "MOCK_API_KEY"

[models."mock/mock-1"]
provider = "mock"
model = "mock-1"
max_context_size = 128000
EOF
  export MOCK_API_KEY="${MOCK_API_KEY:-rig-mock}"
  export KIMI_DISABLE_TELEMETRY=1
}

harness_load() {
  local ver out
  ver="$(kimi --version 2>&1 | head -1)"
  out="$OUT/kimi-preseed-check.txt"
  if KIMI_CODE_HOME="$KIMI_CODE_HOME" python3 - "$KIMI_CODE_HOME" "$KIMI_MANAGED_REL" "$PACK" >"$out" 2>&1 <<'PY'
import json, os, sys
kh, rel, pack = sys.argv[1], sys.argv[2], sys.argv[3]
reg = json.load(open(os.path.join(kh, "plugins/installed.json")))
entry = next((p for p in reg.get("plugins", []) if p.get("id") == "gfunc-skills"), None)
assert entry and entry.get("enabled") is True, "gfunc-skills missing or disabled in installed.json"
root = entry["root"]
assert os.path.isfile(os.path.join(root, "kimi.plugin.json")), "managed copy missing kimi.plugin.json"
want = sorted(d for d in os.listdir(os.path.join(pack, "skills")) if os.path.isfile(os.path.join(pack, "skills", d, "SKILL.md")))
got = sorted(d for d in os.listdir(os.path.join(root, "skills")) if os.path.isfile(os.path.join(root, "skills", d, "SKILL.md")))
assert got == want, "managed copy skills differ from pack: missing=%s extra=%s" % (sorted(set(want) - set(got)), sorted(set(got) - set(want)))
print("installed.json: gfunc-skills enabled, root=" + root)
print("skills (%d): %s" % (len(got), ", ".join(got)))
PY
  then
    :
  else
    fail load "pre-seed registry/managed copy invalid: $(tail -1 "$out")"
    return
  fi
  local nskills
  nskills="$(grep -o '^skills ([0-9]*)' "$out" || true)"
  out="$OUT/kimi-doctor.txt"
  kimi doctor >"$out" 2>&1 || true
  if ! grep -q "OK config.toml" "$out" 2>/dev/null; then
    fail load "kimi doctor did not validate config.toml: $(tail -1 "$out")"
    return
  fi
  ok load "cli=$ver; pre-seed registry + managed copy valid ($nskills); doctor OK config.toml"
}

harness_smoke() {
  local out report
  # sessionStart.skill overlay on the MANAGED copy (research 12 S1.3); the
  # production manifest deliberately does not set it.
  python3 - "$KIMI_CODE_HOME" "$KIMI_MANAGED_REL" >"$OUT/kimi-overlay.txt" 2>&1 <<'PY' || { fail smoke "sessionStart overlay failed: $(cat "$OUT/kimi-overlay.txt")"; return; }
import json, os, sys
kh, rel = sys.argv[1], sys.argv[2]
p = os.path.join(kh, rel, "kimi.plugin.json")
o = json.load(open(p))
o["sessionStart"] = {"skill": "sharpen"}
json.dump(o, open(p, "w"), indent=2)
print("sessionStart.skill=sharpen overlaid on managed copy")
PY
  ensure_mock || return
  out="$OUT/smoke.txt"
  (cd /pack && timeout 180 kimi -p \
    "Quote the first sentence of the skill you were given, verbatim. Then reply DONE." \
    --output-format text >"$out" 2>&1) || true
  if ! grep -q . "$out" 2>/dev/null; then
    fail smoke "kimi printed nothing"
    return
  fi
  report="$OUT/kimi-wire-check.txt"
  f="$(newest_file "$KIMI_CODE_HOME/sessions" 'wire.jsonl')"
  if [ -z "$f" ]; then
    fail smoke "no wire.jsonl session transcript generated"
    return
  fi
  if timeout 60 python3 "$RIG/trail_report.py" kimi "$f" \
       --expect-session-start-phrase "$SMOKE_PHRASE" >"$report" 2>&1; then
    ok smoke "sessionStart.skill=sharpen injected into the prompt ($(grep -o 'plugin_session_start_bytes: [0-9]*' "$report"))"
  else
    fail smoke "wire check: $(tail -1 "$report")"
  fi
}

harness_transcript() {
  local f report
  f="$(newest_file "$KIMI_CODE_HOME/sessions" 'wire.jsonl')"
  if [ -z "$f" ]; then
    fail transcript "no wire.jsonl under $KIMI_CODE_HOME/sessions"
    return
  fi
  cp "$f" "$OUT/"
  report="$OUT/kimi-trail-report.txt"
  if timeout 60 python3 "$RIG/trail_report.py" kimi "$f" >"$report" 2>&1; then
    ok transcript "$(sed -n '1p;/^models:/p' "$report" | tr '\n' ' ' | sed 's/  */ /g')"
  else
    fail transcript "trail reader: $(tail -1 "$report")"
  fi
}

harness_finish() {
  cp /tmp/mock-llm/requests.log "$OUT/mock-requests.log" 2>/dev/null || true
}

break_install() { mv /pack/kimi.plugin.json /pack/kimi.plugin.json.hidden; }
break_load() {
  python3 - "$KIMI_CODE_HOME" <<'PY'
import json, os, sys
p = os.path.join(os.environ["KIMI_CODE_HOME"], "plugins/installed.json")
o = json.load(open(p))
for e in o.get("plugins", []):
    if e.get("id") == "gfunc-skills":
        e["enabled"] = False
json.dump(o, open(p, "w"), indent=2)
PY
}
break_smoke() { rm -rf "$KIMI_CODE_HOME/$KIMI_MANAGED_REL/skills/sharpen"; }
break_transcript() { newest_file "$KIMI_CODE_HOME/sessions" 'wire.jsonl' | xargs -r truncate -s 0; }
