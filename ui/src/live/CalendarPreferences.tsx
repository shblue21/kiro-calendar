import { SettingsSection } from "../settings/SettingsLayout";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { useState } from "react";
import { t } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { renderNotice } from "../i18n/notice.ts";
import { DestinationSelect } from "./DestinationSelect";
import { errorNotice } from "./api";
import type { Connection, CalendarPreferences as Preferences } from "./types";
export function CalendarPreferences({
  value,
  connections,
  onRefresh,
}: {
  value: Preferences;
  connections: Connection[];
  onRefresh: () => Promise<void>;
}) {
  const api = useAppApi(),
    { name } = useAppInfo(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Notice | null>(null);
  async function update(change: Partial<Preferences>) {
    setBusy(true);
    setError(null);
    try {
      await api.put(`/api/apps/${name}/calendar/preferences`, change);
      await onRefresh();
    } catch (e) {
      setError(errorNotice(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SettingsSection
      title={t("common.defaultCalendar")}
      description={t("settings.localStorageDescription")}
    >
      <DestinationSelect
        label={t("common.defaultSaveCalendar")}
        disabled={busy}
        connections={connections}
        value={value.defaultDestination}
        onChange={(target) => void update({ defaultDestination: target })}
      />
      <label className="cc-checkbox">
        <input
          type="checkbox"
          disabled={busy}
          checked={value.showCrew}
          onChange={(e) => void update({ showCrew: e.target.checked })}
        />
        {t("common.showCrewCalendar")}
      </label>
      {error && <p role="alert">{renderNotice(error)}</p>}
    </SettingsSection>
  );
}
