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

test("a manifest with a backend packages its Python modules only", async (t) => {
  const root = await fixture(t);
  const manifest = JSON.parse(await readFile(path.join(root, "app.json"), "utf8"));
  manifest.backend = { hooks: { routes: "backend.routes:register_routes" } };
  await writeFile(path.join(root, "app.json"), JSON.stringify(manifest));
  await mkdir(path.join(root, "backend/__pycache__"), { recursive: true });
  await mkdir(path.join(root, "tests"), { recursive: true });
  await writeFile(path.join(root, "backend/routes.py"), "def register_routes(ctx): return []");
  await writeFile(path.join(root, "backend/__pycache__/routes.cpython-312.pyc"), "x");
  await writeFile(path.join(root, "backend/notes.md"), "PRIVATE");
  await writeFile(path.join(root, "tests/test_x.py"), "PRIVATE");
  const output = await packageApp(root, path.join(root, ".build"));
  const files = (await readdir(output, { recursive: true })).sort();
  assert.ok(files.includes("backend/routes.py"));
  assert.ok(!files.some((f) => f.includes("__pycache__") || f.endsWith(".md") || f.startsWith("tests")));
});

test("desktop package requires and preserves the native runtime", async (t) => {
  const root = await fixture(t);
  const manifest = JSON.parse(await readFile(path.join(root, "app.json"), "utf8"));
  manifest.platform = { os: ["macos", "windows", "linux"] };
  await writeFile(path.join(root, "app.json"), JSON.stringify(manifest));
  await assert.rejects(packageApp(root, path.join(root, ".build"), {platform:"darwin"}));
  const bundle = "Crew Calendar Bridge.app";
  const files = ["Contents/Info.plist", "Contents/MacOS/CrewCalendarBridge", "Contents/_CodeSignature/CodeResources"];
  for (const file of files) {
    const source = path.join(root, ".build/native", bundle, file);
    await mkdir(path.dirname(source), { recursive: true });
    await writeFile(source, file);
  }
  const output = await packageApp(root, path.join(root, ".build"), {platform:"darwin"});
  for (const file of files) assert.equal(await readFile(path.join(output, "native", bundle, file), "utf8"), file);
});

test("Windows and Linux core packages do not require or include the Apple bridge", async (t) => {
  const root = await fixture(t);
  const manifest = JSON.parse(await readFile(path.join(root, "app.json"), "utf8"));
  manifest.platform = {os:["macos","windows","linux"],arch:[]};
  await writeFile(path.join(root, "app.json"), JSON.stringify(manifest));
  for (const platform of ["win32","linux"]) {
    const output = await packageApp(root, path.join(root, ".build"), {platform});
    assert.ok(!(await readdir(output)).includes("native"));
    assert.ok((await readdir(output)).includes("ui"));
  }
});
