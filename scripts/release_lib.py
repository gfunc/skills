from __future__ import annotations

from dataclasses import dataclass
from functools import total_ordering
import json
import os
from pathlib import Path
import re
import stat
import tempfile


MANIFEST_PATHS = (
    ".claude-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    "kimi.plugin.json",
    "plugin.json",
)
SEMVER = re.compile(
    r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
    r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?\Z"
)


class ReleaseError(Exception):
    pass


@total_ordering
@dataclass(frozen=True, eq=False)
class Version:
    text: str
    core: tuple[int, int, int]
    prerelease: tuple[str, ...]

    @classmethod
    def parse(cls, text: str) -> Version:
        match = SEMVER.fullmatch(text) if isinstance(text, str) else None
        if not match:
            raise ReleaseError(f"invalid SemVer {text!r}")
        prerelease = tuple(match[4].split(".")) if match[4] else ()
        if any(part.isascii() and part.isdigit() and len(part) > 1 and part[0] == "0"
               for part in prerelease):
            raise ReleaseError(f"numeric prerelease identifier has a leading zero in {text!r}")
        return cls(text, tuple(int(match[i]) for i in (1, 2, 3)), prerelease)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Version):
            return NotImplemented
        return (self.core, self.prerelease) == (other.core, other.prerelease)

    def __lt__(self, other: Version) -> bool:
        if self.core != other.core:
            return self.core < other.core
        if not self.prerelease or not other.prerelease:
            return bool(self.prerelease) and not other.prerelease
        for left, right in zip(self.prerelease, other.prerelease):
            if left == right:
                continue
            if left.isdigit() and right.isdigit():
                return int(left) < int(right)
            if left.isdigit() != right.isdigit():
                return left.isdigit()
            return left < right
        return len(self.prerelease) < len(other.prerelease)


def tag_version(tag: str) -> Version:
    if not isinstance(tag, str) or not tag.startswith("v"):
        raise ReleaseError("release tag must start with v")
    return Version.parse(tag[1:])


def repository_root(value: str | Path | None) -> Path:
    return Path(value).resolve() if value is not None else Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class ManifestSnapshot:
    path: Path
    version: Version
    original: bytes
    mode: int
    value_start: int
    value_end: int

    def replacement(self, version: Version) -> bytes:
        token = json.dumps(version.text).encode("ascii")
        return self.original[:self.value_start] + token + self.original[self.value_end:]


def manifest_snapshot(path: Path) -> ManifestSnapshot:
    try:
        if path.is_symlink() or not path.is_file():
            raise ReleaseError("must be a regular file, not a symlink")
        raw = path.read_bytes()
        text = raw.decode("utf-8")
        data = json.loads(text, parse_constant=lambda value: (_ for _ in ()).throw(
            ValueError(f"non-JSON constant {value}")))
        if not isinstance(data, dict):
            raise ReleaseError("manifest must be a JSON object")
        decoder = json.JSONDecoder()
        index = len(text) - len(text.lstrip()) + 1
        versions = []
        while True:
            index = _skip_space(text, index)
            if text[index] == "}":
                break
            key, index = decoder.raw_decode(text, index)
            index = _skip_space(text, index)
            if text[index] != ":":
                raise ReleaseError("expected a JSON property separator")
            start = _skip_space(text, index + 1)
            value, end = decoder.raw_decode(text, start)
            if key == "version":
                versions.append((value, start, end))
            index = _skip_space(text, end)
            if text[index] == "}":
                break
            index += 1
        if len(versions) != 1:
            raise ReleaseError(f"expected one top-level version, found {len(versions)}")
        value, start, end = versions[0]
        version = Version.parse(value)
        return ManifestSnapshot(path, version, raw, stat.S_IMODE(path.stat().st_mode),
                                len(text[:start].encode("utf-8")), len(text[:end].encode("utf-8")))
    except (OSError, UnicodeError, ValueError, IndexError, ReleaseError) as error:
        raise ReleaseError(f"{path}: {error}") from error


def _skip_space(text: str, index: int) -> int:
    while index < len(text) and text[index] in " \t\r\n":
        index += 1
    return index


def manifest_snapshots(root: Path) -> tuple[ManifestSnapshot, ...]:
    snapshots = []
    errors = []
    for relative in MANIFEST_PATHS:
        try:
            path = root / relative
            if not path.resolve().is_relative_to(root):
                raise ReleaseError(f"{relative}: path escapes repository root")
            snapshots.append(manifest_snapshot(path))
        except ReleaseError as error:
            errors.append(str(error))
    if errors:
        raise ReleaseError("\n".join(errors))
    return tuple(snapshots)


def agreed_version(snapshots: tuple[ManifestSnapshot, ...], expected: str | None = None) -> Version:
    if expected is not None:
        Version.parse(expected)
    versions = {snapshot.version.text for snapshot in snapshots}
    if len(versions) != 1:
        raise ReleaseError("manifest version drift:\n" + "\n".join(
            f"  {snapshot.path}: {snapshot.version.text}" for snapshot in snapshots))
    version = snapshots[0].version
    if expected is not None and version.text != expected:
        raise ReleaseError(f"manifest version {version.text} does not match expected {expected}")
    return version


def set_version(root: Path, version: Version, dry_run: bool) -> list[str]:
    snapshots = manifest_snapshots(root)
    changed = [snapshot for snapshot in snapshots if snapshot.version.text != version.text]
    if not changed:
        return []
    for snapshot in snapshots:
        if not snapshot.mode & 0o222 or not os.access(snapshot.path, os.W_OK):
            raise ReleaseError(f"{snapshot.path}: file is not writable")
        parent_mode = snapshot.path.parent.stat().st_mode
        if not parent_mode & 0o222 or not os.access(snapshot.path.parent, os.W_OK):
            raise ReleaseError(f"{snapshot.path}: directory is not writable")
    if dry_run:
        return [str(snapshot.path.relative_to(root)) for snapshot in changed]
    completed = []
    scratch = root / ".scratch" / "release-pipeline"
    try:
        if not scratch.resolve().is_relative_to(root):
            raise ReleaseError("scratch directory escapes repository root")
        scratch.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="version-", dir=scratch) as directory:
            staged = []
            for number, snapshot in enumerate(changed):
                path = Path(directory) / str(number)
                with path.open("xb") as stream:
                    stream.write(snapshot.replacement(version))
                    stream.flush()
                    os.fsync(stream.fileno())
                path.chmod(snapshot.mode)
                staged.append(path)
            for snapshot, staged_path in zip(changed, staged):
                if snapshot.path.read_bytes() != snapshot.original:
                    raise ReleaseError(f"{snapshot.path}: changed after preflight")
                os.replace(staged_path, snapshot.path)
                completed.append(str(snapshot.path.relative_to(root)))
        agreed_version(manifest_snapshots(root), version.text)
    except (OSError, ReleaseError) as error:
        pending = [str(snapshot.path.relative_to(root)) for snapshot in changed
                   if str(snapshot.path.relative_to(root)) not in completed]
        raise ReleaseError(f"version write failed: {error}\ncompleted: {completed}\npending: {pending}") from error
    return completed
