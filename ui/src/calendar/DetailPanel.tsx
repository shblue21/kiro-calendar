import { Btn } from "@kirocrew/app-sdk/ui";
import { useEffect, useRef, type ReactNode } from "react";
import { formatDate } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import { CalendarDays, Clock3, X } from "../platform/kiro/icons";
import { calendarStyle } from "./color";
import { civilDate, type CivilDate } from "./dates.ts";
import { deliveryLabel, sourceLabel, timeLabel } from "./format";
import { EventMark } from "./EventMark";
import type { CalendarViewItem } from "./types";
type Props = { item: CalendarViewItem; onClose: () => void; actions?: ReactNode };
export function DetailPanel({ item, onClose, actions }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startDate = civilDate(item.interval.startDate);
  const endDate = civilDate(item.interval.endDate);
  const dateLabel = (date: CivilDate) =>
    formatDate(date, {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  useEffect(() => {
    headingRef.current?.focus();
  }, [item.id]);
  return (
    <aside
      style={calendarStyle(item.calendarColor)}
      className="cc-detail"
      aria-label={t("common.selectedEventDetails")}
    >
      <div className="cc-detail-top">
        <span className="cc-kind-label cc-event">
          <EventMark />
          {t(item.storage === "draft" ? "common.draftForReview" : "common.event")}
        </span>
        <Btn aria-label={t("common.closeDetails")} onClick={onClose}>
          <X size={17} />
        </Btn>
      </div>
      <h2 ref={headingRef} tabIndex={-1}>
        {item.title}
      </h2>
      {item.description && <p className="cc-description">{item.description}</p>}
      <dl>
        <dt>
          <CalendarDays size={14} />
          {t("common.date")}
        </dt>
        <dd>
          {dateLabel(startDate)}
          {!startDate.equals(endDate) && ` – ${dateLabel(endDate)}`}
        </dd>
        <dt>
          <Clock3 size={14} />
          {t("common.time")}
        </dt>
        <dd>{timeLabel({ ...item, timeLabels: item.interval.timeLabels })}</dd>
        {sourceLabel(item) && (
          <>
            <dt>{t(item.calendarLocation ? "common.calendar" : "common.source")}</dt>
            <dd>{sourceLabel(item)}</dd>
          </>
        )}
        {deliveryLabel(item.deliveryState) && (
          <>
            <dt>{t("delivery.statusLabel")}</dt>
            <dd>{deliveryLabel(item.deliveryState)}</dd>
          </>
        )}
      </dl>
      {actions}
      {item.storage === "external" && (
        <p className="cc-detail-bottom">{t("details.externalEditHint")}</p>
      )}
    </aside>
  );
}
