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
break_smoke()      { echo "RIG_BREAK: no breaker defined for $HARNESS:smoke"; }
break_transcript() { echo "RIG_BREAK: no breaker defined for $HARNESS:transcript"; }

# --- optional per-harness hooks (libs override) -----------------------------
harness_prepare() { :; }
harness_finish()  { :; }
