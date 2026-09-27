import type { CalendarViewItem as Item } from "./types";

export function spanEnd(item: Item, referenceMinute: number) {
  return item.end ?? (item.status === "running" ? referenceMinute : item.start);
}

// Collision lanes consider readable hit areas, but never change duration marks.
export function place(items: readonly Item[], referenceMinute: number) {
  const sorted = [...items]
    .filter((i) => !i.allDay)
    .sort((a, b) => a.start - b.start);
  const result: { item: Item; lane: number; lanes: number }[] = [];
  let active: { end: number; lane: number }[] = [];
  let cluster: typeof result = [];
  let clusterEnd = -1;
  const finish = () => {
    const lanes = Math.max(1, ...cluster.map((x) => x.lane + 1));
    cluster.forEach((x) => (x.lanes = lanes));
    cluster = [];
  };
  sorted.forEach((item) => {
    if (item.start >= clusterEnd) {
      finish();
      active = [];
    }
    active = active.filter((x) => x.end > item.start);
    let lane = 0;
    while (active.some((x) => x.lane === lane)) lane++;
    const end = Math.max(spanEnd(item, referenceMinute), item.start + 42);
    active.push({ end, lane });
    clusterEnd = Math.max(clusterEnd, end);
    const entry = { item, lane, lanes: 1 };
    result.push(entry);
    cluster.push(entry);
  });
  finish();
  return result;
}
