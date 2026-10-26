import sys
sys.dont_write_bytecode = True

import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))
from frozen_skills import check_frozen_skills
from release_lib import MANIFEST_PATHS, ReleaseError, Version, set_version


class ScratchCase(unittest.TestCase):
    def setUp(self):
        scratch = ROOT / ".scratch" / "release-pipeline" / "tests"
        scratch.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(dir=scratch)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1", GIT_CONFIG_NOSYSTEM="1")
        for name in ("GH_TOKEN", "GITHUB_TOKEN", "GITHUB_OUTPUT", "GITHUB_STEP_SUMMARY", "RELEASE_TAG",
                     "GITHUB_EVENT_NAME", "GITHUB_REF_NAME", "GITHUB_REF_TYPE"):
            self.env.pop(name, None)
        self.manifests()

    def manifests(self, version="0.2.0"):
        for index, name in enumerate(MANIFEST_PATHS):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            content = {"name": "fixture", "version": version, "description": "Fixture", "license": "MIT",
                       "nested": {"version": "unchanged"}, "unicode": "λ"}
            path.write_text(json.dumps(content, ensure_ascii=False, indent=index + 1) + "\n", encoding="utf-8")
            path.chmod(0o640 + index)

    def cli(self, name, *args, env=None, root=None):
        return subprocess.run([sys.executable, str(SCRIPTS / name), "--root", str(root or self.root), *args],
                              env=env or self.env, capture_output=True, text=True)

    def git(self, *args, root=None):
        result = subprocess.run(["git", "-C", str(root or self.root), *args], env=self.env,
                                capture_output=True, text=True)
        if result.returncode:
            self.fail(f"fixture git failed: {result.stderr}")
        return result.stdout.strip()

    def init(self):
        self.git("init", "-b", "main")
        self.git("config", "user.name", "Release fixture")
        self.git("config", "user.email", "release-fixture@example.invalid")
        self.git("add", ".")
        self.git("commit", "-qm", "fixture")

    def snapshot(self):
        return {name: ((self.root / name).read_bytes(), (self.root / name).stat().st_mode)
                for name in MANIFEST_PATHS}


