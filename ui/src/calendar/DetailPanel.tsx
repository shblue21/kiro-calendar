import { useEffect, useRef, useState } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import {
  X,
  Sparkles,
  CalendarDays,
  Clock3,
  Activity,
  ChevronRight,
  FileText,
  FlaskConical,
  ArrowUpRight,
} from "../platform/kiro/icons";
import type { CalendarViewItem, CalendarReferenceTime } from "./types";
import { DAYS } from "./dates";
import { KIND_LABEL, STATUS_LABEL, timeLabel } from "./format";
import { spanEnd } from "./layout";
import { TypeMark } from "./TypeMark";

type Props = {
  item: CalendarViewItem;
  items: readonly CalendarViewItem[];
  dates: Date[];
  referenceTime: CalendarReferenceTime;
  timeZone: string;
  onClose: () => void;
  onOpenEvent: (id: string) => void;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
};

export function DetailPanel({
  item,
  items,
  dates,
  referenceTime,
  timeZone,
  onClose,
  onOpenEvent,
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
    <aside className="cc-detail" aria-label="선택한 일정 상세">
      <div className="cc-detail-top">
        <span className={`cc-kind-label cc-${item.kind}`}>
          <TypeMark item={item} />
          {KIND_LABEL[item.kind]}
        </span>
        <Btn aria-label="상세 닫기" onClick={onClose}>
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
      <p className="cc-description">{item.description}</p>
      <dl>
        <dt>
          <CalendarDays size={14} />
          날짜
        </dt>
        <dd>
          {dates[item.day].getMonth() + 1}월 {dates[item.day].getDate()}일 (
          {DAYS[item.day]})
        </dd>
        <dt>
          <Clock3 size={14} />
          {item.kind === "trigger" ? "예약 시각" : "시간"}
        </dt>
        <dd>{timeLabel(item)}</dd>
        <dt>{item.kind === "event" ? "캘린더" : "담당 에이전트"}</dt>
        <dd>{item.source}</dd>
        <dt>시간대</dt>
        <dd>{timeZone}</dd>
        {item.kind === "event" && (
          <>
            <dt>편집</dt>
            <dd>읽기 전용</dd>
          </>
        )}
        {item.kind === "trigger" && (
          <>
            <dt>반복</dt>
            <dd>{item.flexible ? "평일 · 유연한 시작" : "일회성 예약"}</dd>
          </>
        )}
        {item.kind === "run" && (
          <>
            <dt>실행 시간</dt>
            <dd>
              {spanEnd(item, referenceTime.minute) - item.start}분
              {item.status === "running" ? " 경과 · 예시" : ""}
            </dd>
          </>
        )}
      </dl>
      {item.kind === "event" && (
        <div className="cc-related">
          <Btn primary onClick={() => onOpenEvent(item.id)}>
            <Sparkles size={14} />
            연결된 작업·대화 보기
          </Btn>
        </div>
      )}
      {relatedItem && (
        <div className="cc-related">
          <h3>
            {relatedItem.kind === "event"
              ? "연결된 일정"
              : item.kind === "trigger"
                ? "연결된 실행"
                : "원래 예약"}
          </h3>
          <Btn
            className="cc-related-link"
            onClick={(e) => onSelect(relatedItem, e.currentTarget)}
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
          <h3>결과물</h3>
          <Btn
            onClick={() => setResultOpen((x) => !x)}
            aria-expanded={resultOpen}
          >
            <FileText size={15} />
            {item.artifact}
            <ChevronRight size={14} />
          </Btn>
          {resultOpen && item.artifactPreview && (
            <div className="cc-result-preview">
              <Badge variant="muted">예시 문서</Badge>
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
      <div className="cc-detail-bottom">
        <span>
          <FlaskConical size={14} />
          화면 미리보기
        </span>
        <p>실제 캘린더와 세션은 아직 연결하지 않았습니다.</p>
        <Btn disabled>
          <ArrowUpRight size={14} />
          {item.kind === "event"
            ? "원본 일정 보기"
            : item.kind === "trigger"
              ? "Schedule에서 보기"
              : "세션에서 보기"}
        </Btn>
      </div>
    </aside>
  );
}
