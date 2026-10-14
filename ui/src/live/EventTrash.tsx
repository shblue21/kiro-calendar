import { Btn } from "@kirocrew/app-sdk/ui";
import { useState } from "react";
import { t } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { renderNotice } from "../i18n/notice.ts";
import { errorNotice } from "./api";
import type { CalendarItem } from "./types";
import { can } from "./types";
export function EventTrash({
  items,
  onRestore,
}: {
  items: CalendarItem[];
  onRestore: (item: CalendarItem) => Promise<void>;
}) {
  const [busy, setBusy] = useState(""),
    [error, setError] = useState<Notice | null>(null);
  return (
    <section className="cc-page-section">
      <details>
        <summary>{t("trash.count", { count: items.length })}</summary>
        {items.map((item) => (
          <div className="cc-draft-row" key={item.id}>
            <strong>{item.title}</strong>
            <Btn
              disabled={!!busy || !can(item, "restore")}
              onClick={() => {
                setBusy(item.id);
                setError(null);
                void onRestore(item)
                  .catch((e) => setError(errorNotice(e)))
                  .finally(() => setBusy(""));
              }}
            >
              {t("common.restore")}
            </Btn>
          </div>
        ))}
        {!items.length && <p>{t("common.noDeletedEvents")}</p>}
        {error && <p role="alert">{renderNotice(error)}</p>}
      </details>
    </section>
  );
}
