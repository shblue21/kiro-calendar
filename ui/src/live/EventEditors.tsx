import type { CivilDate } from "../calendar/dates.ts";
import { useState } from "react";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { EventForm } from "./EventForm";
import { DestinationSelect, destinationKey } from "./DestinationSelect";
import type { CalendarItem, Connection, Destination } from "./types";
import { can } from "./types";

type Common = {
  date: CivilDate;
  timezone: string;
  refreshTimezone: () => Promise<string>;
  onClose: () => void;
  onSaved: (item: CalendarItem) => Promise<void>;
};
type Targeted = Common & {
  connections: Connection[];
  defaultDestination: Destination;
};
function saveLabel(
  target: Destination,
  connections: Connection[],
  localLabel: string,
) {
  return target.connectionId === "crew"
    ? localLabel
    : connections.find((c) => c.id === target.connectionId)?.confirmation
        ?.actionLabel || "외부 저장 확인";
}
export function NewEventEditor(props: Targeted) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const [target, setTarget] = useState(props.defaultDestination),
    [requestId] = useState(() => crypto.randomUUID());
  return (
    <EventForm
      {...props}
      heading="일정 추가"
      label="새 일정"
      submitLabel={saveLabel(target, props.connections, "저장")}
      targetChanged={
        destinationKey(target) !== destinationKey(props.defaultDestination)
      }
      onSubmit={async (fields) => {
        const result = await api.post<{ item: CalendarItem }>(
          `/api/apps/${name}/calendar/items`,
          { ...fields, destination: target, requestId },
        );
        await props.onSaved(result.item);
      }}
    >
      <DestinationSelect
        connections={props.connections}
        value={target}
        onChange={setTarget}
      />
    </EventForm>
  );
}
export function ProposalEditor(props: Targeted & { item: CalendarItem }) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const base = `/api/apps/${name}/calendar`;
  const [target, setTarget] = useState(props.defaultDestination),
    [requestId] = useState(() => crypto.randomUUID());
  return (
    <EventForm
      {...props}
      heading="제안 검토"
      label="검토용 초안"
      submitLabel={saveLabel(target, props.connections, "일정으로 저장")}
      targetChanged={
        destinationKey(target) !== destinationKey(props.defaultDestination)
      }
      secondary={{
        label: "초안 수정 저장",
        action: async (fields) => {
          const result = await api.put<{ item: CalendarItem }>(
            `${base}/items/${props.item.id}`,
            {
              ...fields,
              revision: props.item.revision,
            },
          );
          await props.onSaved(result.item);
        },
      }}
      onSubmit={async (fields) => {
        const result = await api.post<{ item: CalendarItem }>(
          `${base}/items/${props.item.id}/accept`,
          {
            ...fields,
            revision: props.item.revision,
            destination: target,
            requestId,
          },
        );
        await props.onSaved(result.item);
      }}
    >
      <DestinationSelect
        connections={props.connections}
        value={target}
        onChange={setTarget}
      />
    </EventForm>
  );
}
export function ConfirmedEventEditor(
  props: Common & { item: CalendarItem; connections: Connection[] },
) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const [target, setTarget] = useState(props.item.destination);
  const retarget = can(props.item, "retarget");
  return (
    <EventForm
      {...props}
      heading="일정 수정"
      label={retarget ? "외부 저장 내용 수정" : "Crew Calendar"}
      submitLabel={
        retarget
          ? saveLabel(target, props.connections, "변경 저장")
          : "변경 저장"
      }
      targetChanged={
        destinationKey(target) !== destinationKey(props.item.destination)
      }
      onSubmit={async (fields) => {
        const result = await api.put<{ item: CalendarItem }>(
          `/api/apps/${name}/calendar/items/${props.item.id}`,
          {
            ...fields,
            revision: props.item.revision,
            ...(retarget ? { destination: target } : {}),
          },
        );
        await props.onSaved(result.item);
      }}
    >
      {retarget ? (
        <DestinationSelect
          connections={props.connections}
          value={target}
          onChange={setTarget}
        />
      ) : (
        <p className="cc-settings-section-note">저장 위치: Crew Calendar</p>
      )}
    </EventForm>
  );
}
