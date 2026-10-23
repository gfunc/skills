#!/usr/bin/env bash
# validate.sh <harness> — container entrypoint for the Docker validation rig.
#
# Flow: clone the pack from the read-only /src mount (never the working tree)
# -> scripts/install --harness <h> (INSTALL|FAIL contract) -> load -> context
# (adapter + profile markers + matrix) -> negative controls -> smoke ->
# transcript. Every assertion is on stdout/transcript/request CONTENT, never
# exit codes alone (research 12 bottom line 6). Non-zero exit if any stage
# printed FAIL; MANUAL lines are explicit gaps, never passes.
#
# RIG_BREAK=<harness>:<install|load|context|negative|smoke|transcript>
# corrupts exactly that stage on purpose (breakers live in lib-<harness>.sh).

set -uo pipefail

HARNESS="${1:?usage: validate.sh <kimi|claude|codex|pi|cursor>}"
case "$HARNESS" in
  kimi|claude|codex|pi|cursor) ;;
  *) echo "validate.sh: unknown harness $HARNESS" >&2; exit 2 ;;
esac

# shellcheck source=rig/common.sh
source /opt/rig/rig/common.sh
# shellcheck source=rig/lib-<harness>.sh
source "/opt/rig/rig/lib-$HARNESS.sh"

for fn in harness_prepare harness_load harness_context harness_negative harness_smoke harness_transcript; do
  declare -F "$fn" >/dev/null || { echo "validate.sh: $fn not defined for $HARNESS" >&2; exit 2; }
done

mkdir -p "$OUT"

# --- clone the pack (the only source; /src is a read-only mount of the repo)
# /src is owned by the host uid: mark it safe for this container's git only.
git config --global --add safe.directory '*' 2>/dev/null || true
if ! git clone --quiet /src "$PACK" >"$OUT/clone.log" 2>&1; then
  fail install "git clone /src failed: $(tail -1 "$OUT/clone.log")"
  exit 1
fi
cd "$PACK"

# --- install: the rig's entry point, contract lines pass through. If the
# installer cannot even run (e.g. RIG_BREAK removed the clone), synthesize the
# named FAIL line so the failure contract still holds.
rig_break install
install_out=""
install_rc=0
install_out="$(scripts/install --harness "$HARNESS" 2>&1)" || install_rc=$?
printf '%s\n' "$install_out"
if [ "$install_rc" -ne 0 ]; then
  if ! grep -q "^FAIL " <<<"$install_out"; then
    fail install "scripts/install could not run: $(printf '%s\n' "$install_out" | awk 'NF { line=$0 } END { print line }')"
  fi
  echo "ABORT $HARNESS install failed; load/smoke/transcript not run"
  exit 1
fi

harness_prepare

rig_break load
stage harness_load

rig_break context
stage harness_context

rig_break negative
stage harness_negative

rig_break smoke
stage harness_smoke

rig_break transcript
stage harness_transcript

harness_finish
echo "STAGE_SUMMARY $HARNESS failed=$FAILED manual=$MANUAL_COUNT"

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi
