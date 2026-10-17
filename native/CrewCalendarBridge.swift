import AppKit
import Darwin
import EventKit
import Foundation

typealias Object = [String: Any]
struct BridgeError: Error {
    let code: String
    let message: String
}
func string(_ obj: Object, _ key: String) throws -> String {
    guard let s = obj[key] as? String, !s.isEmpty else {
        throw BridgeError(code: "invalid_request", message: "필수 정보가 없습니다: \(key)")
    }
    return s
}
func date(_ value: String) throws -> Date {
    let parser = ISO8601DateFormatter()
    parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let d = parser.date(from: value) {
        return Date(timeIntervalSince1970: floor(d.timeIntervalSince1970))
    }
    parser.formatOptions = [.withInternetDateTime]
    guard let d = parser.date(from: value) else {
        throw BridgeError(code: "invalid_date", message: "날짜와 시간대를 확인하세요.")
    }
    return d
}
func iso(_ value: Date) -> String {
    ISO8601DateFormatter().string(
        from: Date(timeIntervalSince1970: floor(value.timeIntervalSince1970)))
}
func atomic(_ value: Object, at url: URL) throws {
    let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    try data.write(to: url, options: .atomic)
    try FileManager.default.setAttributes(
        [.posixPermissions: 0o600], ofItemAtPath: url.path)
}
func read(_ url: URL) throws -> Object {
    guard
        let value = try JSONSerialization.jsonObject(with: Data(contentsOf: url))
            as? Object
    else {
        throw BridgeError(code: "invalid_request", message: "연결 요청을 읽지 못했습니다.")
    }
    return value
}

private let maximumTitleLength = 120
private let confirmationTimeout: TimeInterval = 120
struct SaveOperation {
    let id: String
    let title: String
    let notes: String
    let timeZone: TimeZone
    var calendar: EKCalendar
    let start: Date
    let end: Date
    let journalURL: URL
    var marker: URL { URL(string: "crew-calendar://operation/\(id)")! }
}
/// Native windows follow macOS language; protocol error codes remain language-independent.
func nativeText(_ english: String, _ korean: String) -> String {
    Locale.preferredLanguages.first?.hasPrefix("ko") == true ? korean : english
}

