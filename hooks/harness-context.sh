#!/usr/bin/env bash
# Claude plugin SessionStart/SubagentStart hook: deliver the harness pointer.
# The profile body is never injected; the agent reads it on demand.
set -u

event="${1:-}"
case "$event" in
  SessionStart|SubagentStart) ;;
  *)
    printf 'harness-context: expected SessionStart or SubagentStart, got %s\n' "${event:-<none>}" >&2
    exit 2
    ;;
esac

script_dir=$(cd -P "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd) || exit 0
root="${CLAUDE_PLUGIN_ROOT:-}"
if [ -z "$root" ] || [ ! -d "$root" ]; then
  root=$(cd -P "$script_dir/.." >/dev/null 2>&1 && pwd) || exit 0
fi

harness=claude
profile_rel="references/harnesses/$harness.md"
profile="$root/$profile_rel"
template="$root/references/adapters/pointer.txt"

if [ -r "$template" ]; then
  line=$(cat "$template") || line=""
else
  line=""
fi
if [ -z "$line" ]; then
  line="harness=$harness
profile-root=$root
profile=$profile
Read the named profile before harness-dependent work."
fi
line=${line//'{{HARNESS}}'/$harness}
line=${line//'{{PROFILE_ROOT}}'/$root}
line=${line//'{{PROFILE}}'/$profile}

if [ ! -r "$profile" ]; then
  line="$line

HARNESS CONTRACT UNAVAILABLE: $profile is missing or unreadable. Stop harness-dependent actions until the profile is restored."
fi

json_escape() {
  local s=$1 nl=$'\n' cr=$'\r' tab=$'\t'
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$nl/\\n}
  s=${s//$cr/\\r}
  s=${s//$tab/\\t}
  printf '%s' "$s"
}

printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}\n' \
  "$event" "$(json_escape "$line")"
