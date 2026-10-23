#!/usr/bin/env bash
# common.sh: shared helpers for the in-container per-harness validation.
#
# Line contract (extends scripts/install's INSTALL|FAIL contract):
#   OK <harness> <stage> <detail>
#   SKIPPED <harness> <stage> <reason>
#   FAIL <harness> <stage> <reason>
# Any FAIL sets FAILED=1; validate.sh exits non-zero at the end. Assertions are
# on stdout/transcript CONTENT, never exit codes (research 12 bottom line 6).

: "${HARNESS:?HARNESS is required}"
PACK="${PACK:-/pack}"
OUT="${OUT:-/out}"
RIG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILED=0

ok()   { echo "OK $HARNESS $1 ${2:+detail=}${2:-}"; }
skip() { echo "SKIPPED $HARNESS $1 reason=$2"; }
fail() { echo "FAIL $HARNESS $1 $2"; FAILED=1; }

# assert_grep <stage> <label> <file> <needle> — content assertion on a file.
assert_grep() {
  local stage_="$1" label="$2" file="$3" needle="$4"
  if grep -qF -- "$needle" "$file" 2>/dev/null; then
    return 0
  fi
  fail "$stage_" "$label: missing content: $needle"
  return 1
}

# stage <fn> — run a rig stage function; it reports its own OK/SKIPPED/FAIL.
stage() { "$@"; }

# newest_file <dir> <glob> — newest matching file, or empty string.
newest_file() {
  find "$1" -type f -name "$2" -print0 2>/dev/null \
    | xargs -0 -r ls -t 2>/dev/null | head -1
}

# --- context / matrix contract ----------------------------------------------
# The acceptance matrix has four cells per harness. A cell is PASS only when a
# no-key surface actually delivered the adapter line, the selected profile's
# unique marker, and no other harness's marker. Cells the host cannot prove
# headlessly are MANUAL: visible, counted, and never treated as a pass.
ALL_HARNESS_NAMES=(kimi claude codex pi cursor)
MANUAL_COUNT=0

manual() { echo "MANUAL $HARNESS $1 reason=$2"; MANUAL_COUNT=$((MANUAL_COUNT + 1)); }

matrix() {
  local cell="$1" status="$2" detail="${3:-}"
  echo "MATRIX $HARNESS $cell $status ${detail:+detail=}${detail}"
  case "$status" in
    FAIL) FAILED=1 ;;
    MANUAL) MANUAL_COUNT=$((MANUAL_COUNT + 1)) ;;
  esac
}

other_harnesses() {
  local h
  for h in "${ALL_HARNESS_NAMES[@]}"; do
    [ "$h" = "$1" ] || printf '%s\n' "$h"
  done
}

profile_marker() { printf '# Harness: %s\n' "$1"; }

# assert_not_grep <stage> <label> <file> <needle> — content must be absent.
assert_not_grep() {
  local stage_="$1" label="$2" file="$3" needle="$4"
  if grep -qF -- "$needle" "$file" 2>/dev/null; then
    fail "$stage_" "$label: unexpected content: $needle"
    return 1
  fi
  return 0
}

# pointer_field <file> <key> — first adapter-line value for key.
pointer_field() {
  awk -v k="$2" 'index($0, k"=") == 1 { print substr($0, length(k) + 2); exit }' "$1" 2>/dev/null
}

# extract_context <raw> <plain> — flatten JSON/JSONL/plain text.
extract_context() {
  python3 "$RIG/context_extract.py" "$1" >"$2" 2>/dev/null
}