@MainActor
final class Bridge: NSObject, NSApplicationDelegate {
    let store = EKEventStore()
    var request: Object = [:]
    var responseURL: URL!
    var dataRoot: URL!
    var writeMayHaveHappened = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        Task { await run() }
    }
    func run() async {
        do {
            guard CommandLine.arguments.count == 2 else {
                throw BridgeError(
                    code: "invalid_request", message: "Crew Calendar에서 연결을 시작하세요.")
            }
            let appRoot = Bundle.main.bundleURL.deletingLastPathComponent()
                .deletingLastPathComponent().resolvingSymlinksInPath()
            dataRoot = appRoot.appendingPathComponent("data")
            let url = URL(fileURLWithPath: CommandLine.arguments[1])
                .resolvingSymlinksInPath()
            let requests = dataRoot.appendingPathComponent("native-requests").path + "/"
            guard url.path.hasPrefix(requests), url.lastPathComponent == "request.json",
                url.deletingLastPathComponent().lastPathComponent.range(
                    of: "^[0-9a-f]{32}$", options: .regularExpression) != nil
            else {
                throw BridgeError(
                    code: "invalid_request", message: "앱 내부의 연결 요청만 처리할 수 있습니다.")
            }
            responseURL = url.deletingLastPathComponent().appendingPathComponent(
                "response.json")
            request = try read(url)
            let action = try string(request, "action")
            let result: Object
            switch action {
            case "status": result = status()
            case "authorize":
                NSApp.activate(ignoringOtherApps: true)
                if EKEventStore.authorizationStatus(for: .event) == .notDetermined
                    || EKEventStore.authorizationStatus(for: .event) == .writeOnly
                {
                    _ = try await store.requestFullAccessToEvents()
                }
                result = status()
            case "calendars":
                try requireAccess()
                result = ["calendars": store.calendars(for: .event).map(calendarView)]
            case "events": result = try events()
            case "create": result = try create()
            case "reconcile": result = try reconcile()
            default:
                throw BridgeError(code: "invalid_action", message: "지원하지 않는 연결 작업입니다.")
            }
            finish(result)
        } catch let error as BridgeError {
            finishFailure(code: error.code, message: error.message)
        } catch {
            // Never put event contents, paths or OS diagnostic secrets in API responses.
            finishFailure(code: "provider_error", message: "캘린더 연결 작업을 완료하지 못했습니다.")
        }
    }
    func finishFailure(code: String, message: String) {
        var result: Object = ["error": ["code": code, "message": message]]
        // Delivery outcomes carry their state even when they include diagnostics.
        if request["action"] as? String == "create" {
            result["state"] = writeMayHaveHappened ? "unknown" : "failed"
        } else if request["action"] as? String == "reconcile" {
            result["state"] = "unknown"
        }
        finish(result)
    }
    func finish(_ value: Object) {
        if let url = responseURL { try? atomic(value, at: url) }
        NSApp.terminate(nil)
    }
    func status() -> Object {
        let value: String
        switch EKEventStore.authorizationStatus(for: .event) {
        case .notDetermined: value = "notDetermined"
        case .restricted: value = "restricted"
        case .denied: value = "denied"
        case .fullAccess: value = "fullAccess"
        case .writeOnly: value = "writeOnly"
        @unknown default: value = "unknown"
        }
        return ["authorization": value, "host": "이 Mac", "helperVersion": "0.1.0"]
    }
    func requireAccess() throws {
        guard EKEventStore.authorizationStatus(for: .event) == .fullAccess else {
            throw BridgeError(
                code: "authorization_required",
                message: "macOS 설정에서 Crew Calendar 연결의 캘린더 전체 접근을 허용하세요.")
        }
    }
    func calendarColor(_ c: EKCalendar) -> String {
        guard let color = NSColor(cgColor: c.cgColor)?.usingColorSpace(.sRGB) else {
            return ""
        }
        return String(
            format: "#%02X%02X%02X", Int((color.redComponent * 255).rounded()),
            Int((color.greenComponent * 255).rounded()),
            Int((color.blueComponent * 255).rounded()))
    }
    func calendarView(_ c: EKCalendar) -> Object {
        [
            "id": c.calendarIdentifier, "title": c.title,
            "sourceId": c.source.sourceIdentifier,
            "sourceTitle": c.source.title, "writable": c.allowsContentModifications,
            "color": calendarColor(c),
        ]
    }
    func dayString(_ d: Date, _ zone: TimeZone) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = zone
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }
    func eventView(_ e: EKEvent) -> Object {
        let zone = e.timeZone ?? .current
        return [
            "eventId": e.eventIdentifier ?? e.calendarItemIdentifier,
            "calendarId": e.calendar.calendarIdentifier,
            "title": e.title ?? "(제목 없음)", "start": iso(e.startDate),
            "end": iso(e.endDate),
            "allDay": e.isAllDay, "startDate": dayString(e.startDate, zone),
            "endDate": dayString(e.endDate, zone),
            "timezone": zone.identifier, "calendarColor": calendarColor(e.calendar),
            "calendarTitle": e.calendar.title, "sourceTitle": e.calendar.source.title,
            "notes": e.notes ?? "", "lastModified": e.lastModifiedDate.map(iso) ?? "",
            "recurring": e.hasRecurrenceRules,
            "writable": e.calendar.allowsContentModifications,
        ]
    }
    func events() throws -> Object {
        try requireAccess()
        let first = try date(string(request, "start"))
        let last = try date(string(request, "end"))
        guard first < last, last.timeIntervalSince(first) <= 370 * 86400,
            let ids = request["calendarIds"] as? [String], ids.count <= 30
        else {
            throw BridgeError(code: "invalid_range", message: "조회 범위를 확인하세요.")
        }
        let eventLimit = 5000
        var rows: [Object] = []
        var errors: [Object] = []
        var seen = Set<String>()
        for id in ids {
            guard let c = store.calendar(withIdentifier: id) else {
                errors.append([
                    "calendarId": id, "code": "calendar_missing",
                    "message": "캘린더에 접근할 수 없습니다. 선택을 다시 확인하세요.",
                ])
                continue
            }
            var cursor = first
            while cursor < last {
                let end = min(cursor.addingTimeInterval(31 * 86400), last)
                for event in store.events(
                    matching: store.predicateForEvents(
                        withStart: cursor, end: end, calendars: [c]))
                {
                    let key =
                        "\(id)|\(event.eventIdentifier ?? event.calendarItemIdentifier)|\(event.startDate.timeIntervalSince1970)"
                    if seen.insert(key).inserted { rows.append(eventView(event)) }
                    if rows.count >= eventLimit {
                        return [
                            "events": rows,
                            "errors": errors + [
                                [
                                    "calendarId": id, "code": "events_truncated",
                                    "limit": eventLimit,
                                    "message": "일정이 많아 5,000개까지만 표시합니다. 조회 기간을 줄이세요.",
                                ]
                            ], "truncated": true,
                        ]
                    }
                }
                cursor = end
            }
        }
        return ["events": rows, "errors": errors, "truncated": false]
    }
    func operation() throws -> SaveOperation {
        try requireAccess()
        guard let op = request["operation"] as? Object,
            let payload = op["payload"] as? Object,
            let target = op["target"] as? Object
        else { throw BridgeError(code: "invalid_request", message: "저장 내용을 읽지 못했습니다.") }
        let id = try string(op, "id")
        guard id.range(of: "^[0-9a-f]{32}$", options: .regularExpression) != nil else {
            throw BridgeError(code: "invalid_request", message: "잘못된 저장 요청입니다.")
        }
        guard
            let calendar = store.calendar(
                withIdentifier: try string(target, "calendarId"))
        else {
            throw BridgeError(code: "calendar_missing", message: "선택한 캘린더에 접근할 수 없습니다.")
        }
        let first = try date(string(payload, "start"))
        let last = try date(string(payload, "end"))
        let title = try string(payload, "title")
        guard first < last, last.timeIntervalSince(first) <= 7 * 86400,
            let timeZone = TimeZone(identifier: try string(payload, "timezone")),
            title.count <= maximumTitleLength
        else {
            throw BridgeError(code: "invalid_request", message: "제목·시간·시간대를 확인하세요.")
        }
        let journal = dataRoot.appendingPathComponent("native-ledger")
        try FileManager.default.createDirectory(
            at: journal, withIntermediateDirectories: true,
            attributes: [.posixPermissions: 0o700])
        return SaveOperation(
            id: id, title: title, notes: payload["notes"] as? String ?? "",
            timeZone: timeZone, calendar: calendar, start: first, end: last,
            journalURL: journal.appendingPathComponent(id + ".json"))
    }
    func matches(_ event: EKEvent, _ op: SaveOperation) -> Bool {
        event.calendar.calendarIdentifier == op.calendar.calendarIdentifier
            && event.title == op.title
            && floor(event.startDate.timeIntervalSince1970)
                == op.start.timeIntervalSince1970
            && floor(event.endDate.timeIntervalSince1970)
                == op.end.timeIntervalSince1970
            && !event.isAllDay && !event.hasRecurrenceRules
            && (event.notes ?? "") == op.notes
    }
    func readBack(_ op: SaveOperation, _ journal: Object?) -> Object {
        // Both exact marker and exact contents are required. Similar titles/times are not evidence.
        let candidates = store.events(
            matching: store.predicateForEvents(
                withStart: op.start.addingTimeInterval(-86400),
                end: op.end.addingTimeInterval(86400), calendars: [op.calendar])
        ).filter { $0.url == op.marker }
        if candidates.count == 1, let found = candidates.first, matches(found, op) {
            return ["state": "confirmed", "event": eventView(found)]
        }
        if let eventId = (journal?["event"] as? Object)?["eventId"] as? String,
            let found = store.event(withIdentifier: eventId), found.url == op.marker
        {
            return [
                "state": "unknown",
                "error": [
                    "code": "event_changed",
                    "message": "저장된 일정이 변경되었습니다. Apple Calendar에서 확인하세요.",
                ],
            ]
        }
        return [
            "state": "unknown",
            "error": [
                "code": "outcome_unknown",
                "message":
                    "정확히 일치하는 저장 결과를 확인하지 못했습니다. 다시 생성하지 않고 Apple Calendar에서 확인하세요.",
            ],
        ]
    }
    func reconcile() throws -> Object {
        let op = try operation()
        let journal = try? read(op.journalURL)
        if let journal, let state = journal["state"] as? String,
            ["cancelled", "failed"].contains(state)
        {
            return journal
        }
        let result = readBack(op, journal)
        if result["state"] as? String == "confirmed" {
            try atomic(result, at: op.journalURL)
        }
        return result
    }
    func requireActive() throws {
        let metadata = dataRoot.deletingLastPathComponent().appendingPathComponent(
            "installed.json")
        guard let installed = try? read(metadata), installed["enabled"] as? Bool == true
        else {
            throw BridgeError(
                code: "app_disabled",
                message: "Crew Calendar가 비활성화되었거나 제거되어 저장하지 않았습니다.")
        }
    }
    func create() throws -> Object {
        try requireActive()
        var op = try operation()
        let path = op.journalURL
        guard op.calendar.allowsContentModifications else {
            throw BridgeError(code: "read_only", message: "이 캘린더는 읽기 전용입니다.")
        }
        let fd = Darwin.open(path.path + ".lock", O_CREAT | O_RDWR, 0o600)
        guard fd >= 0 else {
            throw BridgeError(
                code: "storage_unavailable", message: "저장 기록을 준비하지 못했습니다.")
        }
        defer {
            flock(fd, LOCK_UN)
            Darwin.close(fd)
        }
        guard flock(fd, LOCK_EX | LOCK_NB) == 0 else {
            return ["state": "awaiting_confirmation"]
        }
        if FileManager.default.fileExists(atPath: path.path) {
            writeMayHaveHappened = true
            let journal = try read(path)
            if let state = journal["state"] as? String,
                ["cancelled", "failed"].contains(state)
            {
                return journal
            }
            return readBack(op, journal)
        }
        try atomic(["state": "awaiting_confirmation"], at: path)
        let alert = NSAlert()
        alert.messageText = nativeText(
            "Save this event to Apple Calendar?", "이 일정을 Apple Calendar에 저장할까요?")
        let f = DateFormatter()
        f.locale = .current
        f.dateStyle = .full
        f.timeStyle = .short
        f.timeZone = op.timeZone
        let destination = nativeText("Calendar", "저장 위치")
        let scope = nativeText(
            "Creates one event. No attendees or recurrence will be added.",
            "단일 일정만 생성합니다. 참석자 초대와 반복은 추가하지 않습니다.")
        alert.informativeText =
            "\(op.title)\n\n\(f.string(from: op.start))\n~ \(f.string(from: op.end))\n\(op.timeZone.identifier)\n\n\(destination): \(op.calendar.source.title) · \(op.calendar.title)\n\n\(op.notes)\n\n\(scope)"
        alert.addButton(withTitle: nativeText("Save to this calendar", "이 캘린더에 저장"))
        alert.addButton(withTitle: nativeText("Cancel", "취소"))
        // Return is deliberately not a save shortcut; confirmation must be deliberate.
        alert.buttons[0].keyEquivalent = ""
        alert.buttons[1].keyEquivalent = "\u{1b}"
        NSApp.activate(ignoringOtherApps: true)
        let timer = Timer(timeInterval: confirmationTimeout, repeats: false) { _ in
            NSApp.abortModal()
        }
        RunLoop.main.add(timer, forMode: .modalPanel)
        let answer = alert.runModal()
        timer.invalidate()
        guard answer == .alertFirstButtonReturn else {
            let result: Object = ["state": "cancelled"]
            try atomic(result, at: path)
            return result
        }
        try requireAccess()
        try requireActive()
        guard
            let current = store.calendar(
                withIdentifier: op.calendar.calendarIdentifier),
            current.allowsContentModifications
        else {
            let result: Object = [
                "state": "failed",
                "error": ["code": "read_only", "message": "캘린더 권한이 변경되어 저장하지 않았습니다."],
            ]
            try atomic(result, at: path)
            return result
        }
        // Journal is committed BEFORE EventKit. An uncertain save is never replayed.
        try atomic(["state": "writing"], at: path)
        let event = EKEvent(eventStore: store)
        event.calendar = current
        event.title = op.title
        event.startDate = op.start
        event.endDate = op.end
        event.timeZone = op.timeZone
        event.notes = op.notes
        event.url = op.marker
        writeMayHaveHappened = true
        do { try store.save(event, span: .thisEvent, commit: true) } catch {
            let result: Object = [
                "state": "unknown",
                "error": [
                    "code": "outcome_unknown",
                    "message": "저장 결과를 확인해야 합니다. 다시 생성하지 마세요.",
                ],
            ]
            try? atomic(result, at: path)
            return result
        }
        let receipt: Object = ["state": "written", "event": eventView(event)]
        try atomic(receipt, at: path)
        store.reset()
        guard let fresh = store.calendar(withIdentifier: current.calendarIdentifier)
        else { return ["state": "unknown"] }
        op.calendar = fresh
        let result = readBack(op, receipt)
        try atomic(result, at: path)
        return result
    }
}
@main
struct Main {
    @MainActor static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)
        let delegate = Bridge()
        app.delegate = delegate
        withExtendedLifetime(delegate) { app.run() }
    }
}