class VersionTests(ScratchCase):
    def test_read_check_dry_run_set_and_repeat_preserve_every_other_byte(self):
        original = self.snapshot()
        self.assertEqual(self.cli("version", "read").stdout, "0.2.0\n")
        self.assertEqual(self.cli("version", "check", "0.2.0").returncode, 0)
        self.assertNotEqual(self.cli("version", "check", "0.2.1").returncode, 0)
        self.assertEqual(self.snapshot(), original)
        result = self.cli("version", "set", "1.2.3-rc.1+build.000", "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.snapshot(), original)
        result = self.cli("version", "set", "1.2.3-rc.1+build.000")
        self.assertEqual(result.returncode, 0, result.stderr)
        after = self.snapshot()
        for name, (raw, mode) in original.items():
            self.assertEqual(after[name], (raw.replace(b'"0.2.0"', b'"1.2.3-rc.1+build.000"'), mode))
        repeated = self.cli("version", "set", "1.2.3-rc.1+build.000")
        self.assertEqual(repeated.returncode, 0, repeated.stderr)
        self.assertIn("unchanged", repeated.stdout)
        self.assertEqual(self.snapshot(), after)

    def test_drift_is_read_only_and_set_can_repair_it(self):
        path = self.root / MANIFEST_PATHS[-1]
        path.write_bytes(path.read_bytes().replace(b'"0.2.0"', b'"0.2.1"'))
        before = self.snapshot()
        result = self.cli("version", "read")
        self.assertNotEqual(result.returncode, 0)
        for name in MANIFEST_PATHS:
            self.assertIn(name, result.stderr)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(self.cli("version", "set", "0.3.0").returncode, 0)
        self.assertEqual(self.cli("version", "read").stdout, "0.3.0\n")

    def test_invalid_versions_never_write(self):
        invalid = ("v1.2.3", "01.2.3", "1.02.3", "1.2.03", "1.2", "1.2.3-01", "1.2.3-a..b",
                   "1.2.3+", "1.2.3-", "1.2.3-β", "1.2.3\n", "1.2.3;touch nope")
        before = self.snapshot()
        for value in invalid:
            with self.subTest(value=value):
                self.assertNotEqual(self.cli("version", "set", value).returncode, 0)
                self.assertEqual(self.snapshot(), before)

    def test_semver_precedence_ignores_build_and_orders_numeric_identifiers(self):
        values = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta",
                  "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0", "1.1.0"]
        parsed = list(map(Version.parse, values))
        self.assertEqual(sorted(reversed(parsed)), parsed)
        self.assertEqual(Version.parse("1.0.0+001"), Version.parse("1.0.0+abc"))

    def test_missing_malformed_duplicate_and_wrong_type_preflight_without_writes(self):
        path = self.root / MANIFEST_PATHS[-1]
        for raw in (b'{}', b'{"version": "0.2.0", "version": "0.2.0"}', b'{"version": 2}',
                    b'{"version": "0.2.0", "ver\\u0073ion": "0.2.0"}',
                    b'{"version": "0.2.0",}', b'[]', b'{"version":"0.2.0", "x": NaN}'):
            with self.subTest(raw=raw):
                self.manifests()
                path.write_bytes(raw)
                before = self.snapshot()
                self.assertNotEqual(self.cli("version", "set", "1.0.0").returncode, 0)
                self.assertEqual(self.snapshot(), before)
        self.manifests()
        path.unlink()
        self.assertNotEqual(self.cli("version", "set", "1.0.0").returncode, 0)
        self.assertEqual(self.cli("version", "read").returncode, 1)

    def test_nonwritable_file_fails_before_first_write(self):
        (self.root / MANIFEST_PATHS[-1]).chmod(0o444)
        before = self.snapshot()
        self.assertNotEqual(self.cli("version", "set", "1.0.0").returncode, 0)
        self.assertEqual(self.snapshot(), before)

    def test_nonwritable_directory_and_read_only_noop(self):
        directory = self.root / ".cursor-plugin"
        directory.chmod(0o555)
        self.addCleanup(directory.chmod, 0o755)
        before = self.snapshot()
        self.assertNotEqual(self.cli("version", "set", "1.0.0").returncode, 0)
        self.assertEqual(self.snapshot(), before)
        for name in MANIFEST_PATHS:
            (self.root / name).chmod(0o444)
        self.assertEqual(self.cli("version", "set", "0.2.0").returncode, 0)
        self.assertEqual(self.cli("version", "check", "0.2.0").returncode, 0)

    def test_symlink_is_not_followed(self):
        victim = self.root / "unrelated.json"
        victim.write_text('{"version":"0.2.0"}')
        path = self.root / MANIFEST_PATHS[-1]
        path.unlink()
        path.symlink_to(victim)
        self.assertNotEqual(self.cli("version", "set", "1.0.0").returncode, 0)
        self.assertEqual(victim.read_text(), '{"version":"0.2.0"}')

    def test_partial_runtime_error_reports_progress_and_rerun_converges(self):
        unrelated = self.root / "unrelated.txt"
        unrelated.write_text("keep this edit")
        replace = os.replace
        count = 0
        def fail_second(source, destination):
            nonlocal count
            count += 1
            if count == 2:
                raise OSError("injected replace failure")
            return replace(source, destination)
        with patch("release_lib.os.replace", side_effect=fail_second):
            with self.assertRaises(ReleaseError) as caught:
                set_version(self.root, Version.parse("1.0.0"), False)
        self.assertIn("completed:", str(caught.exception))
        self.assertIn("pending:", str(caught.exception))
        self.assertEqual(json.loads((self.root / MANIFEST_PATHS[0]).read_text())["version"], "1.0.0")
        self.assertEqual(json.loads((self.root / MANIFEST_PATHS[1]).read_text())["version"], "0.2.0")
        self.assertEqual(self.cli("version", "set", "1.0.0").returncode, 0)
        self.assertEqual(unrelated.read_text(), "keep this edit")


