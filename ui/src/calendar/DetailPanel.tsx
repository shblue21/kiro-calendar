import { calendarStyle } from "./color";
import { deliveryLabel } from "./format";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  X,
} from "../platform/kiro/icons";
import type { CivilDate } from "./dates.ts";
import { KIND_LABEL, STATUS_LABEL, timeLabel } from "./format";
import { spanEnd } from "./layout";
import { TypeMark } from "./TypeMark";
import type { CalendarViewItem } from "./types";
type Props = {
  item: CalendarViewItem;
  items: readonly CalendarViewItem[];
  dates: CivilDate[];
  referenceMinute: number;
  onClose: () => void;
  /** Event-only primary action area (conversation, result, prep status). */
  actions?: ReactNode;
  onEdit: () => void;
  onSelect: (item: CalendarViewItem) => void;
};
export function DetailPanel({
  item,
  items,
  dates,
  referenceMinute,
  onClose,
  actions,
  onEdit,
  onSelect,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const relatedItem = items.find((candidate) => candidate.id === item.related);
  useEffect(() => {
    headingRef.current?.focus();
    setResultOpen(false);
  }, [item.id]);
  return (
    <aside
      style={calendarStyle(item.calendarColor)}
      className="cc-detail"
      aria-label={t("common.selectedEventDetails")}
    >
      <div className="cc-detail-top">
        <span className={`cc-kind-label cc-${item.kind}`}>
          <TypeMark item={item} />
          {item.storage === "draft"
            ? t("common.draftForReview")
            : KIND_LABEL[item.kind]}
        </span>
        <Btn aria-label={t("common.closeDetails")} onClick={onClose}>
          <X size={17} />
        </Btn>
      </div>
      <h2 ref={headingRef} tabIndex={-1}>
        {item.title}
      </h2>
      {item.status && (
        <Badge
          variant={
            item.status === "failed"
              ? "err"
              : item.status === "success"
                ? "ok"
                : item.status === "running"
                  ? "aim"
                  : "muted"
          }
        >
          {STATUS_LABEL[item.status]}
        </Badge>
      )}
      {item.kind !== "run" && !item.storage && item.editable !== false && (
        <Btn onClick={onEdit}>
          {item.storage
            ? t("common.reviewAndEditDraft")
            : t("common.editEvent")}
        </Btn>
      )}
      {item.description && <p className="cc-description">{item.description}</p>}
      <dl>
        <dt>
          <CalendarDays size={14} />
          {t("common.date")}
        </dt>
        <dd>
          {formatDate(dates[item.day], {
            month: "short",
            day: "numeric",
            weekday: "short",
          })}
        </dd>
        <dt>
          <Clock3 size={14} />
          {item.kind === "trigger"
            ? t("common.scheduledTime")
            : t("common.time")}
        </dt>
        <dd>{timeLabel(item)}</dd>
        {(item.kind !== "event" || item.calendarLocation || item.source) && (
          <>
            <dt>
              {t(
                item.kind === "event"
                  ? item.calendarLocation
                    ? "common.calendar"
                    : "common.source"
                  : "common.assignedAgent",
              )}
            </dt>
            <dd>
              {item.kind === "event"
                ? item.calendarLocation || item.source
                : item.source}
            </dd>
          </>
        )}
        {deliveryLabel(item.deliveryState) && (
          <>
            <dt>{t("delivery.statusLabel")}</dt>
            <dd>{deliveryLabel(item.deliveryState)}</dd>
          </>
        )}
        {item.kind === "trigger" && (
          <>
            <dt>{t("common.repeat")}</dt>
            <dd>
              {item.recurrence ??
                (item.flexible
                  ? t("common.weekdaysFlexibleStart")
                  : t("common.oneTimeSchedule"))}
            </dd>
          </>
        )}
        {item.kind === "run" && (
          <>
            <dt>{t("common.runDuration")}</dt>
            <dd>
              {t(
                item.status === "running"
                  ? "details.elapsed"
                  : "details.duration",
                { minutes: spanEnd(item, referenceMinute) - item.start },
              )}
            </dd>
          </>
        )}
      </dl>
      {item.kind === "event" && actions}
      {relatedItem && (
        <div className="cc-related">
          <h3>
            {relatedItem.kind === "event"
              ? t("common.linkedEvent")
              : item.kind === "trigger"
                ? t("common.linkedRun")
                : t("common.originalSchedule")}
          </h3>
          <Btn
            className="w-full justify-between"
            onClick={() => onSelect(relatedItem)}
          >
            <Activity size={15} />
            {timeLabel(relatedItem)} ·{" "}
            {relatedItem.status
              ? STATUS_LABEL[relatedItem.status]
              : relatedItem.title}
            <ChevronRight size={14} />
          </Btn>
        </div>
      )}
      {item.artifact && (
        <div className="cc-result">
          <h3>{t("common.output")}</h3>
          <Btn
            className="w-full justify-between"
            onClick={() => setResultOpen((x) => !x)}
            aria-expanded={resultOpen}
          >
            <FileText size={15} />
            {item.artifact}
            <ChevronRight size={14} />
          </Btn>
          {resultOpen && item.artifactPreview && (
            <div className="cc-result-preview">
              <Badge variant="muted">{t("common.previewOutput")}</Badge>
              <h4>{item.artifactPreview.title}</h4>
              <p>{item.artifactPreview.summary}</p>
              <ul>
                {item.artifactPreview.bullets.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!(
        item.kind === "event" &&
        ["local", "pending", "draft"].includes(item.storage ?? "")
      ) && (
        <p className="cc-detail-bottom">
          {item.kind === "event"
            ? item.storage === "external"
              ? t("details.externalEditHint")
              : t("details.externalOpenUnsupported")
            : item.kind === "trigger"
              ? t("details.scheduleOpenUnsupported")
              : t("details.sessionOpenUnsupported")}
        </p>
      )}
    </aside>
  );
}
