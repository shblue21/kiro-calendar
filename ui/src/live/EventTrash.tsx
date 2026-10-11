import { useState } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import type { CalendarItem } from "./types";
import { can } from "./types";
import { message } from "./api";
export function EventTrash({
  items,
  onRestore,
}: {
  items: CalendarItem[];
  onRestore: (item: CalendarItem) => Promise<void>;
}) {
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  return (
    <section className="cc-settings-section">
      <details>
        <summary>삭제한 일정 · {items.length}개</summary>
        {items.map((item) => (
          <div className="cc-draft-row" key={item.id}>
            <strong>{item.title}</strong>
            <Btn
              disabled={!!busy || !can(item, "restore")}
              onClick={() => {
                setBusy(item.id);
                setError("");
                void onRestore(item)
                  .catch((e) => setError(message(e)))
                  .finally(() => setBusy(""));
              }}
            >
              복원
            </Btn>
          </div>
        ))}
        {!items.length && <p>삭제한 일정이 없습니다.</p>}
        {error && <p role="alert">{error}</p>}
      </details>
    </section>
  );
}
