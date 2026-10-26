"""Verify the Matt Pocock ports against the frozen manifest."""

import hashlib
from pathlib import Path

MANIFEST = Path("references/frozen-skills.tsv")


class FrozenSkillsError(Exception):
    """The frozen manifest is missing or malformed."""


def read_manifest(root: Path) -> dict[str, str]:
    path = root / MANIFEST
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as error:
        raise FrozenSkillsError(f"{MANIFEST}: {error}") from error
    entries = {}
    for number, line in enumerate(lines, 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 2 or not parts[0] or not parts[1]:
            raise FrozenSkillsError(f"{MANIFEST}:{number}: expected path<TAB>sha256")
        entries[parts[0]] = parts[1]
    if not entries:
        raise FrozenSkillsError(f"{MANIFEST}: no frozen paths")
    return entries


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_frozen_skills(root: Path) -> list[str]:
    errors = []
    try:
        entries = read_manifest(root)
    except FrozenSkillsError as error:
        return [str(error)]
    for rel, expected in sorted(entries.items()):
        path = root / rel
        if not path.is_file():
            errors.append(f"{rel}: frozen Matt Pocock file is missing")
        elif digest(path) != expected:
            errors.append(f"{rel}: frozen Matt Pocock file changed")
    roots = sorted({"/".join(rel.split("/")[:2]) for rel in entries if rel.startswith("skills/")})
    for skill_root in roots:
        directory = root / skill_root
        if not directory.is_dir():
            errors.append(f"{skill_root}: frozen Matt Pocock skill directory is missing")
            continue
        for path in sorted(directory.rglob("*")):
            if path.is_file():
                rel = path.relative_to(root).as_posix()
                if rel not in entries:
                    errors.append(f"{rel}: new file in a frozen Matt Pocock skill")
    return errors
