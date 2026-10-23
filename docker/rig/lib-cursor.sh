#!/usr/bin/env bash
# lib-cursor.sh: load/context/negative/smoke/transcript stages for the pinned
# Cursor Agent CLI (2026.10.19-6bbf2c4).
#
# Cursor's CLI requires authentication before it assembles a prompt, and it has
# no debug/dry-run prompt surface. The plugin rule and the --plugin-dir flag
# are structurally verifiable, but plugin direct/child delivery is recorded as
# an explicit manual gate. The clone resolver path is fully provable.

CURSOR_VERSION="2026.10.19-6bbf2c4"
CURSOR_RULE="rules/harness-contract.mdc"

harness_prepare() { :; }

harness_load() {
  local ver out guidance
  ver="$(agent --version 2>&1 | head -1)"
  if [ "$ver" != "$CURSOR_VERSION" ]; then
    fail load "cursor CLI version $ver != pinned $CURSOR_VERSION"
    return
  fi
  out="$OUT/cursor-help.txt"
  agent --help >"$out" 2>&1 || true
  assert_grep load "cursor help" "$out" "--plugin-dir" || return
  guidance="$(scripts/install --harness cursor 2>&1)" || {
    fail load "installer guidance failed"
    return
  }
  grep -q -- "--plugin-dir" <<<"$guidance" \
    || { fail load "installer guidance does not name --plugin-dir"; return; }
  printf '%s\n' "$guidance" >"$OUT/cursor-install-guidance.txt"
  ok load "cli=$ver; --plugin-dir documented; guidance emitted; no non-interactive install exists"
}

cursor_rule_artifact() {
  local pack="$1" out="$2"
  if [ -r "$pack/$CURSOR_RULE" ]; then
    cat "$pack/$CURSOR_RULE" >"$out"
  else
    : >"$out"
  fi
}

harness_context() {
  local rule="$OUT/cursor-rule.txt" out

  cursor_rule_artifact /pack "$rule"
  if assert_context_artifact context "rule" "$rule" cursor /pack; then
    grep -qF "alwaysApply: true" "$rule" \
      || { fail context "cursor rule is not alwaysApply"; matrix plugin-direct FAIL "rule not alwaysApply"; return; }
    matrix plugin-direct MANUAL "rule/profile and --plugin-dir are structurally valid, but the CLI auth gate precedes prompt assembly; runtime delivery is unproven"
    ok context "plugin-direct: structural rule/manifest checks pass; runtime delivery is a manual gate"
  else
    matrix plugin-direct FAIL "rule adapter/profile assertion failed"
  fi

  # Both manifests exist; which component set Cursor loads is unproven.
  if [ -f /pack/plugin.json ] && [ -f /pack/.cursor-plugin/plugin.json ]; then
    ok context "dual manifests present (root plugin.json + .cursor-plugin/plugin.json); precedence remains a manual gate"
  else
    fail context "cursor dual manifests are incomplete"
  fi

  # Prove the CLI accepts the flag and that a no-key run stops at auth before
  # any prompt is built. This is evidence for the manual gate, not a pass.
  out="$OUT/cursor-no-key.txt"
  HOME="$HOME/.cursor-no-key" timeout 60 agent -p --plugin-dir /pack "hi" \
    >"$out" 2>&1 || true
  if grep -qi "authentication required" "$out"; then
    ok context "no-key CLI probe: agent -p --plugin-dir stops at 'Authentication required' before prompt assembly"
  else
    ok context "no-key CLI probe produced no observable prompt; see $out (manual gate stands)"
  fi

  matrix plugin-child MANUAL "Cursor subagentStart has no child-context field; CLI child rule inheritance is unproven without auth"
  clone_positive context cursor /pack
  clone_shared context /pack
  matrix clone-child MANUAL "parent-supplied profile line; cloud/local child delivery needs an authenticated run"
}

harness_negative() {
  local neg rule out listing h

  clone_negative negative cursor /pack

  # Static missing-profile control: the rule points at a profile that is not
  # shipped. Runtime delivery is manual, but the rig must never accept this.
  neg="/tmp/cursor-neg-missing"
  copy_pack /pack "$neg"
  rm -f "$neg/references/harnesses/cursor.md"
  rule="$OUT/cursor-neg-missing-rule.txt"
  cursor_rule_artifact "$neg" "$rule"
  expect_context_rejected negative "missing-profile" "$rule" cursor "$neg" || return

  # Static listing control: the manifest and skills remain, but the rule
  # adapter is gone. The CLI cannot list plugins without auth, so this control
  # is explicitly structural and never counted as a host pass.
  neg="/tmp/cursor-neg-norule"
  copy_pack /pack "$neg"
  rm -f "$neg/$CURSOR_RULE"
  rule="$OUT/cursor-neg-norule-rule.txt"
  cursor_rule_artifact "$neg" "$rule"
  listing="$OUT/cursor-neg-norule-inventory.txt"
  python3 - "$neg" >"$listing" 2>&1 <<'PY'
import json, os, sys
pack = sys.argv[1]
data = json.load(open(os.path.join(pack, ".cursor-plugin/plugin.json")))
skills = sorted(d for d in os.listdir(os.path.join(pack, "skills"))
                if os.path.isfile(os.path.join(pack, "skills", d, "SKILL.md")))
print("manifest:", data.get("name"), data.get("version"))
print("skills (%d): %s" % (len(skills), ", ".join(skills)))
PY
  expect_context_rejected negative "listing-only-structural" "$rule" cursor "$neg" || return
  manual "listing-only" "structural manifest inventory succeeds while the rule adapter is absent; Cursor plugin listing requires auth, so no host PASS is claimed"

  # Poisoned other-harness profiles must not appear in the static rule
  # artifact's selected profile.
  neg="/tmp/cursor-neg-poison"
  copy_pack /pack "$neg"
  for h in $(other_harnesses cursor); do
    printf '\nRIG_POISON_%s\n' "$h" >> "$neg/references/harnesses/$h.md"
  done
  rule="$OUT/cursor-neg-poison-rule.txt"
  cursor_rule_artifact "$neg" "$rule"
  if assert_context_artifact negative "poison" "$rule" cursor "$neg"; then
    ok negative "poison control: static rule selects cursor.md and carries no other marker (runtime delivery manual)"
  fi
}

harness_smoke() {
  skip smoke "Cursor CLI requires authentication before prompt assembly; no no-key model surface"
}

harness_transcript() {
  skip transcript "no Cursor session is created without authentication"
}

harness_finish() { :; }

break_install() { mv /pack/.cursor-plugin /pack/.cursor-plugin.hidden; }
break_load() {
  cat > /usr/local/bin/agent <<'EOF'
#!/bin/sh
echo "0.0.0"
exit 0
EOF
  chmod +x /usr/local/bin/agent
}
break_context() { mv "/pack/$CURSOR_RULE" "/pack/$CURSOR_RULE.hidden"; }
break_negative() { rm -rf /tmp/cursor-neg-missing /tmp/cursor-neg-norule /tmp/cursor-neg-poison; }
break_smoke() { :; }
break_transcript() { :; }
