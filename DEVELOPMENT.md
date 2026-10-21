# Development

[Back to README](README.md)

The UI uses React and TypeScript; the backend uses Python. The macOS helper uses Swift and EventKit. CI uses Node.js 22.18 and Python 3.12. From the repository root, install the UI and test dependencies, then run the checks. `aiohttp` is required for API tests.

```sh
npm ci --ignore-scripts
npm --prefix ui ci --ignore-scripts
python3 -m pip install -r .github/requirements-ci.txt
npm test
npm run build
```

`npm test` uses the `python3` on your shell's PATH. On macOS, also run the Python tests with Crew's bundled interpreter. With the desktop app's `kirocrew` launcher on PATH, these commands locate the interpreter beside that launcher and run the tests from the repository root:

```sh
crew_python="$(python3 -c 'from pathlib import Path; from shutil import which; print(Path(which("kirocrew")).resolve().with_name("python3"))')"
"$crew_python" -m unittest discover -s tests -t .
```

Tests select their time zones explicitly, independently of the host environment. On macOS, also check formatting. The formatting command requires Ruff and `swift-format` in addition to the installed Prettier dependency.

```sh
npm run format:check
```

Tests cover date boundaries, DST, overlap layout, localization, packaging, event lifecycle rules, concurrent requests, uncertain saves and API access. Use the installed app to check chat registration and native EventKit writes. For UI changes, check narrow containers, scrolling, keyboard focus and host themes.

GitHub Actions runs tests, Python lint, UI builds and packaging on Ubuntu, Apple Silicon macOS and Intel macOS. Both macOS jobs check formatting and build the Universal helper with Xcode 26.3, then verify both architectures and signatures in the package. The Apple Silicon job uploads the shared Universal package, preserving executable permissions and using a local ad-hoc signature. It is a verification artifact, not a signed public release.

## Release

Set the release version in `app.json`, push the source changes to `main`, and wait for CI to pass. In GitHub Actions, run **Release** from `main`.

The workflow requires successful CI for that exact source commit. It builds the UI and Universal macOS helper, packages the runtime files and licenses, and creates `release-v<version>` and an annotated `v<version>` tag. Both point to the deployment commit. That commit contains only the package contents and records the source commit as its parent, so a catalog install needs no npm build.

The branch and tag are pushed together. Existing release refs are never replaced; bump the version for the next release. The source branch and its checkout remain unchanged. Use the deployment tag or commit SHA in the marketplace catalog entry.

This workflow publishes Git refs. GitHub Release downloads and marketplace registration are separate steps. The helper retains its local ad-hoc signature; the workflow does not add Developer ID signing or notarization.

## Code structure

| Start here                                                             | Responsibility                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`ui/src/App.tsx`](ui/src/App.tsx)                                     | Workspace tabs, editors and app-level actions                     |
| [`ui/src/live/useCalendarData.ts`](ui/src/live/useCalendarData.ts)     | Queries and refreshes                                             |
| [`ui/src/live/responses.ts`](ui/src/live/responses.ts)                 | Runtime checks before API data enters UI state                    |
| [`ui/src/layout/`](ui/src/layout/)                                     | Shared sections, disclosures, popovers and inline errors          |
| [`ui/src/calendar/time.ts`](ui/src/calendar/time.ts)                   | Local dates, UTC offsets and elapsed time                         |
| [`backend/event_service.py`](backend/event_service.py)                 | Event creation, edits, draft acceptance, deletion and restoration |
| [`backend/entry_policy.py`](backend/entry_policy.py)                   | Actions permitted for each event and save state                   |
| [`backend/calendar_service.py`](backend/calendar_service.py)           | Provider operations and external save results                     |
| [`backend/conversation_schedule.py`](backend/conversation_schedule.py) | Chat registration and request IDs                                 |
| [`native/CrewCalendarBridge.swift`](native/CrewCalendarBridge.swift)   | macOS authorization, confirmation and EventKit access             |

Keep these contracts when changing the app:

- When changing bundled dependencies, update [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) with their versions and full license texts. The runtime package includes this file alongside the project license.
- The API and UI share event action policy. Mutations check revisions; accepting a draft updates the existing record.
- A registration request ID is reused for retries. The same ID and contents return the existing item; a new ID represents a new operation. A replay cannot overwrite later edits or restore a deleted event.
- Failures before a provider write are distinct from unknown outcomes after dispatch. Uncertain saves are verified before another submission is allowed. An external failure never silently becomes a Crew event.
- Host SDK components own common controls and theme styling. Shared layout components own spacing; individual pages should not override their internals.
- Write project documentation in English. Update UI copy in [`en.ts`](ui/src/i18n/en.ts) first, then keep [`ko.ts`](ui/src/i18n/ko.ts) aligned. Preserve user input when the language or time zone changes.
