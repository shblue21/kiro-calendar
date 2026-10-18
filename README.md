# Crew Calendar

A calendar for [Kiro Crew](https://github.com/kirodotdev/KiroCrew), with local events and optional scheduling suggestions in chat.

Create an event yourself, agree on a time during a conversation, or keep a draft to review later. Crew Calendar works without an external account. On macOS, you can also view Apple Calendar events and save new ones after confirming them on your Mac.

[See it in action](#see-it-in-action) · [Install from source](#install-from-source)

## See it in action

Ask for help getting started, accept a suggested time, and open the event in Calendar.

![A real conversation suggests rehearsal time, the user agrees, and the saved event appears in Crew Calendar](assets/readme/conversation-demo.gif)

Recorded in Kiro Crew with a demo conversation and a test event. The replies and registration are real; waiting time is shortened.

- Browse events in day, week, month, year or list views.
- Edit Crew events and recover deleted ones.
- Enable suggestions for selected conversations. Suggestions stay in chat until you agree to save them.
- Choose your default save calendar separately from the calendars you display.

This is a preview release. Installed-app testing has covered Apple Silicon macOS. Windows and Linux are declared targets but have not been verified on devices.

## Install from source

You need Kiro Crew and Node.js 22.18 or later. See [`app.json`](app.json) for the declared minimum Crew version. On macOS, building the Apple Calendar helper also requires macOS 14 or later and the Swift compiler.

Run these commands from the repository root:

```sh
npm ci --ignore-scripts
npm --prefix ui ci --ignore-scripts
npm run package
kirocrew app install "$PWD/.build/crew-calendar"
```

In Crew, open **Settings > Security > Trusted apps** and allow `crew-calendar` to run. Then enable it:

```sh
kirocrew app enable crew-calendar
```

Open **Calendar** in the sidebar. Its route is `/apps/crew-calendar`.

Always install `.build/crew-calendar`, not the repository root. The package contains the runtime files; the installer does not filter files using `.gitignore`. If installation succeeds but activation reports `app_execution_denied`, check the app-specific trust setting.

For an existing installation, use Crew's app update action with `.build/crew-calendar` as the source. Updates that add API permissions may require disabling and re-enabling Calendar.

The macOS helper is built for the build machine's architecture and uses a local ad-hoc signature. Public distribution still needs signing, notarization and target-architecture validation. Rebuilding the helper may cause macOS to request calendar access again.

## Create your first event

![Crew Calendar week view with sample events and a saved draft](assets/readme/calendar-week.png)

Week view with sample events.

1. Choose **Add event**.
2. Enter a title, start time and end time.
3. Leave **Save to calendar** set to **Crew Calendar**, then choose **Save**.

Select the event to edit its details or delete it. Deletion can be undone immediately with **Undo**, or later through **History > Deleted events > Restore**.

Use the date picker to jump to a date. Clicking an empty time slot opens an editor with that time filled in. Search and display filters apply to the current view.

Times use the system time zone of the machine running Crew. During daylight-saving transitions, repeated times require an explicit UTC offset, and nonexistent times cannot be saved. If the system time zone changes while you are editing, review the updated times before saving.

Crew events remain in this Crew installation after you close the app. They do not sync between Crew installations, and the app does not send reminders.

## Schedule from a conversation

You can explicitly ask Crew to register an event in a regular conversation while Calendar is enabled. Automatic suggestions are optional and need separate setup.

### Enable suggestions

1. Open **Calendar settings > Event suggestions in conversations**.
2. If setup is required, expand **Connect suggestions**. In Crew's agent features, add the displayed command as a `UserPromptSubmit` hook. Name it `Crew Calendar · schedule suggestions`, leave the condition empty, enable it and set a five-second timeout.
3. Return to Calendar and choose **Refresh settings**.
4. Expand **Enabled conversations**, select a conversation and choose **Add**. Turn suggestions on.

Suggestions apply from the next message in selected regular conversations and may use additional tokens. Private, temporary and subagent conversations are excluded. You can turn suggestions off without disabling explicit registration requests.

Crew should show the title, exact date, start/end times and destination before asking you to agree. You can accept, change the time or decline. A clear registration request does not need another confirmation. Ignoring or declining a suggestion does not save an event.

Chat registration saves to **Crew Calendar**. Use Calendar's editor to change a registered event or save to Apple Calendar.

### Keep a draft

Ask Crew to keep an event as a draft for later review. Open **Saved drafts > Review and edit**, then choose:

- **Save draft changes** to keep editing later.
- **Save as event** to accept it into Crew Calendar.

Accepting a draft preserves its identity and link to the original conversation. Automatic suggestions do not create saved drafts.

## Connect Apple Calendar

The connection uses the Mac running Crew, including when you access Crew remotely from another device.

1. Open **Calendar settings > External calendar connections > Connect calendar**.
2. Review the macOS request for full calendar access. This access is required to read existing events.
3. Select the calendars you want to display. Set a default save destination separately if needed.
4. Add an event or open a saved draft, then choose a writable calendar under **Save to calendar**.
5. Choose **Confirm on Mac**. Review the contents and destination in the native window, then choose **Save to this calendar**.

A confirmed save means EventKit returned a matching event. It does not confirm synchronization to iCloud or another device. Existing external events must be edited or deleted in their original calendar.

Closing the web panel leaves the Mac confirmation window open. Cancel in that window to stop the save; an unanswered confirmation expires after two minutes. While a save is pending or its outcome is uncertain, editing and duplicate submission are locked. Use the status actions in **History > Save status** to check the existing request.

The app reads selected calendars and checks that a destination is writable before saving. It never substitutes another destination automatically. Queries are limited to 370 days and 5,000 returned events, with a notice when results are incomplete.

## Supported behavior

| Action                         | Crew Calendar                            | Apple Calendar connection        |
| ------------------------------ | ---------------------------------------- | -------------------------------- |
| Create a timed event           | Save directly in the app or through chat | Confirm each save on the Mac     |
| Edit or delete an event        | Supported                                | Use the original calendar        |
| Recover a deleted event        | Use Undo or the deleted-events list      | Use the original calendar        |
| Browse calendar and list views | Supported                                | Supported for selected calendars |

The Apple connection can display existing all-day, multi-day and recurring events. The app does not create recurring events or all-day events, invite attendees, send reminders, move events between calendars or schedule Crew tasks. Apple Calendar is the only external connection currently implemented. Provider-managed synchronization is outside this app's control.

## Troubleshooting

| What you see                       | What to check                                                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An event is missing                | Check the date range, search, display filters and selected calendars. Use **Refresh events** if the view was already open when another window saved it.  |
| Suggestions cannot be enabled      | Register the hook, select at least one eligible conversation and choose **Refresh settings**. Follow any setup or execution notice shown there.          |
| Calendar access is denied          | Open **System Settings > Privacy & Security > Calendars** on the Mac running Crew.                                                                       |
| The save result is uncertain       | Open **History > Save status** and use **Check current save status** or **Verify save result**. Check the existing request before starting another save. |
| An external event cannot be edited | Open it in its original calendar. The connection supports reading and creating events, not editing existing external events.                             |
| Settings could not be confirmed    | Choose **Refresh settings** before retrying. A lost response does not establish whether the change was saved.                                            |

## Data and permissions

Saved events and drafts live in the app's `data/calendar/entries/` directory. Display choices and default destinations are in `data/calendar/`; suggestion settings are in `data/settings.json`. Calendar writes use a shared process lock. Unreadable event files are preserved and reported without preventing readable events from loading.

App trust allows Calendar's Python code to run with Crew's authority. The manifest's `permissions.network: false` is not an OS-level network sandbox. macOS calendar access and per-event native confirmation are separate from app trust. External save URLs contain a `crew-calendar://operation/...` identifier for result verification, without conversation text or credentials.

Before uninstalling, remove or disable the manually registered suggestion hook and cancel any open Mac confirmation window. Crew's default uninstall preserves app data. Uninstalling Calendar does not delete events already saved to Apple Calendar or revoke macOS calendar access. Reinstallation requires app trust again.

## Development

The UI uses React and TypeScript; the backend uses Python. The macOS helper uses Swift and EventKit. Local Python tests need `aiohttp`; run them with Crew's bundled Python as well so API tests are not skipped.

```sh
npm test
npm run build
```

On macOS, also check UTC behavior and formatting. The formatting command requires Ruff and `swift-format` in addition to the installed Prettier dependency.

```sh
TZ=UTC npm test
npm run format:check
```

Tests cover date boundaries, DST, overlap layout, localization, packaging, event lifecycle rules, concurrent requests, uncertain saves and API access. Use the installed app to check chat registration and native EventKit writes. For UI changes, check narrow containers, scrolling, keyboard focus and host themes.

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

- The API and UI share event action policy. Mutations check revisions; accepting a draft updates the existing record.
- A registration request ID is reused for retries. The same ID and contents return the existing item; a new ID represents a new operation. A replay cannot overwrite later edits or restore a deleted event.
- Failures before a provider write are distinct from unknown outcomes after dispatch. Uncertain saves are verified before another submission is allowed. An external failure never silently becomes a Crew event.
- Host SDK components own common controls and theme styling. Shared layout components own spacing; individual pages should not override their internals.
- Write project documentation in English. Update UI copy in [`en.ts`](ui/src/i18n/en.ts) first, then keep [`ko.ts`](ui/src/i18n/ko.ts) aligned. Preserve user input when the language or time zone changes.
