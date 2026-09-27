import type { ReactNode } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "../platform/kiro/icons";
import { KIND_ICON } from "./TypeMark";
import { KIND_LABEL } from "./format";
import type { CalendarLayers, Kind } from "./types";

type Props = {
  dates: Date[];
  offset: number;
  timeZone: string;
  layers: CalendarLayers;
  onMove: (offset: number) => void;
  onToggle: (kind: Kind) => void;
  extra?: ReactNode;
};

export function CalendarToolbar({
  dates,
  offset,
  timeZone,
  layers,
  onMove,
  onToggle,
  extra,
}: Props) {
  const range = `${dates[0].getFullYear()}년 ${dates[0].getMonth() + 1}월 ${dates[0].getDate()}일 – ${dates[6].getMonth() + 1}월 ${dates[6].getDate()}일`;
  return (
    <>
      <div className="cc-toolbar">
        <div className="cc-date-nav">
          <Btn aria-label="이전 주" onClick={() => onMove(offset - 1)}>
            <ChevronLeft size={17} />
          </Btn>
          <Btn aria-label="다음 주" onClick={() => onMove(offset + 1)}>
            <ChevronRight size={17} />
          </Btn>
          <Btn onClick={() => onMove(0)}>예시 주</Btn>
          <h2>{range}</h2>
        </div>
        <span className="cc-timezone">
          <Globe2 size={13} />
          {timeZone}
        </span>
      </div>
      <div className="cc-filter-row">
        <div className="cc-filters" aria-label="표시할 항목">
          {(["event", "trigger", "run"] as Kind[]).map((kind) => {
            const Icon = KIND_ICON[kind];
            return (
              <Btn
                key={kind}
                className={`cc-filter cc-${kind}`}
                aria-pressed={layers[kind]}
                onClick={() => onToggle(kind)}
              >
                <Icon size={13} />
                {KIND_LABEL[kind]}
                {layers[kind] && <Check size={12} />}
              </Btn>
            );
          })}
        </div>
        {extra}
      </div>
    </>
  );
}
