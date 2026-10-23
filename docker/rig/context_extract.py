#!/usr/bin/env python3
"""context_extract.py: flatten a host's no-key context artifact to plain text.

The rig asserts adapter-line content, not a JSON shape, so this accepts any
JSON, JSONL, or plain-text file and prints every string value it finds (one
per line). That turns escaped newlines inside request/transcript JSON into
real lines the shell can grep, without coupling the rig to a private schema.
"""

import json
import sys


def walk(value, out):
    if isinstance(value, str):
        # Hosts often nest a serialized JSON blob (hook output, request body)
        # inside another JSON string. Parse it so escaped newlines become real
        # lines the shell can inspect.
        stripped = value.strip()
        if stripped[:1] in ("{", "["):
            try:
                walk(json.loads(value), out)
                return
            except json.JSONDecodeError:
                pass
        out.append(value)
    elif isinstance(value, dict):
        for item in value.values():
            walk(item, out)
    elif isinstance(value, list):
        for item in value:
            walk(item, out)


def main():
    if len(sys.argv) != 2:
        print("usage: context_extract.py <file>", file=sys.stderr)
        return 2
    with open(sys.argv[1], "rb") as fh:
        raw = fh.read().decode("utf-8", "replace")

    # A whole-file JSON document (e.g. Codex's pretty-printed prompt-input
    # array) is flattened in one pass. Otherwise treat the file as JSONL or
    # plain text.
    stripped = raw.strip()
    if stripped[:1] in ("{", "["):
        try:
            out = []
            walk(json.loads(stripped), out)
            for item in out:
                print(item)
            return 0
        except json.JSONDecodeError:
            pass

    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            print(line)
            continue
        out = []
        walk(obj, out)
        for item in out:
            print(item)
    return 0


if __name__ == "__main__":
    sys.exit(main())
