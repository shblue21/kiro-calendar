import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
if (process.platform !== "darwin") {
  console.log("Core calendar package: Apple Calendar bridge is macOS-only.");
  process.exit(0);
}
const { version } = JSON.parse(await readFile(path.join(root, "app.json"), "utf8"));
if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(
    "The native bundle requires an app version in major.minor.patch form.",
  );
}
const minimumMacOS = "14.0";
const bundleIdentifier = "dev.crew-calendar.eventkit";
const bundle = path.join(root, ".build/native/Crew Calendar Bridge.app");
await rm(bundle, { recursive: true, force: true });
await mkdir(path.join(bundle, "Contents/MacOS"), { recursive: true });
const executable = path.join(bundle, "Contents/MacOS/CrewCalendarBridge");
const architectures = ["arm64", "x86_64"];
const temporary = await mkdtemp(path.join(root, ".build/native/slices-"));
try {
  const slices = architectures.map((arch) => path.join(temporary, arch));
  for (const [index, arch] of architectures.entries()) {
    execFileSync(
      "/usr/bin/xcrun",
      [
        "swiftc",
        "-parse-as-library",
        "-swift-version",
        "5",
        "-O",
        "-target",
        `${arch}-apple-macosx${minimumMacOS}`,
        "-framework",
        "AppKit",
        "-framework",
        "EventKit",
        path.join(root, "native/CrewCalendarBridge.swift"),
        "-o",
        slices[index],
      ],
      { stdio: "inherit" },
    );
  }
  execFileSync(
    "/usr/bin/xcrun",
    ["lipo", "-create", ...slices, "-output", executable],
    { stdio: "inherit" },
  );
  execFileSync(
    "/usr/bin/xcrun",
    ["lipo", executable, "-verify_arch", ...architectures],
    { stdio: "inherit" },
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
await writeFile(
  path.join(bundle, "Contents/Info.plist"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>${bundleIdentifier}</string>
<key>CFBundleName</key><string>Crew Calendar 연결</string>
<key>CFBundleDisplayName</key><string>Crew Calendar 연결</string>
<key>CFBundleExecutable</key><string>CrewCalendarBridge</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>${minimumMacOS}</string>
<key>LSUIElement</key><true/>
<key>NSCalendarsFullAccessUsageDescription</key><string>선택한 캘린더의 일정을 표시하고 직접 확인한 새 일정을 저장합니다. 기존 일정 조회를 위해 macOS의 전체 접근 권한이 필요합니다.</string>
</dict></plist>`,
);
// Sign the combined binary. No Developer ID identity is configured.
execFileSync(
  "/usr/bin/codesign",
  ["--force", "--sign", "-", "--identifier", bundleIdentifier, bundle],
  { stdio: "inherit" },
);
execFileSync(
  "/usr/bin/codesign",
  ["--verify", "--strict", "--all-architectures", bundle],
  {
    stdio: "inherit",
  },
);
console.log(bundle);
