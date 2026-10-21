import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { prepareRelease } from "./prepare-release.mjs";

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "crew-release-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = path.join(directory, "source");
  const remote = path.join(directory, "remote.git");
  const git = (args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();
  await mkdir(root);
  git(["init", "--initial-branch=main"]);
  git(["config", "user.name", "Release test"]);
  git(["config", "user.email", "release-test@example.invalid"]);
  git(["init", "--bare", remote]);
  git(["remote", "add", "origin", remote]);
  const manifest = JSON.stringify({ name: "crew-calendar", version: "1.2.3" });
  await writeFile(path.join(root, "app.json"), manifest);
  await writeFile(path.join(root, ".gitignore"), ".build/\n");
  await writeFile(path.join(root, "source-only.txt"), "source only\n");
  git(["add", "."]);
  git(["commit", "-m", "Source"]);
  const source = git(["rev-parse", "HEAD"]);
  const packaged = path.join(root, ".build/crew-calendar");
  const executable =
    "native/Crew Calendar Bridge.app/Contents/MacOS/CrewCalendarBridge";
  for (const [file, contents] of Object.entries({
    "app.json": manifest,
    LICENSE: "Project license\n",
    "THIRD_PARTY_NOTICES.txt": "Dependency notices\n",
    "ui/dist/index.mjs": "export default {};\n",
    [executable]: "native test fixture\n",
  })) {
    await mkdir(path.dirname(path.join(packaged, file)), { recursive: true });
    await writeFile(path.join(packaged, file), contents);
  }
  await chmod(path.join(packaged, executable), 0o755);
  return { root, packaged, source, git, executable };
}

test("release tag and branch point to the runtime commit and leave main untouched", async (t) => {
  const { root, packaged, source, git, executable } = await fixture(t);
  const indexBefore = await readFile(path.join(root, ".git/index"));
  const release = await prepareRelease(root);
  assert.equal(release.source, source);
  assert.equal(release.branch, "release-v1.2.3");
  assert.equal(release.tag, "v1.2.3");
  assert.notEqual(release.commit, source);
  assert.equal(git(["rev-parse", `${release.tag}^{commit}`]), release.commit);
  assert.equal(git(["rev-parse", release.branch]), release.commit);
  assert.equal(git(["rev-parse", `${release.commit}^`]), source);
  assert.equal(git(["cat-file", "-t", release.tag]), "tag");
  assert.equal(git(["rev-parse", "HEAD"]), source);
  assert.equal(git(["branch", "--show-current"]), "main");
  assert.equal(git(["status", "--porcelain"]), "");
  assert.deepEqual(await readFile(path.join(root, ".git/index")), indexBefore);
  assert.deepEqual(git(["ls-tree", "-r", "--name-only", release.commit]).split("\n"), [
    "LICENSE",
    "THIRD_PARTY_NOTICES.txt",
    "app.json",
    executable,
    "ui/dist/index.mjs",
  ]);
  assert.match(git(["ls-tree", release.commit, "--", executable]), /^100755 blob /);
  assert.equal(
    git(["show", `${release.tag}:THIRD_PARTY_NOTICES.txt`]),
    (await readFile(path.join(packaged, "THIRD_PARTY_NOTICES.txt"), "utf8")).trim(),
  );
});

test("release refuses an existing local tag or remote branch", async (t) => {
  for (const location of ["local tag", "remote branch"]) {
    await t.test(location, async (t) => {
      const { root, source, git } = await fixture(t);
      if (location === "local tag") git(["tag", "v1.2.3", source]);
      else git(["push", "origin", `${source}:refs/heads/release-v1.2.3`]);
      const refs = git(["show-ref"]);
      const remoteRefs = git(["ls-remote", "origin"]);
      await assert.rejects(prepareRelease(root), /already exists/);
      assert.equal(git(["show-ref"]), refs);
      assert.equal(git(["ls-remote", "origin"]), remoteRefs);
    });
  }
});

test("release refuses dirty source and a package from a different manifest", async (t) => {
  const { root, packaged, git } = await fixture(t);
  const refs = git(["show-ref"]);
  await writeFile(path.join(root, "uncommitted.txt"), "not committed\n");
  await assert.rejects(prepareRelease(root), /clean source checkout/);
  await rm(path.join(root, "uncommitted.txt"));
  await writeFile(path.join(packaged, "app.json"), '{"version":"0.0.1"}');
  await assert.rejects(prepareRelease(root), /Package manifest differs/);
  assert.equal(git(["show-ref"]), refs);
});
