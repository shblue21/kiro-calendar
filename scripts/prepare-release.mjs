import { execFileSync } from "node:child_process";
import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Run after package.mjs. Keep the source checkout and its index unchanged.
export async function prepareRelease(root) {
  const git = (args, options = {}) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", ...options }).trim();
  if (git(["status", "--porcelain"]))
    throw new Error("Release requires a clean source checkout.");

  const manifest = await readFile(path.join(root, "app.json"), "utf8");
  const { version } = JSON.parse(manifest);
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version))
    throw new Error("Release version must be major.minor.patch.");
  const tag = `v${version}`;
  const branch = `release-${tag}`;
  const refs = [`refs/heads/${branch}`, `refs/tags/${tag}`];
  if (
    git(["for-each-ref", "--format=%(refname)", ...refs]) ||
    git(["ls-remote", "--refs", "origin", ...refs])
  )
    throw new Error(`Release ${tag} already exists. Bump app.json first.`);

  const packaged = path.join(root, ".build/crew-calendar");
  if ((await readFile(path.join(packaged, "app.json"), "utf8")) !== manifest)
    throw new Error("Package manifest differs from the source. Rebuild the package.");

  const source = git(["rev-parse", "HEAD"]);
  const gitDir = git(["rev-parse", "--absolute-git-dir"]);
  const temporary = await mkdtemp(path.join(tmpdir(), "crew-release-index-"));
  let commit;
  try {
    const stage = (args) =>
      git(["--git-dir", gitDir, ...args], {
        cwd: packaged,
        env: {
          ...process.env,
          GIT_WORK_TREE: packaged,
          GIT_INDEX_FILE: path.join(temporary, "index"),
        },
      });
    stage(["read-tree", "--empty"]);
    stage(["add", "--all", "--force", "--", "."]);
    const tree = stage(["write-tree"]);
    commit = git([
      "commit-tree",
      tree,
      "-p",
      source,
      "-m",
      `Release ${tag}`,
      "-m",
      `Runtime package built from ${source}.`,
    ]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  git(["branch", branch, commit]);
  git(["tag", "-a", tag, commit, "-m", `Crew Calendar ${tag}\nSource: ${source}`]);
  return { branch, tag, commit, source };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const release = await prepareRelease(fileURLToPath(new URL("../", import.meta.url)));
  console.log(JSON.stringify(release, null, 2));
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      Object.entries(release)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(""),
    );
}
