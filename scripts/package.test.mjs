import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { packageApp } from "./package.mjs";

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "crew-package-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["docs", "research", "ui/src", "ui/dist", "ui/assets"])
    await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(
    path.join(root, "app.json"),
    JSON.stringify({
      name: "crew-calendar",
      ui: { entry: "dist/index.mjs", pages: [{ iconUrl: "assets/icon.svg" }] },
    }),
  );
  await writeFile(
    path.join(root, "ui/dist/index.mjs"),
    "export default function App() {}",
  );
  await writeFile(
    path.join(root, "ui/assets/icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
  );
  await writeFile(path.join(root, "docs/private.md"), "PRIVATE");
  await writeFile(path.join(root, "research/private.md"), "PRIVATE");
  await writeFile(path.join(root, "ui/src/private.ts"), "PRIVATE");
  return root;
}

test("package includes runtime only, ignoring documents and source", async (t) => {
  const root = await fixture(t);
  const output = await packageApp(root, path.join(root, ".build"));
  assert.deepEqual((await readdir(output, { recursive: true })).sort(), [
    "app.json",
    "ui",
    "ui/assets",
    "ui/assets/icon.svg",
    "ui/dist",
    "ui/dist/index.mjs",
  ]);
});

test("packaging rejects a runtime symlink without replacing the existing output", async (t) => {
  const root = await fixture(t);
  const output = await packageApp(root, path.join(root, ".build"));
  await symlink(
    path.join(root, "docs/private.md"),
    path.join(root, "ui/assets/private.svg"),
  );
  await assert.rejects(packageApp(root, path.join(root, ".build")), /symlink/);
  assert.match(
    await readFile(path.join(output, "ui/dist/index.mjs"), "utf8"),
    /export default/,
  );
});

test("a missing manifest asset fails before replacing a valid package", async (t) => {
  const root = await fixture(t);
  const output = await packageApp(root, path.join(root, ".build"));
  await rm(path.join(root, "ui/assets/icon.svg"));
  await assert.rejects(packageApp(root, path.join(root, ".build")));
  assert.match(
    await readFile(path.join(output, "ui/assets/icon.svg"), "utf8"),
    /svg/,
  );
});
