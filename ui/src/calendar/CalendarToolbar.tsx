import { DateJump } from "./DateJump";
import type { CivilDate } from "./dates";
import { Btn } from "@kirocrew/app-sdk/ui";
import { useEffect, useRef, useState } from "react";
import { t } from "../i18n/index.ts";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "../platform/kiro/icons";
import { KIND_ICON } from "./TypeMark";
import type {
  CalendarLayers,
  CalendarLayout,
  CalendarView,
  Kind,
} from "./types";
type Props = {
  range: string;
  date: CivilDate;
  onDate: (date: CivilDate) => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  layers: CalendarLayers;
  view: CalendarView;
  layout: CalendarLayout;
  onLayout: (layout: CalendarLayout) => void;
  narrow: boolean;
  onView: (view: CalendarView) => void;
  onToggle: (kind: Kind) => void;
  searchOpen: boolean;
  onSearch: () => void;
};
export function CalendarToolbar({
  range,
  date,
  onDate,
  onPrevious,
  onNext,
  onReset,
  layers,
  view,
  layout,
  onLayout,
  narrow,
  onView,
  onToggle,
  searchOpen,
  onSearch,
}: Props) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menu.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div className="cc-toolbar cc-compact-toolbar">
      <div className="cc-date-nav">
        <Btn
          aria-label={t("common.previous", {
            period:
              view === "day"
                ? t("common.day")
                : view === "month"
                  ? t("common.periodMonth")
                  : view === "year"
                    ? t("common.periodYear")
                    : t("common.week"),
          })}
          onClick={onPrevious}
        >
          <ChevronLeft size={16} />
        </Btn>
        <Btn
          aria-label={t("common.next", {
            period:
              view === "day"
                ? t("common.day")
                : view === "month"
                  ? t("common.periodMonth")
                  : view === "year"
                    ? t("common.periodYear")
                    : t("common.week"),
          })}
          onClick={onNext}
        >
          <ChevronRight size={16} />
        </Btn>
        <Btn onClick={onReset}>{t("common.today")}</Btn>
        <DateJump date={date} label={range} onChange={onDate} />
      </div>
      <div className="cc-toolbar-actions">
        <Btn
          aria-label={t("common.searchEvents")}
          aria-expanded={searchOpen}
          onClick={onSearch}
        >
          <Search size={15} />
        </Btn>
        <select
          className="cc-view-select"
          aria-label={t("common.displayPeriod")}
          value={view}
          onChange={(e) => onView(e.target.value as CalendarView)}
        >
          <option value="day">{t("common.viewDay")}</option>
          <option value="week">{t("common.viewWeek")}</option>
          <option value="month">{t("common.viewMonth")}</option>
          <option value="year">{t("common.viewYear")}</option>
        </select>
        <div
          className="cc-view-switch"
          role="group"
          aria-label={t("common.displayLayout")}
        >
          <Btn
            aria-pressed={layout === "calendar"}
            disabled={narrow && view === "week"}
            onClick={() => onLayout("calendar")}
          >
            {t("common.calendarGrid")}
          </Btn>
          <Btn
            aria-pressed={layout === "list"}
            onClick={() => onLayout("list")}
          >
            {t("common.list")}
          </Btn>
        </div>
        <div className="cc-display-menu" ref={menu}>
          <Btn
            aria-expanded={open}
            aria-controls="cc-display-options"
            onClick={() => setOpen((value) => !value)}
          >
            <SlidersHorizontal size={14} />
            {t("common.show")}
            <ChevronDown size={13} />
          </Btn>
          {open && (
            <div id="cc-display-options" className="cc-display-popover">
              <h3>{t("common.itemsToDisplay")}</h3>
              {(["event"] as Kind[]).map((kind) => {
                const Icon = KIND_ICON[kind];
                return (
                  <label key={kind}>
                    <input
                      type="checkbox"
                      checked={layers[kind]}
                      onChange={() => onToggle(kind)}
                    />
                    <Icon size={14} />
                    {t("common.eventsAndDrafts")}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
