import { ControlCell } from "../layout/Controls";
import { NativeSelect } from "../platform/kiro/NativeControls";
import { DateJump } from "./DateJump";
import type { CivilDate } from "./dates";
import { Btn, SegmentedControl } from "@kirocrew/app-sdk/ui";
import { useEffect, useId, useRef, useState } from "react";
import { t } from "../i18n/index.ts";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "../platform/kiro/icons";
import type { CalendarLayout, CalendarView } from "./types";
type Props = {
  range: string;
  date: CivilDate;
  onDate: (date: CivilDate) => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  showEvents: boolean;
  view: CalendarView;
  layout: CalendarLayout;
  onLayout: (layout: CalendarLayout) => void;
  narrow: boolean;
  onView: (view: CalendarView) => void;
  onToggle: () => void;
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
  showEvents,
  view,
  layout,
  onLayout,
  narrow,
  onView,
  onToggle,
  searchOpen,
  onSearch,
}: Props) {
  const layoutId = useId();
  const period =
    view === "day"
      ? t("common.day")
      : view === "month"
        ? t("common.periodMonth")
        : view === "year"
          ? t("common.periodYear")
          : t("common.week");
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
    <div className="cc-toolbar">
      <div className="cc-date-nav">
        <ControlCell>
          <Btn aria-label={t("common.previous", { period })} onClick={onPrevious}>
            <ChevronLeft size={16} />
          </Btn>
        </ControlCell>
        <ControlCell>
          <Btn aria-label={t("common.next", { period })} onClick={onNext}>
            <ChevronRight size={16} />
          </Btn>
        </ControlCell>
        <ControlCell>
          <Btn onClick={onReset}>{t("common.today")}</Btn>
        </ControlCell>
        <DateJump date={date} label={range} onChange={onDate} />
      </div>
      <div className="cc-toolbar-actions">
        <ControlCell>
          <Btn
            aria-label={t("common.searchEvents")}
            aria-expanded={searchOpen}
            onClick={onSearch}
          >
            <Search size={15} />
          </Btn>
        </ControlCell>
        <ControlCell>
          <NativeSelect
            style={{ width: "auto" }}
            aria-label={t("common.displayPeriod")}
            value={view}
            onChange={(e) => onView(e.target.value as CalendarView)}
          >
            <option value="day">{t("common.viewDay")}</option>
            <option value="week">{t("common.viewWeek")}</option>
            <option value="month">{t("common.viewMonth")}</option>
            <option value="year">{t("common.viewYear")}</option>
          </NativeSelect>
        </ControlCell>
        <ControlCell>
          <SegmentedControl<CalendarLayout>
            ariaLabel={t("common.displayLayout")}
            layoutId={layoutId}
            collapse={false}
            value={layout}
            onChange={onLayout}
            segments={[
              {
                key: "calendar",
                label: t("common.calendarGrid"),
                disabled: narrow && view === "week",
              },
              { key: "list", label: t("common.list") },
            ]}
          />
        </ControlCell>
        <div className="cc-display-menu" ref={menu}>
          <ControlCell>
            <Btn
              aria-expanded={open}
              aria-controls="cc-display-options"
              onClick={() => setOpen((value) => !value)}
            >
              <SlidersHorizontal size={14} />
              {t("common.show")}
              <ChevronDown size={13} />
            </Btn>
          </ControlCell>
          {open && (
            <div id="cc-display-options" className="cc-display-popover">
              <h3>{t("common.itemsToDisplay")}</h3>
              <label>
                <input type="checkbox" checked={showEvents} onChange={onToggle} />
                <CalendarDays size={14} />
                {t("common.eventsAndDrafts")}
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
