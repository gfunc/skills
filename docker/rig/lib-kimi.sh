#!/usr/bin/env bash
# lib-kimi.sh: load/context/negative/smoke/transcript stages for kimi-code 2.3.0.
#
# The production adapter is the manifest's systemPromptPath
# (./references/adapters/kimi.md). The no-key surface is the mock model
# request: the adapter line must be present in the system message, and the
# named profile must exist in the managed copy. The old test-only
# sessionStart.skill overlay is gone; nothing here edits the installed
# manifest to make the proof pass.

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

kimi_plugin_root_for() {
  python3 - "$1" <<'PY'
import json, os, sys
home = sys.argv[1]
reg = json.load(open(os.path.join(home, "plugins/installed.json")))
entry = next((p for p in reg.get("plugins", []) if p.get("id") == "gfunc-skills"), None)
if not entry or entry.get("enabled") is not True or not entry.get("root"):
    sys.exit(1)
print(entry["root"])
PY
}

# kimi_listing_for <home> <out> — inventory only: registry entry, managed
# manifest, and skill directories. Deliberately not a context assertion.
kimi_listing_for() {
  local home="$1" out="$2"
  python3 - "$home" >"$out" 2>&1 <<'PY'
import json, os, sys
home = sys.argv[1]
reg = json.load(open(os.path.join(home, "plugins/installed.json")))
entry = next((p for p in reg.get("plugins", []) if p.get("id") == "gfunc-skills"), None)
assert entry and entry.get("enabled") is True, "gfunc-skills missing or disabled in installed.json"
root = entry["root"]
assert os.path.isfile(os.path.join(root, "kimi.plugin.json")), "managed copy missing kimi.plugin.json"
skills = sorted(d for d in os.listdir(os.path.join(root, "skills"))
                if os.path.isfile(os.path.join(root, "skills", d, "SKILL.md")))
assert skills, "managed copy has no skills"
print("installed.json: gfunc-skills enabled, root=" + root)
print("skills (%d): %s" % (len(skills), ", ".join(skills)))
PY
}

# kimi_probe_context <home> <cwd> <plain-out>
kimi_probe_context() {
  local home="$1" cwd="$2" out="$3"
  : > /tmp/mock-llm/requests.log
  ( cd "$cwd" && KIMI_CODE_HOME="$home" timeout 180 kimi -p \
      "Reply with exactly OK." --output-format text ) >"$out.session" 2>&1 || true
  extract_context /tmp/mock-llm/requests.log "$out"
}

kimi_install_neg() {
  local pack="$1" home="$2" log="$3"
  rm -rf "$home"
  mkdir -p "$home"
  cp "$KIMI_CODE_HOME/config.toml" "$home/config.toml"
  KIMI_CODE_HOME="$home" scripts/install --harness kimi --pack-root "$pack" >"$log" 2>&1
}

harness_load() {
  local ver out again before after
  ver="$(kimi --version 2>&1 | head -1)"
  out="$OUT/kimi-inventory.txt"
  if ! kimi_listing_for "$KIMI_CODE_HOME" "$out"; then
    fail load "inventory invalid: $(tail -1 "$out")"
    return
  fi
  before="$(sha256sum "$KIMI_CODE_HOME/plugins/installed.json" | awk '{print $1}')"
  if ! again="$(scripts/install --harness kimi 2>&1)"; then
    fail load "reinstall failed: $(printf '%s\n' "$again" | tail -1)"
    return
  fi
  after="$(sha256sum "$KIMI_CODE_HOME/plugins/installed.json" | awk '{print $1}')"
  [ "$before" = "$after" ] || { fail load "reinstall changed installed.json"; return; }
  ok load "cli=$ver; inventory valid; reinstall idempotent ($(sed -n '2p' "$out"))"
}

