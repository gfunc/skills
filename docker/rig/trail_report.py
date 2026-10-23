#!/usr/bin/env python3
"""trail_report.py: ticket-09 mini trail-reader for rig session transcripts.

Usage: trail_report.py <kimi|claude|pi|codex> <transcript>

Prints the ticket-09 mini-schema (session, time range, turns, tool calls,
subagent spawns, models) and exits non-zero when a mandatory sanity check
fails: empty/unparseable file, or the harness's load markers are absent
(kimi: the production adapter line + a completed turn; claude: assistant
entries carrying the model field — the current-format marker research 09
lacked; pi: message entries in the v3 session tree; codex: session_meta
envelope).
"""

import argparse
import collections
import datetime
import json
import sys

def die(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def read_jsonl(path):
    records = []
    try:
        fh = open(path)
    except OSError as e:
        die(f"cannot open {path}: {e}")
    with fh:
        for i, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as e:
                die(f"line {i} is not JSON: {e}")
    if not records:
        die("transcript is empty")
    return records


def iso_from_ms(ms):
    return datetime.datetime.fromtimestamp(ms / 1000, datetime.UTC).isoformat()


def time_range(records, iso_key="timestamp", ms_key="time"):
    first = last = None
    for r in records:
        ts = r.get(iso_key)
        if ts is None and isinstance(r.get(ms_key), (int, float)):
            ts = iso_from_ms(r[ms_key])
        if isinstance(ts, str):
            first = ts if first is None or ts < first else first
            last = ts if last is None or ts > last else last
    return f"{first} -> {last}" if first else "n/a"


def payload(r):
    """Tolerate both flat records and {..., payload}/{..., data} envelopes."""
    if isinstance(r.get("payload"), dict):
        return r["payload"]
    if isinstance(r.get("data"), dict):
        return r["data"]
    return r


def report(rows):
    for k, v in rows:
        print(f"{k}: {v}")


# --- kimi: wire.jsonl (protocol 1.5) ----------------------------------------
def all_strings(value, out):
    if isinstance(value, str):
        out.append(value)
    elif isinstance(value, dict):
        for item in value.values():
            all_strings(item, out)
    elif isinstance(value, list):
        for item in value:
            all_strings(item, out)


def harness_kimi(records, args):
    types = collections.Counter(r.get("type") for r in records)
    loop = collections.Counter()
    models = collections.Counter()
    for r in records:
        p = payload(r)
        if r.get("type") == "context.append_loop_event":
            loop[p.get("type")] += 1
        if r.get("type") == "llm.request":
            models[p.get("modelAlias") or p.get("model")] += 1
    turn_completed = any(
        payload(r).get("reason") == "completed" for r in records
        if r.get("type") == "turn.ended"
    )

    # The production adapter is part of the model-visible prompt, so scanning
    # all string values finds it regardless of which wire record carries the
    # system prompt. No plugin.session_start skill overlay is involved.
    strings = []
    all_strings(records, strings)
    blob = "\n".join(strings)
    if "harness=kimi" not in blob:
        die("no adapter line (harness=kimi) in the wire transcript — the plugin prompt did not load")
    if "profile=references/harnesses/kimi.md" not in blob:
        die("adapter line does not name references/harnesses/kimi.md")
    if not turn_completed:
        die("no turn.ended with reason=completed")

    report([
        ("session", args.transcript),
        ("time", time_range(records)),
        ("turns", f"{types.get('turn.prompt', 0)} prompt / {types.get('turn.ended', 0)} ended"),
        ("tool_calls", sum(loop.values())),
        ("subagent_spawns", types.get("subagent.spawned", 0)),
        ("models", dict(models)),
        ("adapter_line", "yes (harness=kimi, profile=references/harnesses/kimi.md)"),
        ("record_types", dict(types)),
    ])


# --- claude: current-format projects/<slug>/<session>.jsonl ------------------
def harness_claude(records, args):
    types = collections.Counter(r.get("type") for r in records)
    models = collections.Counter()
    tool_calls = 0
    sid = None
    for r in records:
        if sid is None and r.get("sessionId"):
            sid = r["sessionId"]
        if r.get("type") == "assistant":
            m = r.get("message") or {}
            if m.get("model"):
                models[m["model"]] += 1
            for block in m.get("content") or []:
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    tool_calls += 1
    if sid is None:
        die("no sessionId field — not a current-format claude session file")

    report([
        ("session", sid),
        ("file", args.transcript),
        ("time", time_range(records)),
        ("turns", f"{types.get('user', 0)} user entries"),
        ("tool_calls", tool_calls),
        ("subagent_spawns", "n/a (subagent trails live in separate files)"),
        ("models", dict(models) if models else "none (no model call reached in this run)"),
        ("record_types", dict(types)),
    ])


# --- pi: sessions/--<cwd>--/<timestamp>_<id>.jsonl (format v3 tree) ----------
def harness_pi(records, args):
    types = collections.Counter(r.get("type") for r in records)
    if types.get("message", 0) == 0:
        die("no message entries in the pi session tree")

    report([
        ("session", args.transcript),
        ("time", time_range(records, iso_key="timestamp", ms_key="timestamp")),
        ("turns", f"{types.get('message', 0)} messages"),
        ("tool_calls", types.get("tool_execution_start", 0)),
        ("subagent_spawns", types.get("subagent_spawn", 0)),
        ("record_types", dict(types)),
    ])


# --- codex: sessions/YYYY/MM/DD/rollout-*.jsonl ------------------------------
def harness_codex(records, args):
    types = collections.Counter(r.get("type") for r in records)
    items = collections.Counter()
    tools = collections.Counter()
    models = collections.Counter()
    sid = cwd = None
    for r in records:
        p = payload(r)
        if r.get("type") == "session_meta":
            sid = p.get("id")
            cwd = p.get("cwd")
        if r.get("type") == "turn_context" and p.get("model"):
            models[p["model"]] += 1
        if r.get("type") == "response_item":
            items[p.get("type")] += 1
            if p.get("type") == "function_call":
                tools[p.get("name")] += 1
    if sid is None:
        die("no session_meta envelope — not a codex rollout")

    report([
        ("session", sid),
        ("file", args.transcript),
        ("cwd", cwd),
        ("time", time_range(records)),
        ("turns", f"{types.get('event_msg.task_started', 0)} started / {types.get('event_msg.task_complete', 0)} complete"),
        ("tool_calls", sum(tools.values())),
        ("subagent_spawns", "n/a"),
        ("models", dict(models)),
        ("response_items", dict(items)),
    ])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("harness", choices=["kimi", "claude", "pi", "codex"])
    ap.add_argument("transcript")
    args = ap.parse_args()
    records = read_jsonl(args.transcript)
    {"kimi": harness_kimi, "claude": harness_claude, "pi": harness_pi, "codex": harness_codex}[args.harness](records, args)


if __name__ == "__main__":
    main()
