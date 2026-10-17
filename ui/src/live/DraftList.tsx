import { Btn } from "@kirocrew/app-sdk/ui";
import { formatDateTime } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { renderNotice } from "../i18n/notice.ts";
import type { CalendarItem } from "./types";
import { can } from "./types";
/** Presentational list. Requests, navigation and refresh coordination stay in App. */
export function DraftList({
  drafts,
  timezone,
  error,
  onRefresh,
  onSelect,
  onDismiss,
  onOrigin,
}: {
  drafts: readonly CalendarItem[];
  timezone: string;
  error: Notice | null;
  onRefresh: () => void;
  onSelect: (draft: CalendarItem) => void;
  onDismiss: (draft: CalendarItem) => void;
  onOrigin: (key: string) => void;
}) {
  return (
    <section className="cc-page-section" aria-labelledby="cc-live-drafts">
      <div className="cc-draft-header">
        <div>
          <h3 id="cc-live-drafts">{t("common.eventDrafts")}</h3>
        </div>
        <Btn onClick={onRefresh}>{t("common.refreshDrafts")}</Btn>
      </div>
      {error && <p role="alert">{renderNotice(error)}</p>}
      {!drafts.length && (
        <div>
          <p>{t("common.noDraftsToReview")}</p>
          <p className="cc-page-section-note">{t("drafts.emptyHint")}</p>
        </div>
      )}
      {drafts.map((d) => (
        <div className="cc-draft-row" key={d.id}>
          <div>
            <strong>{d.title}</strong>
            <span>
              {formatDateTime(d.start, timezone)} ·{" "}
              {d.delivery?.state === "confirmed"
                ? t("common.saveConfirmed")
                : d.delivery?.state === "awaiting_confirmation"
                  ? t("common.awaitingSaveConfirmation")
                  : d.delivery?.state === "unknown"
                    ? t("common.saveNeedsVerification")
                    : t("common.draftForReview")}
            </span>
            {d.reason && <small>{d.reason}</small>}
          </div>
          <div className="cc-inline-actions">
            <Btn primary onClick={() => onSelect(d)}>
              {can(d, "edit") ? t("common.reviewAndEdit") : t("common.checkSaveStatus")}
            </Btn>
            {d.origin.sessionKey.startsWith("dashboard:") && (
              <Btn onClick={() => onOrigin(d.origin.sessionKey)}>
                {t("common.originalConversation")}
              </Btn>
            )}
            {can(d, "dismiss") && (
              <Btn onClick={() => onDismiss(d)}>{t("common.dismiss")}</Btn>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
