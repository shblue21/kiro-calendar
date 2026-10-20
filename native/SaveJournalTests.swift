import Darwin
import Foundation

@main
struct SaveJournalTests {
    static func check(_ value: Bool) { precondition(value) }
    static func child(_ path: URL, _ mode: String) throws -> Int32 {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: CommandLine.arguments[0])
        process.arguments = [path.path, mode]
        try process.run()
        process.waitUntilExit()
        return process.terminationStatus
    }
    @MainActor static func main() throws {
        if CommandLine.arguments.count == 3 {
            let path = URL(fileURLWithPath: CommandLine.arguments[1])
            let mode = CommandLine.arguments[2]
            if mode == "respond" {
                try atomic(["state": "cancelled"], at: path)
                removeAbandonedResponse(path)
                exit(0)
            }
            guard let ledger = try SaveJournal(path) else { exit(7) }
            if mode != "lock" { try ledger.save(["state": mode]) }
            // Simulate termination without running deinit; the OS must release the lock.
            exit(0)
        }
        for title in [
            String(repeating: "a", count: 120), String(repeating: "😀", count: 120),
            String(repeating: "e\u{0301}", count: 60),
        ] {
            check(
                validEventText(title: title, notes: String(repeating: "😀", count: 2000))
            )
            check(!validEventText(title: title + "a", notes: ""))
        }
        check(
            !validEventText(title: "Event", notes: String(repeating: "😀", count: 2001)))
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(
            UUID().uuidString)
        try FileManager.default.createDirectory(
            at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        // A late helper cleans its response only after the waiting reader has left.
        for waiting in [true, false] {
            let folder = root.appendingPathComponent(UUID().uuidString)
            try FileManager.default.createDirectory(
                at: folder, withIntermediateDirectories: true)
            let lock = folder.appendingPathComponent(".waiter.lock")
            let fd = Darwin.open(lock.path, O_CREAT | O_RDWR, 0o600)
            precondition(fd >= 0)
            if waiting { precondition(flock(fd, LOCK_SH) == 0) }
            let response = folder.appendingPathComponent("response.json")
            check(try child(response, "respond") == 0)
            precondition(
                FileManager.default.fileExists(atPath: response.path) == waiting)
            precondition(FileManager.default.fileExists(atPath: folder.path) == waiting)
            Darwin.close(fd)
            if waiting { try FileManager.default.removeItem(at: folder) }
        }
        let path = root.appendingPathComponent("operation.json")
        // A live confirmation/writer excludes both another create and reconciliation.
        do {
            let ledger = try SaveJournal(path)!
            try withExtendedLifetime(ledger) {
                check(try child(path, "lock") == 7)
                check(try ledger.load() == nil)
            }
        }
        check(try child(path, "lock") == 0)
        // Missing journal (claim-only interruption) and abandoned confirmation are sealed.
        for phase in ["missing", "awaiting_confirmation"] {
            try? FileManager.default.removeItem(at: path)
            if phase != "missing" { check(try child(path, phase) == 0) }
            do {
                let ledger = try SaveJournal(path)!
                try withExtendedLifetime(ledger) {
                    let result = try ledger.reconcileUnwritten(ledger.load())
                    precondition(result?["state"] as? String == "cancelled")
                }
            }
            let delayed = try SaveJournal(path)!
            try withExtendedLifetime(delayed) {
                check(try delayed.load()?["state"] as? String == "cancelled")
                check(
                    try delayed.reconcileUnwritten(delayed.load())?["state"] as? String
                        == "cancelled")
            }
        }
        // Any write evidence or unknown state remains blocked; no absence inference.
        for phase in ["writing", "written", "unknown", "confirmed", "unrecognized"] {
            check(try child(path, phase) == 0)
            let ledger = try SaveJournal(path)!
            try withExtendedLifetime(ledger) {
                check(try ledger.reconcileUnwritten(ledger.load()) == nil)
                check(try ledger.load()?["state"] as? String == phase)
            }
        }
        // Corruption must propagate, never become a missing journal and cancellation.
        try Data("broken".utf8).write(to: path)
        let ledger = try SaveJournal(path)!
        do {
            _ = try ledger.load()
            fatalError("Corrupt journal accepted")
        } catch {}
        // Exercise the real reconcile entry point with a nonexistent calendar.
        let bridge = Bridge()
        bridge.dataRoot = root
        let id = UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        let journalPath = root.appendingPathComponent("native-ledger/" + id + ".json")
        let operation: Object = [
            "id": id, "state": "awaiting_confirmation",
            "target": ["calendarId": "missing-" + UUID().uuidString],
            "payload": [
                "title": "Recovery test", "notes": "",
                "start": "2026-10-19T10:00:00+09:00",
                "end": "2026-10-19T11:00:00+09:00", "timezone": "Asia/Seoul",
            ],
        ]
        bridge.request = ["operation": operation]
        for phase in ["missing", "awaiting_confirmation"] {
            try? FileManager.default.removeItem(at: journalPath)
            if phase != "missing" { try atomic(["state": phase], at: journalPath) }
            check(try bridge.reconcile()["state"] as? String == "cancelled")
            check(try read(journalPath)["state"] as? String == "cancelled")
        }
        for phase in ["writing", "written", "unknown", "confirmed"] {
            try atomic(["state": phase], at: journalPath)
            do {
                _ = try bridge.reconcile()
                fatalError("Missing calendar unexpectedly resolved")
            } catch is BridgeError {}
            check(try read(journalPath)["state"] as? String == phase)
        }
        // A backend confirmation cannot be cancelled even if its native receipt is absent.
        bridge.request = [
            "operation": operation.merging(["state": "confirmed"]) { _, new in new }
        ]
        try FileManager.default.removeItem(at: journalPath)
        do {
            _ = try bridge.reconcile()
            fatalError("Confirmed operation was treated as unwritten")
        } catch is BridgeError {}
        check(!FileManager.default.fileExists(atPath: journalPath.path))
        print(
            "SaveJournal: process locking, interruption, sealing, write evidence, corruption passed"
        )
    }
}
