import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
if (process.platform !== "darwin") {
  console.log("Core calendar package: Apple Calendar bridge is macOS-only.");
  process.exit(0);
}
const bundle = path.join(root, ".build/native/Crew Calendar Bridge.app");
await rm(bundle, { recursive: true, force: true });
await mkdir(path.join(bundle, "Contents/MacOS"), { recursive: true });
const executable = path.join(bundle, "Contents/MacOS/CrewCalendarBridge");
const arch = process.arch === "arm64" ? "arm64" : "x86_64";
execFileSync(
  "/usr/bin/xcrun",
  [
    "swiftc",
    "-parse-as-library",
    "-swift-version",
    "5",
    "-O",
    "-target",
    `${arch}-apple-macosx14.0`,
    "-framework",
    "AppKit",
    "-framework",
    "EventKit",
    path.join(root, "native/CrewCalendarBridge.swift"),
    "-o",
    executable,
  ],
  { stdio: "inherit" },
);
await writeFile(
  path.join(bundle, "Contents/Info.plist"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>dev.crew-calendar.eventkit</string>
<key>CFBundleName</key><string>Crew Calendar 연결</string>
<key>CFBundleDisplayName</key><string>Crew Calendar 연결</string>
<key>CFBundleExecutable</key><string>CrewCalendarBridge</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.2.0</string>
<key>CFBundleVersion</key><string>2</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>LSUIElement</key><true/>
<key>NSCalendarsFullAccessUsageDescription</key><string>선택한 캘린더의 일정을 표시하고 직접 확인한 새 일정을 저장합니다. 기존 일정 조회를 위해 macOS의 전체 접근 권한이 필요합니다.</string>
</dict></plist>`,
);
// Local development identity. Public distribution still requires release signing/notarization.
execFileSync(
  "/usr/bin/codesign",
  ["--force", "--sign", "-", "--identifier", "dev.crew-calendar.eventkit", bundle],
  { stdio: "inherit" },
);
execFileSync("/usr/bin/codesign", ["--verify", "--strict", bundle], {
  stdio: "inherit",
});
console.log(bundle);