# context_problem <plain-artifact> <harness> [plugin-root]
# Prints the reason the artifact does not prove selection, or nothing on
# success. Pure probe: negative controls use it without turning their expected
# rejection into a harness FAIL.
context_problem() {
  local artifact="$1" want="$2" plugin_root="${3:-}"
  local root profile path h

  [ -s "$artifact" ] || { echo "adapter line missing: context artifact is empty ($artifact)"; return 1; }
  grep -qF -- "harness=$want" "$artifact" 2>/dev/null \
    || { echo "adapter line missing: harness=$want"; return 1; }
  root="$(pointer_field "$artifact" profile-root)"
  profile="$(pointer_field "$artifact" profile)"
  [ -n "$root" ] || { echo "adapter line has no profile-root"; return 1; }
  [ -n "$profile" ] || { echo "adapter line has no profile"; return 1; }

  case "$root" in
    plugin)
      [ -n "$plugin_root" ] || { echo "profile-root=plugin needs a plugin root"; return 1; }
      case "$profile" in
        /*) path="$profile" ;;
        *) path="$plugin_root/$profile" ;;
      esac
      ;;
    /*)
      [ -z "$plugin_root" ] || [ "$root" = "$plugin_root" ] \
        || { echo "profile-root=$root is not the expected root $plugin_root"; return 1; }
      case "$profile" in
        /*) path="$profile" ;;
        *) path="$root/$profile" ;;
      esac
      ;;
    *)
      echo "profile-root is neither absolute nor 'plugin': $root"
      return 1
      ;;
  esac

  [ -r "$path" ] || { echo "profile missing: $path"; return 1; }
  grep -qF "# Harness: $want" "$path" 2>/dev/null \
    || { echo "profile $path lacks marker '# Harness: $want'"; return 1; }

  for h in $(other_harnesses "$want"); do
    if grep -qF -- "# Harness: $h" "$artifact" 2>/dev/null; then
      echo "other harness marker present: # Harness: $h"
      return 1
    fi
    if grep -qF -- "RIG_POISON_$h" "$artifact" 2>/dev/null; then
      echo "poison marker present: RIG_POISON_$h"
      return 1
    fi
  done
  return 0
}

# assert_context_artifact <stage> <label> <plain-artifact> <harness> [plugin-root]
#
# Requires: harness=<harness>; a profile-root and profile field; the resolved
# profile exists and contains "# Harness: <harness>"; no other harness's
# marker or poison marker appears in the context artifact. With a plugin root
# the resolved path must stay inside that installed/in-place root.
assert_context_artifact() {
  local stage_="$1" label="$2" artifact="$3" want="$4" plugin_root="${5:-}"
  local reason
  if reason="$(context_problem "$artifact" "$want" "$plugin_root")"; then
    return 0
  fi
  fail "$stage_" "$label: $reason"
  return 1
}

# expect_context_rejected <stage> <label> <artifact> <harness> [plugin-root]
# The negative-control counterpart: the probe must reject, and the reason is
# kept for the report. A silently accepted wrong context is a FAIL.
expect_context_rejected() {
  local stage_="$1" label="$2" artifact="$3" want="$4" plugin_root="${5:-}"
  local reason reason_file="$OUT/context-reason-$label.txt"
  if reason="$(context_problem "$artifact" "$want" "$plugin_root")"; then
    printf '%s\n' "unexpectedly accepted" >"$reason_file"
    fail "$stage_" "$label: context was accepted but the control required rejection"
    return 1
  fi
  printf '%s\n' "$reason" >"$reason_file"
  ok "$stage_" "$label: rejected with '$reason'"
  return 0
}

# copy_pack <src> <dst> — writable working copy without git metadata.
copy_pack() {
  rm -rf "$2"
  mkdir -p "$2"
  ( cd "$1" && tar cf - --exclude=.git --exclude=.scratch . ) | ( cd "$2" && tar xf - )
}

# clone_positive <stage> <harness> <pack> — the clone-direct cell: the resolver
# prints the pointer, the named profile exists, and no other marker is present.
clone_positive() {
  local stage_="$1" want="$2" pack="$3"
  local clone="/tmp/clone-$want" out="$OUT/clone-$want.txt"
  copy_pack "$pack" "$clone"
  if ! ( cd "$clone" && scripts/resolve-harness --harness "$want" ) >"$out" 2>&1; then
    fail "$stage_" "clone resolver failed: $(tail -1 "$out")"
    matrix clone-direct FAIL "resolver failed"
    return 1
  fi
  if assert_context_artifact "$stage_" "clone" "$out" "$want" "$clone"; then
    matrix clone-direct PASS "profile=$(pointer_field "$out" profile)"
    ok "$stage_" "clone-direct: resolver selected $want from $clone"
  else
    matrix clone-direct FAIL "adapter/profile assertion failed"
    return 1
  fi
}

# clone_shared <stage> <pack> — two harnesses resolve concurrently from one
# read-only clone; proves shared-root and no-write selection.
clone_shared() {
  local stage_="$1" pack="$2"
  local clone="/tmp/clone-shared" a="$OUT/shared-kimi.txt" b="$OUT/shared-claude.txt"
  copy_pack "$pack" "$clone"
  chmod -R a-w "$clone"
  ( cd "$clone" && scripts/resolve-harness --harness kimi ) >"$a" 2>&1 &
  local p1=$!
  ( cd "$clone" && scripts/resolve-harness --harness claude ) >"$b" 2>&1 &
  local p2=$!
  local r1=0 r2=0
  wait "$p1" || r1=$?
  wait "$p2" || r2=$?
  if [ "$r1" -ne 0 ] || [ "$r2" -ne 0 ]; then
    fail "$stage_" "shared read-only clone: resolver failed (kimi=$r1 claude=$r2)"
    return 1
  fi
  assert_context_artifact "$stage_" "shared" "$a" kimi "$clone" || return 1
  assert_context_artifact "$stage_" "shared" "$b" claude "$clone" || return 1
  ok "$stage_" "shared read-only clone: kimi+claude resolved concurrently with no writes"
}

# clone_negative <stage> <harness> <pack> — poisoned other-harness profile is
# not selected; a missing active profile exits non-zero with a clear reason.
clone_negative() {
  local stage_="$1" want="$2" pack="$3"
  local neg="/tmp/clone-neg-$want" h out rc

  copy_pack "$pack" "$neg"
  for h in $(other_harnesses "$want"); do
    printf '\nRIG_POISON_%s\n' "$h" >> "$neg/references/harnesses/$h.md"
  done
  out="$OUT/clone-poison-$want.txt"
  if ! ( cd "$neg" && scripts/resolve-harness --harness "$want" ) >"$out" 2>&1; then
    fail "$stage_" "poison control: resolver failed for $want"
    return 1
  fi
  if assert_context_artifact "$stage_" "poison" "$out" "$want" "$neg"; then
    ok "$stage_" "poison control: other-harness profiles were not selected"
  else
    return 1
  fi

  rm -f "$neg/references/harnesses/$want.md"
  out="$OUT/clone-missing-$want.txt"
  rc=0
  ( cd "$neg" && scripts/resolve-harness --harness "$want" ) >"$out" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ] && grep -qi "profile" "$out" && grep -q "$want" "$out"; then
    ok "$stage_" "missing-profile control: stopped with '$(tail -1 "$out")'"
  else
    fail "$stage_" "missing-profile control: exit=$rc, reason=$(tail -1 "$out")"
    return 1
  fi
}

# listing_is_not_proof <stage> <listing-file> <rejection-reason-file>
# Expects inventory to succeed and the context probe to have rejected with a
# named reason. The caller writes both files; this only asserts the contrast.
listing_is_not_proof() {
  local stage_="$1" listing="$2" reason_file="$3"
  [ -s "$listing" ] || { fail "$stage_" "listing-only control: listing was empty"; return 1; }
  if ! grep -qiE 'missing|unavailable|no adapter|not found|rejected' "$reason_file" 2>/dev/null; then
    fail "$stage_" "listing-only control: context was not rejected (inventory would have passed)"
    return 1
  fi
  ok "$stage_" "listing-only control: inventory succeeded while context was rejected ($(tail -1 "$reason_file"))"
}

# --- OpenAI-compatible mock (research 12 S0) -------------------------------
MOCK_PORT="${MOCK_PORT:-18777}"

mock_base_url() {
  echo "${MOCK_BASE_URL:-http://127.0.0.1:${MOCK_PORT}/v1}"
}

# ensure_mock — start the in-container mock unless MOCK_BASE_URL points at an
# external endpoint. A harness smoke stage calls this before its mock run.
ensure_mock() {
  if [ -n "${MOCK_BASE_URL:-}" ]; then
    return 0
  fi
  if curl -fsS -o /dev/null --max-time 2 "http://127.0.0.1:${MOCK_PORT}/v1/models" 2>/dev/null; then
    return 0
  fi
  mkdir -p /tmp/mock-llm
  MOCK_PORT="$MOCK_PORT" python3 /opt/rig/mock-llm/server.py &
  local i
  for i in $(seq 1 20); do
    if curl -fsS -o /dev/null --max-time 1 "http://127.0.0.1:${MOCK_PORT}/v1/models" 2>/dev/null; then
      return 0
    fi
    sleep 0.25
  done
  fail smoke "mock LLM failed to start on 127.0.0.1:${MOCK_PORT}"
  return 1
}

# --- negative control -------------------------------------------------------
# rig_break <stage> — when RIG_BREAK=<harness>:<stage>, run break_<stage>
# (defined per harness in lib-<harness>.sh; no-op defaults below) to corrupt
# exactly that stage on purpose, so a run can prove failures are named.
rig_break() {
  local want="$1"
  [ -n "${RIG_BREAK:-}" ] || return 0
  case "$RIG_BREAK" in
    "$HARNESS:$want") ;;
    *) return 0 ;;
  esac
  echo "RIG_BREAK active: corrupting $HARNESS:$want"
  "break_$want"
}

break_install()    { echo "RIG_BREAK: no breaker defined for $HARNESS:install"; }
break_load()       { echo "RIG_BREAK: no breaker defined for $HARNESS:load"; }
break_context()    { echo "RIG_BREAK: no breaker defined for $HARNESS:context"; }
break_negative()   { echo "RIG_BREAK: no breaker defined for $HARNESS:negative"; }
break_smoke()      { echo "RIG_BREAK: no breaker defined for $HARNESS:smoke"; }
break_transcript() { echo "RIG_BREAK: no breaker defined for $HARNESS:transcript"; }

# --- optional per-harness hooks (libs override) -----------------------------
harness_prepare() { :; }
harness_finish()  { :; }
