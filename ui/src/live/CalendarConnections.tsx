import { NativeCheckbox } from "../platform/kiro/NativeControls";
import { InlineError } from "../layout/InlineError";
import { Section } from "../layout/WorkspacePage";
import { calendarColor } from "./location";
import { connectionName } from "../i18n/delivery.ts";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { Btn } from "@kirocrew/app-sdk/ui";
import { useState } from "react";
import { connectionNotice } from "../i18n/delivery";
import { t } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { renderNotice } from "../i18n/notice.ts";
import { errorNotice } from "./api";
import type { Connection } from "./types";
export function CalendarConnections({
  connections,
  error,
  onRefresh,
}: {
  connections: Connection[];
  error: Notice | null;
  onRefresh: () => Promise<void>;
}) {
  return (
    <Section
      title={t("common.externalCalendarConnections")}
      actions={
        <Btn onClick={() => void onRefresh()}>{t("common.refreshConnections")}</Btn>
      }
    >
      {error && <InlineError>{renderNotice(error)}</InlineError>}
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          onRefresh={onRefresh}
        />
      ))}
      {!connections.length && !error && <p>{t("connections.empty")}</p>}
    </Section>
  );
}
function ConnectionCard({
  connection: c,
  onRefresh,
}: {
  connection: Connection;
  onRefresh: () => Promise<void>;
}) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const base = `/api/apps/${name}/calendar`;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<Notice | null>(null);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onRefresh();
    } catch (e) {
      setError(errorNotice(e));
    } finally {
      setBusy(false);
    }
  }
  function select(ids: string[]) {
    void run(() =>
      api.put(`${base}/connection`, {
        connectionId: c.id,
        selectedCalendarIds: ids,
      }),
    );
  }
  const ready = c.state === "ready";
  return (
    <section className="cc-connection-group" aria-label={connectionName(c.displayName)}>
      <h4>{connectionName(c.displayName)}</h4>
      {c.state !== "ready" && (
        <p className="cc-page-section-note">{connectionNotice(c.state)}</p>
      )}
      {error && <InlineError>{renderNotice(error)}</InlineError>}
      {["needs_authorization", "denied"].includes(c.state) && (
        <Btn
          disabled={busy}
          onClick={() =>
            void run(() => api.post(`${base}/authorize`, { connectionId: c.id }))
          }
        >
          {busy ? t("common.checkThePermissionPrompt") : t("connections.authorize")}
        </Btn>
      )}
      {ready && c.capabilities.read && (
        <>
          <p className="cc-page-section-note">
            {t("common.chooseTheCalendarsToDisplay")}
          </p>
          <div className="cc-calendar-choices">
            {c.calendars.map((cal) => (
              <NativeCheckbox
                key={cal.id}
                disabled={busy}
                checked={c.selectedCalendarIds.includes(cal.id)}
                onChange={(e) =>
                  select(
                    e.target.checked
                      ? [...c.selectedCalendarIds, cal.id]
                      : c.selectedCalendarIds.filter((id) => id !== cal.id),
                  )
                }
              >
                <span>
                  <span
                    className="cc-calendar-dot"
                    aria-hidden="true"
                    style={{ background: calendarColor(cal.color) ?? "var(--accent)" }}
                  />
                  {cal.sourceTitle} · {cal.title}
                  {!cal.writable && <small>{t("common.readOnly")}</small>}
                </span>
              </NativeCheckbox>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
