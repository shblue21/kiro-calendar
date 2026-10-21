# User guide

[Back to README](README.md)

## Installation and updates

To install Calendar from source, follow [Install from source](README.md#install-from-source) in the README.

After installation and enabling, open **Calendar** in the sidebar. Its route is `/apps/crew-calendar`.

Always install `.build/crew-calendar`, not the repository root. The package contains the runtime files; the installer does not filter files using `.gitignore`. If installation succeeds but activation reports `app_execution_denied`, check the app-specific trust setting.

For an existing installation, use Crew's app update action with `.build/crew-calendar` as the source. Updates that add API permissions may require disabling and re-enabling Calendar.

The macOS helper is a Universal binary containing Apple Silicon (arm64) and Intel (x86_64) code for macOS 14 or later. It uses a local ad-hoc signature; Developer ID signing and notarization are not configured. Rebuilding the helper may cause macOS to request calendar access again.

## Create your first event

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

Crew should show the title, exact date, start/end times and destination before asking you to agree. You can accept, change the time or decline. When you explicitly ask Crew to register an event, Crew treats that request as confirmation to save it. Ignoring or declining a suggestion does not save an event.

Chat registration saves to **Crew Calendar**. Use Calendar's editor to change a registered event or save to Apple Calendar.

### Keep a draft

Ask Crew to keep an event as a draft for later review. Open **Saved drafts > Review and edit**, then choose:

- **Save draft changes** to keep editing later.
- **Save as event** to accept it into Crew Calendar.

Saving a draft as an event updates the existing draft and keeps its link to the original conversation. Automatic suggestions do not create saved drafts.

## Connect Apple Calendar

The connection uses the Mac running Crew, including when you access Crew remotely from another device.

1. Open **Calendar settings > External calendar connections > Connect calendar**.
2. Review the macOS request for full calendar access. This access is required to read existing events.
3. Select the calendars you want to display. Set a default save destination separately if needed.
4. Add an event or open a saved draft, then choose a writable calendar under **Save to calendar**.
5. Choose **Confirm on Mac**. Review the contents and destination in the native window, then choose **Save to this calendar**.

A confirmed save means EventKit returned a matching event. It does not confirm synchronization to iCloud or another device. Existing external events must be edited or deleted in their original calendar.

Closing the web panel leaves the Mac confirmation window open. Cancel in that window to stop the save; an unanswered confirmation expires after two minutes. While a save is pending or its outcome is uncertain, you cannot edit the event or submit it again. Use the status actions in **History > Save status** to check the existing request.

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

Saved events and drafts live in the app's `data/calendar/entries/` directory. Display choices and default destinations are in `data/calendar/`; suggestion settings are in `data/settings.json`. Writes to Crew Calendar data use a shared process lock. Unreadable event files are preserved and reported without preventing readable events from loading.

Trusting the app lets its Python code run with the permissions available to Crew. The manifest's `permissions.network: false` is not an OS-level network sandbox. macOS calendar access and per-event native confirmation are separate from app trust. External save URLs contain a `crew-calendar://operation/...` identifier for result verification, without conversation text or credentials.

Before uninstalling, remove or disable the manually registered suggestion hook and cancel any open Mac confirmation window. By default, uninstalling Calendar through Crew preserves its app data. Uninstalling Calendar does not delete events already saved to Apple Calendar or revoke macOS calendar access. Reinstallation requires app trust again.
