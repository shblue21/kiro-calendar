import { useState } from "react";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import type { CalendarPreferences as Preferences, Connection } from "./types";
import { DestinationSelect } from "./DestinationSelect";
import { message } from "./api";

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
    [error, setError] = useState("");
  async function update(change: Partial<Preferences>) {
    setBusy(true);
    setError("");
    try {
      await api.put(`/api/apps/${name}/calendar/preferences`, change);
      await onRefresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="cc-settings-section" aria-label="기본 캘린더">
      <h3>기본 캘린더</h3>
      <p>
        Crew Calendar는 이 Crew의 저장소에 보관됩니다. 외부 계정 연결 없이
        사용할 수 있습니다.
      </p>
      <DestinationSelect
        label="기본 저장 캘린더"
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
        Crew Calendar 표시
      </label>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