harness_context() {
  local managed out child
  managed="$(kimi_plugin_root_for "$KIMI_CODE_HOME")" \
    || { fail context "installed.json has no enabled managed root"; matrix plugin-direct FAIL "no managed root"; return; }
  ensure_mock || { matrix plugin-direct FAIL "mock unavailable"; return; }

  out="$OUT/kimi-context.txt"
  kimi_probe_context "$KIMI_CODE_HOME" /pack "$out"
  if assert_context_artifact context "plugin" "$out" kimi "$managed"; then
    matrix plugin-direct PASS "systemPromptPath adapter in the mock model request; profile=$managed/references/harnesses/kimi.md"
    ok context "plugin-direct: adapter line and kimi profile marker arrived without a test overlay"
  else
    matrix plugin-direct FAIL "adapter/profile assertion failed"
  fi

  # Child pre-check: kimi --agent starts a custom agent template. A custom
  # template must retain ${plugin_sections} (or ${base_prompt}) to receive the
  # enabled plugin contribution; this probe is the no-key evidence for the
  # plugin-child cell.
  : > /tmp/mock-llm/requests.log
  ( cd /pack && KIMI_CODE_HOME="$KIMI_CODE_HOME" timeout 180 kimi \
      --agent poteto-agent -p "Reply with exactly OK." --output-format text ) \
    >"$OUT/kimi-child-session.out" 2>&1 || true
  extract_context /tmp/mock-llm/requests.log "$OUT/kimi-child.txt"
  if grep -qF "harness=kimi" "$OUT/kimi-child.txt" 2>/dev/null; then
    matrix plugin-child PASS "custom agent template received the plugin adapter"
    ok context "plugin-child: custom agent template received the adapter"
  else
    matrix plugin-child FAIL "custom agent template (agents/poteto-agent.md) did not receive the plugin adapter; it needs \${plugin_sections} or \${base_prompt} (ticket 12 owns agents)"
  fi

  clone_positive context kimi /pack
  clone_shared context /pack
  matrix clone-child MANUAL "parent-supplied profile line; no headless delegated spawn in this rig"
}

harness_negative() {
  local neg home out managed

  clone_negative negative kimi /pack

  # Plugin-level missing profile: install the complete pack, then remove the
  # active profile from the managed copy. The installer has already checked
  # the copy, so this isolates the adapter/reader behavior.
  home="$HOME/.kimi-code-neg-missing"
  kimi_install_neg /pack "$home" "$OUT/kimi-neg-missing-install.txt" \
    || { fail negative "negative install failed: $(tail -1 "$OUT/kimi-neg-missing-install.txt")"; return; }
  managed="$(kimi_plugin_root_for "$home")" || { fail negative "negative managed root missing"; return; }
  rm -f "$managed/references/harnesses/kimi.md"
  out="$OUT/kimi-neg-missing-context.txt"
  kimi_probe_context "$home" /pack "$out"
  expect_context_rejected negative "missing-profile" "$out" kimi "$managed" || return
  grep -q "profile missing" "$OUT/context-reason-missing-profile.txt" \
    || { fail negative "missing-profile control did not name the missing profile"; return; }

  # Installer-level check: a source pack missing a profile must stop with the
  # missing path, never install a partial copy silently.
  neg="/tmp/kimi-neg-missing-src"
  copy_pack /pack "$neg"
  rm -f "$neg/references/harnesses/kimi.md"
  if kimi_install_neg "$neg" "$HOME/.kimi-code-neg-missing-src" "$OUT/kimi-neg-missing-src-install.txt"; then
    fail negative "installer accepted a pack missing references/harnesses/kimi.md"
    return
  fi
  if grep -q "missing: references/harnesses/kimi.md" "$OUT/kimi-neg-missing-src-install.txt"; then
    ok negative "installer stopped on a missing profile: $(tail -1 "$OUT/kimi-neg-missing-src-install.txt")"
  else
    fail negative "installer failed without naming the missing profile: $(tail -1 "$OUT/kimi-neg-missing-src-install.txt")"
    return
  fi

  # Listing-only control: inventory stays valid while the adapter artifact is
  # removed from the manifest.
  neg="/tmp/kimi-neg-noadapter"
  copy_pack /pack "$neg"
  python3 - "$neg/kimi.plugin.json" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path))
