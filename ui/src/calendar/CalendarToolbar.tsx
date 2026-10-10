import { useEffect, useRef, useState } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Search,
} from "../platform/kiro/icons";
import { KIND_ICON } from "./TypeMark";
import type { CalendarLayers, CalendarView, CalendarLayout, Kind } from "./types";

type Props = {
  range: string;
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
        <Btn aria-label={`이전 ${view === "month" ? "달" : view === "year" ? "해" : "주"}`} onClick={onPrevious}>
          <ChevronLeft size={16} />
        </Btn>
        <Btn aria-label={`다음 ${view === "month" ? "달" : view === "year" ? "해" : "주"}`} onClick={onNext}>
          <ChevronRight size={16} />
        </Btn>
        <Btn onClick={onReset}>오늘</Btn>
        <h2>{range}</h2>
      </div>
      <div className="cc-toolbar-actions">
        <Btn
          aria-label="일정 검색"
          aria-expanded={searchOpen}
          onClick={onSearch}
        >
          <Search size={15} />
        </Btn>
        <select className="cc-view-select" aria-label="표시 기간" value={view}
          onChange={(e) => onView(e.target.value as CalendarView)}>
          <option value="week">주간</option>
          <option value="month">월간</option>
          <option value="year">연간</option>
          
        </select>
        <div className="cc-view-switch" role="group" aria-label="표시 방식">
          <Btn aria-pressed={layout === "calendar"} disabled={narrow && view === "week"} onClick={() => onLayout("calendar")}>달력</Btn>
          <Btn aria-pressed={layout === "list"} onClick={() => onLayout("list")}>목록</Btn>
        </div>
        <div className="cc-display-menu" ref={menu}>
          <Btn
            aria-expanded={open}
            aria-controls="cc-display-options"
            onClick={() => setOpen((value) => !value)}
          >
            <SlidersHorizontal size={14} />
            표시
            <ChevronDown size={13} />
          </Btn>
          {open && (
            <div id="cc-display-options" className="cc-display-popover">
              <h3>표시할 항목</h3>
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
                    일정·초안
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
