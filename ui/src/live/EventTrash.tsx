import { InlineError } from "../layout/InlineError";
import { Disclosure } from "../layout/WorkspacePage";
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
    <section className="cc-section">
      <Disclosure title={t("trash.count", { count: items.length })}>
        {items.length > 0 && (
          <div>
            {items.map((item) => (
              <div className="cc-list-row" key={item.id}>
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
          </div>
        )}
        {!items.length && <p>{t("common.noDeletedEvents")}</p>}
        {error && <InlineError>{renderNotice(error)}</InlineError>}
      </Disclosure>
    </section>
  );
}