data.pop("systemPromptPath", None)
json.dump(data, open(path, "w"), indent=2)
PY
  home="$HOME/.kimi-code-neg-noadapter"
  kimi_install_neg "$neg" "$home" "$OUT/kimi-neg-noadapter-install.txt" \
    || { fail negative "negative install failed: $(tail -1 "$OUT/kimi-neg-noadapter-install.txt")"; return; }
  managed="$(kimi_plugin_root_for "$home")" || { fail negative "negative managed root missing"; return; }
  out="$OUT/kimi-neg-noadapter-context.txt"
  kimi_probe_context "$home" /pack "$out"
  expect_context_rejected negative "listing-only" "$out" kimi "$managed" || return
  kimi_listing_for "$home" "$OUT/kimi-listing-only-inventory.txt" \
    || { fail negative "listing-only inventory unexpectedly failed"; return; }
  listing_is_not_proof negative "$OUT/kimi-listing-only-inventory.txt" "$OUT/context-reason-listing-only.txt"

  # Poisoned other-harness profiles in the installed copy must not reach the
  # active context.
  neg="/tmp/kimi-neg-poison"
  copy_pack /pack "$neg"
  local h
  for h in $(other_harnesses kimi); do
    printf '\nRIG_POISON_%s\n' "$h" >> "$neg/references/harnesses/$h.md"
  done
  home="$HOME/.kimi-code-neg-poison"
  kimi_install_neg "$neg" "$home" "$OUT/kimi-neg-poison-install.txt" \
    || { fail negative "poison install failed: $(tail -1 "$OUT/kimi-neg-poison-install.txt")"; return; }
  managed="$(kimi_plugin_root_for "$home")" || { fail negative "poison managed root missing"; return; }
  out="$OUT/kimi-neg-poison-context.txt"
  kimi_probe_context "$home" /pack "$out"
  if assert_context_artifact negative "poison" "$out" kimi "$managed"; then
    ok negative "poison control: other-harness profiles were not selected"
  fi
}

harness_smoke() {
  local out report
  ensure_mock || return
  : > /tmp/mock-llm/requests.log
  out="$OUT/smoke.txt"
  ( cd /pack && timeout 180 kimi -p \
      "Reply with exactly OK." --output-format text >"$out" 2>&1 ) || true
  if ! grep -q "SMOKE_OK" "$out" 2>/dev/null; then
    fail smoke "mock model call did not complete: $(tail -1 "$out")"
    return
  fi
  extract_context /tmp/mock-llm/requests.log "$OUT/kimi-smoke-context.txt"
  assert_context_artifact smoke "smoke" "$OUT/kimi-smoke-context.txt" kimi \
    "$(kimi_plugin_root_for "$KIMI_CODE_HOME")" || return
  ok smoke "mock model call completed and the production adapter was in the request"
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
    ok transcript "$(sed -n '1p;/^adapter_line:/p;/^models:/p' "$report" | tr '\n' ' ' | sed 's/  */ /g')"
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
break_context() { rm -f "$KIMI_CODE_HOME/plugins/managed/gfunc-skills/references/adapters/kimi.md"; }
break_negative() { echo "RIG_BREAK: kimi negative stage corrupted"; rm -rf /tmp/kimi-neg-missing /tmp/kimi-neg-noadapter /tmp/kimi-neg-poison; }
break_smoke() { rm -rf "$KIMI_CODE_HOME/plugins/managed/gfunc-skills/skills/sharpen"; }
break_transcript() { newest_file "$KIMI_CODE_HOME/sessions" 'wire.jsonl' | xargs -r truncate -s 0; }
