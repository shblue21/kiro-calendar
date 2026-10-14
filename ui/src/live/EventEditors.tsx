import type {EventTimes} from "../calendar/creation";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { useState } from "react";
import type { CivilDate } from "../calendar/dates.ts";
import { confirmationAction } from "../i18n/delivery";
import { t } from "../i18n/index.ts";
import { DestinationSelect, destinationKey } from "./DestinationSelect";
import { EventForm } from "./EventForm";
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
  const connection = connections.find((c) => c.id === target.connectionId);
  return target.connectionId === "crew"
    ? localLabel
    : confirmationAction(connection?.confirmation, connection?.provider);
}
export function NewEventEditor(props: Targeted & {initialTimes?:EventTimes}) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const [target, setTarget] = useState(props.defaultDestination),
    [requestId] = useState(() => crypto.randomUUID());
  return (
    <EventForm
      {...props}
      heading={t("common.addEvent")}
      label={t("common.newEvent")}
      submitLabel={saveLabel(target, props.connections, t("common.save"))}
      targetChanged={
        destinationKey(target) !== destinationKey(props.defaultDestination)
      }
      onSubmit={async (fields) => {
        const result = await api.post<{
          item: CalendarItem;
        }>(`/api/apps/${name}/calendar/items`, {
          ...fields,
          destination: target,
          requestId,
        });
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
export function ProposalEditor(
  props: Targeted & {
    item: CalendarItem;
  },
) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const base = `/api/apps/${name}/calendar`;
  const [target, setTarget] = useState(props.defaultDestination),
    [requestId] = useState(() => crypto.randomUUID());
  return (
    <EventForm
      {...props}
      heading={t("common.reviewSuggestion")}
      label={t("common.draftForReview")}
      submitLabel={saveLabel(
        target,
        props.connections,
        t("common.saveAsEvent"),
      )}
      targetChanged={
        destinationKey(target) !== destinationKey(props.defaultDestination)
      }
      secondary={{
        label: t("common.saveDraftChanges"),
        action: async (fields) => {
          const result = await api.put<{
            item: CalendarItem;
          }>(`${base}/items/${props.item.id}`, {
            ...fields,
            revision: props.item.revision,
          });
          await props.onSaved(result.item);
        },
      }}
      onSubmit={async (fields) => {
        const result = await api.post<{
          item: CalendarItem;
        }>(`${base}/items/${props.item.id}/accept`, {
          ...fields,
          revision: props.item.revision,
          destination: target,
          requestId,
        });
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
  props: Common & {
    item: CalendarItem;
    connections: Connection[];
  },
) {
  const api = useAppApi(),
    { name } = useAppInfo();
  const [target, setTarget] = useState(props.item.destination);
  const retarget = can(props.item, "retarget");
  return (
    <EventForm
      {...props}
      heading={t("common.editEventDetails")}
      label={retarget ? t("common.editExternalSaveDetails") : "Crew Calendar"}
      submitLabel={
        retarget
          ? saveLabel(target, props.connections, t("common.saveChanges"))
          : t("common.saveChanges")
      }
      targetChanged={
        destinationKey(target) !== destinationKey(props.item.destination)
      }
      onSubmit={async (fields) => {
        const result = await api.put<{
          item: CalendarItem;
        }>(`/api/apps/${name}/calendar/items/${props.item.id}`, {
          ...fields,
          revision: props.item.revision,
          ...(retarget ? { destination: target } : {}),
        });
        await props.onSaved(result.item);
      }}
    >
      {retarget ? (
        <DestinationSelect
          connections={props.connections}
          value={target}
          onChange={setTarget}
        />
      ) : null}
    </EventForm>
  );
}
