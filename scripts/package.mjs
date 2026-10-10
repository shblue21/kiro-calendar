import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const runtimeExtensions = new Set([
  ".mjs",
  ".js",
  ".css",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".woff",
  ".woff2",
]);

async function copyRuntimeTree(source, destination) {
  const stat = await lstat(source);
  if (stat.isSymbolicLink())
    throw new Error(`Runtime symlinks are not packaged: ${source}`);
  if (stat.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const name of (await readdir(source)).sort()) {
      await copyRuntimeTree(
        path.join(source, name),
        path.join(destination, name),
      );
    }
  } else if (stat.isFile()) {
    if (!runtimeExtensions.has(path.extname(source)))
      throw new Error(`Unexpected runtime file: ${source}`);
    await copyFile(source, destination);
  } else {
    throw new Error(`Not a regular runtime file: ${source}`);
  }
}

// Backend: top-level Python modules only (no __pycache__, tests or subpackages).
async function copyBackend(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const name of (await readdir(source)).sort()) {
    const file = path.join(source, name);
    const stat = await lstat(file);
    if (stat.isSymbolicLink())
      throw new Error(`Runtime symlinks are not packaged: ${file}`);
    if (stat.isFile() && path.extname(name) === ".py")
      await copyFile(file, path.join(destination, name));
  }
}

async function requireAsset(staging, relativePath) {
  if (
    typeof relativePath !== "string" ||
    !relativePath ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Manifest UI paths must be relative to ui/");
  }
  const uiRoot = path.join(staging, "ui");
  const resolved = path.resolve(uiRoot, relativePath);
  if (
    !resolved.startsWith(uiRoot + path.sep) ||
    !(await lstat(resolved)).isFile()
  ) {
    throw new Error(`Missing or invalid manifest asset: ${relativePath}`);
  }
}

// Runtime allowlist; never copy the project root or consult .gitignore as a package filter.
export async function packageApp(sourceRoot, buildRoot, { platform = process.platform } = {}) {
  const manifestPath = path.join(sourceRoot, "app.json");
  if ((await lstat(manifestPath)).isSymbolicLink())
    throw new Error("Manifest must not be a symlink");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.name !== "crew-calendar")
    throw new Error("Unexpected app identity");
  await mkdir(buildRoot, { recursive: true });
  if ((await lstat(buildRoot)).isSymbolicLink())
    throw new Error("Build directory must not be a symlink");
  const staging = await mkdtemp(path.join(buildRoot, ".crew-calendar-"));
  try {
    await copyFile(manifestPath, path.join(staging, "app.json"));
    for (const directory of ["dist", "assets"]) {
      await copyRuntimeTree(
        path.join(sourceRoot, "ui", directory),
        path.join(staging, "ui", directory),
      );
    }
    if (manifest.backend || manifest.mcpServers)
      await copyBackend(path.join(sourceRoot, "backend"), path.join(staging, "backend"));
    if (platform === "darwin" && manifest.platform?.os?.includes("macos")) {
      const bundle = "Crew Calendar Bridge.app";
      for (const file of ["Contents/Info.plist", "Contents/MacOS/CrewCalendarBridge", "Contents/_CodeSignature/CodeResources"]) {
        const source = path.join(sourceRoot, ".build/native", bundle, file);
        const stat = await lstat(source);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Invalid native runtime: ${source}`);
        const destination = path.join(staging, "native", bundle, file);
        await mkdir(path.dirname(destination), { recursive: true });
        await copyFile(source, destination);
      }
    }
    await requireAsset(staging, manifest.ui?.entry);
    for (const page of manifest.ui?.pages ?? []) {
      for (const field of ["entryPoint", "iconUrl", "iconInactiveUrl"]) {
        if (page[field]) await requireAsset(staging, page[field]);
      }
    }
    const output = path.join(buildRoot, "crew-calendar");
    await rm(output, { recursive: true, force: true });
    await rename(staging, output);
    return output;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  console.log(await packageApp(root, path.join(root, ".build")));
}
