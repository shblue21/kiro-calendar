import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import {
  X,
  CalendarDays,
  Clock3,
  Activity,
  ChevronRight,
  FileText,
} from "../platform/kiro/icons";
import type { CalendarViewItem } from "./types";
import { DAYS } from "./dates";
import { KIND_LABEL, STATUS_LABEL, timeLabel } from "./format";
import { spanEnd } from "./layout";
import { TypeMark } from "./TypeMark";

type Props = {
  item: CalendarViewItem;
  items: readonly CalendarViewItem[];
  dates: Date[];
  referenceMinute: number;
  onClose: () => void;
  /** Event-only primary action area (conversation, result, prep status). */
  actions?: ReactNode;
  onEdit: () => void;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
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
    <aside className="cc-detail" aria-label="선택한 일정 상세">
      <div className="cc-detail-top">
        <span className={`cc-kind-label cc-${item.kind}`}>
          <TypeMark item={item} />
          {item.storage === "draft" ? "검토용 초안" : KIND_LABEL[item.kind]}
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
      {item.kind !== "run" && !item.storage && item.editable !== false && <Btn onClick={onEdit}>{item.storage ? "초안 검토·수정" : "편집"}</Btn>}
      <p className="cc-description">{item.description}</p>
      <dl>
        <dt>
          <CalendarDays size={14} />
          날짜
        </dt>
        <dd>
          {dates[item.day].getMonth() + 1}월 {dates[item.day].getDate()}일 (
          {DAYS[(dates[item.day].getDay() + 6) % 7]})
        </dd>
        <dt>
          <Clock3 size={14} />
          {item.kind === "trigger" ? "예약 시각" : "시간"}
        </dt>
        <dd>{timeLabel(item)}</dd>
        <dt>{item.kind === "event" ? "캘린더" : "담당 에이전트"}</dt>
        <dd>{item.source}</dd>
        {item.kind === "event" && (
          <>
            <dt>저장</dt>
            <dd>{item.storage === "local" ? "Crew Calendar에 저장됨" : item.storage === "pending" ? item.source : item.storage === "external" ? "연결된 캘린더에서 조회" : item.storage === "draft" ? "로컬 초안 · 외부 저장 전" : "외부 저장 정보 없음"}</dd>
          </>
        )}
        {item.kind === "trigger" && (
          <>
            <dt>반복</dt>
            <dd>
              {item.recurrence ??
                (item.flexible ? "평일 · 유연한 시작" : "일회성 예약")}
            </dd>
          </>
        )}
        {item.kind === "run" && (
          <>
            <dt>실행 시간</dt>
            <dd>
              {spanEnd(item, referenceMinute) - item.start}분
              {item.status === "running" ? " 경과" : ""}
            </dd>
          </>
        )}
      </dl>
      {item.kind === "event" && actions}
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
              <Badge variant="muted">결과 미리보기</Badge>
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
      <p className="cc-detail-bottom">
        {item.kind === "event"
          ? item.storage === "local" ? "Crew Calendar에서 수정하고 삭제할 수 있습니다." : item.storage === "pending" ? "외부 저장 상태를 확인하세요. Crew Calendar에는 저장되지 않았습니다." : item.storage === "external" ? "기존 일정의 수정·삭제는 원본 캘린더에서 해주세요." : item.storage === "draft" ? "검토 후 저장할 캘린더를 선택하세요." : "원본 캘린더 열기는 아직 지원하지 않습니다."
          : item.kind === "trigger"
            ? "Schedule에서 열기는 아직 지원하지 않습니다."
            : "세션 열기는 아직 지원하지 않습니다."}
      </p>
    </aside>
  );
}
