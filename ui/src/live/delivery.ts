import type { Notice } from "../i18n/notice.ts";
import { errorNotice } from "./api.ts";
import type { CalendarItem, DeliveryResponse } from "./types.ts";
import { can } from "./types.ts";

export type DeliveryState = {
  item: CalendarItem;
  busy: boolean;
  checking: boolean;
  error: Notice | null;
};
export const deliveryState = (item: CalendarItem): DeliveryState => ({
  item,
  busy: false,
  checking: false,
  error: null,
});
type Ports = {
  read: () => Promise<CalendarItem>;
  prepare: (revision: number) => Promise<DeliveryResponse>;
  execute: (id: string) => Promise<DeliveryResponse>;
  reconcile: (id: string) => Promise<DeliveryResponse>;
};

/** One serialized session owns commands and observations. Transport failure is
 * uncertainty about the snapshot, never permission to submit another request. */
export class DeliverySession {
  state: DeliveryState;
  private ports: Ports;
  private publish: (state: DeliveryState) => void;
  constructor(
    item: CalendarItem,
    ports: Ports,
    publish: (state: DeliveryState) => void,
  ) {
    this.ports = ports;
    this.publish = publish;
    this.state = deliveryState(item);
  }
  private update(change: Partial<DeliveryState>) {
    this.state = { ...this.state, ...change };
    this.publish(this.state);
  }
  private async read() {
    const item = await this.ports.read();
    this.update({ item, checking: false });
    return item;
  }
  async run(command: () => Promise<unknown>) {
    if (this.state.busy) return;
    this.update({ busy: true, error: null });
    try {
      await command();
    } catch (error) {
      this.update({ checking: true, error: errorNotice(error) });
      // Reconcile the client snapshot even if the command's response was lost.
      try {
        await this.read();
      } catch {
        /* Keep checking: only another read is allowed. */
      }
    } finally {
      this.update({ busy: false });
    }
  }
  async refresh() {
    await this.run(async () => {
      await this.read();
    });
  }
  async save() {
    const reviewed = this.state.item.delivery;
    await this.run(async () => {
      const item = await this.read();
      if (!can(item, "submit")) return;
      const prepared = await this.ports.prepare(item.revision);
      // Publish the operation identity before its execute request can leave.
      this.update({ item: prepared.item, checking: false });
      const alreadyReviewed =
        reviewed?.state === "prepared" && reviewed.id === prepared.operation.id;
      if (
        prepared.operation.confirmation?.mode !== "provider" &&
        !alreadyReviewed
      )
        return;
      this.update({ checking: true });
      const result = await this.ports.execute(prepared.operation.id);
      this.update({ item: result.item, checking: false });
    });
  }
  async reconcile() {
    await this.run(async () => {
      const item = await this.read();
      if (
        !can(item, "reconcile") ||
        !item.delivery ||
        item.delivery.state === "unavailable"
      )
        return;
      this.update({ checking: true });
      const result = await this.ports.reconcile(item.delivery.id);
      this.update({ item: result.item, checking: false });
    });
  }
}