class PackTests(ScratchCase):
    def setUp(self):
        super().setUp()
        skill = self.root / "skills" / "fixture" / "SKILL.md"
        skill.parent.mkdir(parents=True)
        skill.write_text('---\nname: fixture\ndescription: "A fixture"\n---\n# Fixture\n')
        (self.root / "README.md").write_text("# Root\n[skill](skills/fixture/SKILL.md#fixture)\n")
        self.init()

    def test_supported_links_anchors_reference_and_fenced_examples(self):
        (self.root / "target (copy).md").write_text('# Same\n# Same\n## Use `/command`\n<a id="custom"></a>\n')
        (self.root / "README.md").write_text('''# Root
[one](target%20(copy).md#same-1)
[two](<target (copy).md#use-command> "Title")
[three][anchor]
[anchor]: target%20(copy).md#custom
[here](#root)
````md
[example](missing.md)
```
[still example](absent.md)
````
~~~
[also example](not-real.md)
~~~
`[inline example](not-real.md)`
''')
        self.git("add", ".")
        result = self.cli("validate-pack")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("LIMIT", result.stdout)

    def test_missing_target_anchor_and_undefined_reference_fail(self):
        for link in ("[missing](missing.md)", "[anchor](skills/fixture/SKILL.md#missing)", "[local](#missing)", "[link][unknown]"):
            with self.subTest(link=link):
                (self.root / "README.md").write_text(link)
                result = self.cli("validate-pack")
                self.assertNotEqual(result.returncode, 0)

    def test_existing_folded_metadata_and_quoted_scalars(self):
        path = self.root / "skills/fixture/SKILL.md"
        for description in ('>-\n  A multiline\n  description.', "'A quoted description'", '"A plain description"'):
            path.write_text(f"---\nname: fixture\ndescription: {description}\n---\n# Fixture\n")
            result = self.cli("validate-pack")
            self.assertEqual(result.returncode, 0, result.stderr)
        for description in ('"unclosed', "''", '>-\nname: duplicate', '[not, scalar]'):
            path.write_text(f"---\nname: fixture\ndescription: {description}\n---\n# Fixture\n")
            self.assertNotEqual(self.cli("validate-pack").returncode, 0)

    def test_broken_metadata_and_tracked_runtime_state_fail(self):
        (self.root / "skills/fixture/SKILL.md").write_text("---\nname: fixture\n---\n")
        runtime = self.root / ".scratch" / "leak.txt"
        runtime.parent.mkdir()
        runtime.write_text("runtime")
        self.git("add", ".scratch/leak.txt")
        result = self.cli("validate-pack")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("description", result.stderr)
        self.assertIn("release archives", result.stderr)

    def test_escaping_link_fails_and_dynamic_link_discloses_limit(self):
        (self.root / "README.md").write_text("[escape](../out.md)\n[dynamic]({target})\n")
        result = self.cli("validate-pack")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("escapes repository", result.stderr)
        self.assertIn("dynamic", result.stdout)

    def test_placeholder_line_is_a_limit_but_real_links_still_fail(self):
        path = self.root / "README.md"
        for target in ("url", "destination"):
            path.write_text(f"# Template\n{{Claim}} [PR #123]({target})\n")
            result = self.cli("validate-pack")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("template destination on a placeholder line", result.stdout)
        path.write_text("# Template\n{Claim} [PR #123](url) [broken](missing.md)\n")
        result = self.cli("validate-pack")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing local target missing.md", result.stderr)
        path.write_text("# Document\n[PR #123](url)\n")
        result = self.cli("validate-pack")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing local target url", result.stderr)


GH_STUB = '''#!/usr/bin/env python3
import json, os, pathlib, sys
state_path = pathlib.Path(os.environ["GH_STUB_STATE"])
state = json.loads(state_path.read_text())
args = sys.argv[1:]
entry = {"args": args}
if args[:2] == ["release", "create"]:
    entry["notes"] = pathlib.Path(args[args.index("--notes-file") + 1]).read_text()
with pathlib.Path(os.environ["GH_STUB_LOG"]).open("a") as stream:
    stream.write(json.dumps(entry) + "\\n")
if args[0] == "api":
    endpoint = args[1]
    value = state.get("latest") if endpoint.endswith("releases/latest") else state.get("existing")
    if value is None:
        print("gh: Not Found (HTTP 404)", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(value))
elif args[:2] == ["release", "create"]:
    state["existing"] = {"tag_name": args[2], "draft": False, "prerelease": "--prerelease" in args,
                         "published_at": "2026-01-01T00:00:00Z", "target_commitish": "main"}
    state_path.write_text(json.dumps(state))
else:
    sys.exit("unexpected gh command")
'''


