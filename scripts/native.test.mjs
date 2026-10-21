import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
test(
  "native save journal survives interrupted operations without permitting duplicate writes",
  { skip: process.platform !== "darwin" },
  () => {
    const dir = mkdtempSync(path.join(tmpdir(), "crew-ledger-test-"));
    try {
      const executable = path.join(dir, "ledger-tests");
      const plist = path.join(dir, "Info.plist");
      writeFileSync(
        plist,
        `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict><key>CFBundleShortVersionString</key><string>7.8.9</string></dict></plist>`,
      );
      execFileSync(
        "/usr/bin/xcrun",
        [
          "swiftc",
          "-parse-as-library",
          "-swift-version",
          "5",
          "-D",
          "LEDGER_TEST",
          "-framework",
          "AppKit",
          "-framework",
          "EventKit",
          path.join(root, "native/CrewCalendarBridge.swift"),
          path.join(root, "native/SaveJournalTests.swift"),
          "-Xlinker",
          "-sectcreate",
          "-Xlinker",
          "__TEXT",
          "-Xlinker",
          "__info_plist",
          "-Xlinker",
          plist,
          "-o",
          executable,
        ],
        { stdio: "pipe" },
      );
      execFileSync(executable, { stdio: "pipe", timeout: 30000 });
      const status = JSON.parse(
        execFileSync(executable, ["status"], { encoding: "utf8", timeout: 10000 }),
      );
      assert.equal(status.helperVersion, "7.8.9");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
