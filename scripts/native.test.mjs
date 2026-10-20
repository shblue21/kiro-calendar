import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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
          "-o",
          executable,
        ],
        { stdio: "pipe" },
      );
      execFileSync(executable, { stdio: "pipe", timeout: 30000 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