class ReleaseTests(ScratchCase):
    def setUp(self):
        super().setUp()
        self.init()
        self.commit = self.git("rev-parse", "HEAD")
        self.git("tag", "-a", "v0.2.0", "-m", "fixture")
        self.remote = self.root / ".scratch" / "origin.git"
        self.remote.parent.mkdir()
        self.git("clone", "--bare", str(self.root), str(self.remote))
        self.git("remote", "add", "origin", str(self.remote))
        self.state = self.root / ".scratch" / "gh-state.json"
        self.log = self.root / ".scratch" / "gh-calls.jsonl"
        binary = self.root / ".scratch" / "bin"
        binary.mkdir()
        (binary / "gh").write_text(GH_STUB)
        (binary / "gh").chmod(0o755)
        self.env.update(PATH=str(binary) + os.pathsep + self.env["PATH"], GH_STUB_STATE=str(self.state),
                        GH_STUB_LOG=str(self.log), RELEASE_TAG="v0.2.0", GITHUB_EVENT_NAME="push",
                        GITHUB_REF_TYPE="tag", GITHUB_REF_NAME="v0.2.0", GITHUB_REPOSITORY="fixture/pack",
                        VALIDATION_EVIDENCE=json.dumps({"source_commit": self.commit,
                            "gates": {gate: "success" for gate in ("tests", "version", "pack", "rig")},
                            "disclosures": ["MANUAL kimi plugin reload needs UI", "SKIPPED codex smoke no key"]}))
        self.state.write_text(json.dumps({"existing": None, "latest": None}))

    def calls(self):
        return [json.loads(line) for line in self.log.read_text().splitlines()] if self.log.exists() else []

    def create_calls(self):
        return [entry for entry in self.calls() if entry["args"][:2] == ["release", "create"]]

    def test_inspect_uses_current_tools_for_old_target_and_requires_version_agreement(self):
        refs = self.git("show-ref")
        status = self.git("status", "--porcelain")
        result = self.cli("release", "inspect", env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["commit"], self.commit)
        self.assertEqual(self.git("show-ref"), refs)
        self.assertEqual(self.git("status", "--porcelain"), status)
        self.assertFalse((self.root / "scripts/version").exists())
        self.git("tag", "-a", "v0.3.0", "-m", "mismatch")
        self.git("fetch", str(self.root), "refs/tags/v0.3.0:refs/tags/v0.3.0", root=self.remote)
        self.env["RELEASE_TAG"] = "v0.3.0"
        self.assertNotEqual(self.cli("release", "inspect", env=self.env).returncode, 0)

    def test_malicious_tag_and_dispatch_cannot_reach_publication(self):
        for event, tag in (("push", "v0.2.0;touch injected"), ("push", "--help"),
                           ("workflow_dispatch", "v0.2.0"), ("workflow_dispatch", "v0.2.0\ncommit=bad")):
            with self.subTest(event=event, tag=tag):
                self.env.update(GITHUB_EVENT_NAME=event, RELEASE_TAG=tag)
                result = self.cli("release", "publish", "--commit", self.commit, env=self.env)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.calls(), [])
        self.assertFalse((self.root / "injected").exists())

    def test_unannotated_and_non_main_tags_fail(self):
        self.git("tag", "v0.2.1")
        self.git("fetch", str(self.root), "refs/tags/v0.2.1:refs/tags/v0.2.1", root=self.remote)
        self.env["RELEASE_TAG"] = "v0.2.1"
        self.assertNotEqual(self.cli("release", "inspect", env=self.env).returncode, 0)
        self.git("checkout", "-qb", "other")
        (self.root / "other").write_text("other")
        self.git("add", "other")
        self.git("commit", "-qm", "off main")
        self.git("tag", "-a", "v0.2.2", "-m", "off main")
        self.git("fetch", str(self.root), "refs/tags/v0.2.2:refs/tags/v0.2.2", root=self.remote)
        self.env["RELEASE_TAG"] = "v0.2.2"
        self.assertNotEqual(self.cli("release", "inspect", env=self.env).returncode, 0)

    def test_zero_major_release_uses_verify_tag_generated_notes_and_real_disclosures(self):
        result = self.cli("release", "publish", "--commit", self.commit, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        creates = self.create_calls()
        self.assertEqual(len(creates), 1)
        self.assertIn("--verify-tag", creates[0]["args"])
        self.assertIn("--generate-notes", creates[0]["args"])
        self.assertIn("--latest=true", creates[0]["args"])
        self.assertNotIn("--prerelease", creates[0]["args"])
        self.assertIn("MANUAL kimi", creates[0]["notes"])
        self.assertIn("SKIPPED codex", creates[0]["notes"])
        repeated = self.cli("release", "publish", "--commit", self.commit, env=self.env)
        self.assertEqual(repeated.returncode, 0, repeated.stderr)
        self.assertIn("unchanged", repeated.stdout)
        self.assertEqual(len(self.create_calls()), 1)

    def test_older_stable_and_equal_build_precedence_do_not_displace_latest(self):
        for latest in ("v0.3.0", "v0.2.0+different"):
            with self.subTest(latest=latest):
                self.state.write_text(json.dumps({"existing": None, "latest": {"tag_name": latest, "draft": False, "prerelease": False}}))
                result = self.cli("release", "publish", "--commit", self.commit, env=self.env)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("--latest=false", self.create_calls()[-1]["args"])

    def test_prerelease_suffix_only(self):
        version = "0.3.0-rc.1+build.001"
        self.manifests(version)
        self.git("add", ".claude-plugin", ".cursor-plugin", "kimi.plugin.json", "plugin.json")
        self.git("commit", "-qm", "prerelease")
        sha = self.git("rev-parse", "HEAD")
        tag = "v" + version
        self.git("tag", "-a", tag, "-m", "prerelease")
        self.git("fetch", str(self.root), "refs/heads/main:refs/heads/main", f"refs/tags/{tag}:refs/tags/{tag}", root=self.remote)
        self.env.update(RELEASE_TAG=tag, GITHUB_REF_NAME=tag)
        proof = json.loads(self.env["VALIDATION_EVIDENCE"])
        proof["source_commit"] = sha
        self.env["VALIDATION_EVIDENCE"] = json.dumps(proof)
        result = self.cli("release", "publish", "--commit", sha, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("--prerelease", self.create_calls()[0]["args"])
        self.assertIn("--latest=false", self.create_calls()[0]["args"])

    def test_conflicting_release_state_wrong_commit_and_failed_gate_refuse_writes(self):
        for existing in ({"tag_name": "v0.2.0", "draft": True, "prerelease": False, "published_at": None},
                         {"tag_name": "v9.0.0", "draft": False, "prerelease": False, "published_at": "date"},
                         {"tag_name": "v0.2.0", "draft": False, "prerelease": True, "published_at": "date"}):
            self.state.write_text(json.dumps({"existing": existing, "latest": None}))
            self.assertNotEqual(self.cli("release", "publish", "--commit", self.commit, env=self.env).returncode, 0)
            self.assertEqual(self.create_calls(), [])
        wrong = "a" * 40
        self.assertNotEqual(self.cli("release", "publish", "--commit", wrong, env=self.env).returncode, 0)
        proof = json.loads(self.env["VALIDATION_EVIDENCE"])
        proof["gates"]["rig"] = "failure"
        self.env["VALIDATION_EVIDENCE"] = json.dumps(proof)
        self.assertNotEqual(self.cli("release", "publish", "--commit", self.commit, env=self.env).returncode, 0)
        self.assertEqual(self.create_calls(), [])

    def test_remote_tag_moved_since_validation_is_rejected(self):
        (self.root / "next").write_text("next")
        self.git("add", "next")
        self.git("commit", "-qm", "next")
        self.git("tag", "-fa", "v0.2.0", "-m", "moved fixture")
        self.git("fetch", str(self.root), "+refs/heads/main:refs/heads/main", "+refs/tags/v0.2.0:refs/tags/v0.2.0", root=self.remote)
        self.assertNotEqual(self.cli("release", "publish", "--commit", self.commit, env=self.env).returncode, 0)
        self.assertEqual(self.create_calls(), [])


    def test_source_commit_rejects_untrusted_refs_before_checkout(self):
        output = self.root / ".scratch" / "outputs"
        for source in ("main", "refs/tags/v0.2.0", "a" * 39, "a" * 40 + "\nnext=bad", "$(touch injected)"):
            self.env["SOURCE_COMMIT"] = source
            result = self.cli("release", "source", "--github-output", str(output), env=self.env)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists())
        self.env["SOURCE_COMMIT"] = self.commit
        result = self.cli("release", "source", "--github-output", str(output), env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output.read_text(), f"commit={self.commit}\n")

    def test_evidence_reports_failed_gates_and_exact_manual_lines(self):
        logs = self.root / ".scratch" / "logs"
        logs.mkdir()
        matrix = "MATRIX kimi plugin-child MANUAL detail=live child needs a model"
        expected = ["MANUAL kimi reload UI", "SKIPPED codex smoke no key", matrix]
        (logs / "rig.log").write_text("\n".join(["OK kimi stage done", *expected, matrix, "MANUAL kimi reload UI"]) + "\n")
        output = self.root / ".scratch" / "outputs"
        summary = self.root / ".scratch" / "summary"
        self.env.update(TESTS_RESULT="success", VERSION_RESULT="success", PACK_RESULT="failure", RIG_RESULT="success",
                        GITHUB_STEP_SUMMARY=str(summary))
        result = self.cli("release", "evidence", "--logs", str(logs), "--github-output", str(output), env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        value = json.loads(result.stdout)
        self.assertEqual(value["source_commit"], self.commit)
        self.assertEqual(value["gates"]["pack"], "failure")
        self.assertEqual(value["disclosures"], expected)
        self.assertIn("Manual and skipped checks are not passes", summary.read_text())
        self.assertIn(matrix, summary.read_text())
        self.assertEqual(json.loads((logs / "evidence.json").read_text()), value)
        self.env["VALIDATION_EVIDENCE"] = json.dumps(value)
        self.assertNotEqual(self.cli("release", "publish", "--commit", self.commit, env=self.env).returncode, 0)
        value["gates"]["pack"] = "success"
        self.env["VALIDATION_EVIDENCE"] = json.dumps(value)
        result = self.cli("release", "publish", "--commit", self.commit, env=self.env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(matrix, self.create_calls()[0]["notes"])


class FrozenSkillsTests(unittest.TestCase):
    def setUp(self):
        scratch = ROOT / ".scratch" / "release-pipeline" / "tests"
        scratch.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(dir=scratch)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.skill = self.root / "skills" / "demo" / "SKILL.md"
        self.skill.parent.mkdir(parents=True)
        self.skill.write_text("frozen\n", encoding="utf-8")
        self.manifest = self.root / "references" / "frozen-skills.tsv"
        self.manifest.parent.mkdir(parents=True)
        self.write_manifest()

    def write_manifest(self):
        self.manifest.write_text(
            f"skills/demo/SKILL.md\t{hashlib.sha256(self.skill.read_bytes()).hexdigest()}\n",
            encoding="utf-8",
        )

    def test_matching_freeze_has_no_problems(self):
        self.assertEqual(check_frozen_skills(self.root), [])

    def test_changed_file_is_reported(self):
        self.skill.write_text("changed\n", encoding="utf-8")
        self.assertTrue(any("changed" in problem for problem in check_frozen_skills(self.root)))

    def test_new_file_in_frozen_skill_is_reported(self):
        (self.skill.parent / "new.md").write_text("new\n", encoding="utf-8")
        self.assertTrue(any("new file" in problem for problem in check_frozen_skills(self.root)))


if __name__ == "__main__":
    unittest.main()
