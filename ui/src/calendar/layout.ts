import type { CalendarViewItem as Item } from "./types";

export type WeekLayoutMetrics = Readonly<{
  hourHeightPx: number;
  minimumEventHeightPx: number;
  compactEventThresholdPx: number;
  triggerLabelHeightPx: number;
  runLabelHeightPx: number;
  minimumDurationMarkPx: number;
}>;

/** Geometry belongs here. CSS consumes these dimensions and supplies decoration. */
export const WEEK_LAYOUT: WeekLayoutMetrics = Object.freeze({
  hourHeightPx: 64,
  minimumEventHeightPx: 42,
  compactEventThresholdPx: 46,
  triggerLabelHeightPx: 40,
  runLabelHeightPx: 56,
  minimumDurationMarkPx: 2,
});

// A fixed-point layout coordinate, independent of floating-point comparison noise.
// Both painting and lane allocation consume the same quantized endpoints.
const UNITS_PER_PIXEL = 64;
function minuteUnit(minute: number, metrics: WeekLayoutMetrics) {
  return Math.round(minute * metrics.hourHeightPx * UNITS_PER_PIXEL / 60);
}
function pixelUnit(px: number) { return Math.round(px * UNITS_PER_PIXEL); }
export function minuteOffset(minute: number, metrics = WEEK_LAYOUT) {
  return minuteUnit(minute, metrics) / UNITS_PER_PIXEL;
}

export function spanEnd(item: Item, referenceMinute: number) {
  return item.end ?? (item.status === "running" ? referenceMinute : item.start);
}

export function itemGeometry(item: Item, referenceMinute: number, metrics = WEEK_LAYOUT) {
  const topUnit = minuteUnit(item.start, metrics);
  const durationEndUnit = Math.max(topUnit, minuteUnit(spanEnd(item, referenceMinute), metrics));
  const durationUnits = durationEndUnit - topUnit;
  const heightUnits = item.kind === "event"
    ? Math.max(durationUnits, pixelUnit(metrics.minimumEventHeightPx))
    : pixelUnit(item.kind === "run" ? metrics.runLabelHeightPx : metrics.triggerLabelHeightPx);
  const markUnits = Math.max(durationUnits, pixelUnit(metrics.minimumDurationMarkPx));
  const occupiedEndUnit = topUnit + Math.max(heightUnits, markUnits);
  return {
    topUnit, occupiedEndUnit,
    topPx: topUnit / UNITS_PER_PIXEL,
    heightPx: heightUnits / UNITS_PER_PIXEL,
    durationHeightPx: durationUnits / UNITS_PER_PIXEL,
    durationMarkHeightPx: markUnits / UNITS_PER_PIXEL,
    occupiedHeightPx: (occupiedEndUnit - topUnit) / UNITS_PER_PIXEL,
    compact: item.kind === "event" && durationUnits < pixelUnit(metrics.compactEventThresholdPx),
  };
}

// Use the very same pixel geometry for painting and collision placement.
export function place(items: readonly Item[], referenceMinute: number, metrics = WEEK_LAYOUT) {
  const sorted = [...items]
    .filter((i) => !i.allDay)
    .sort((a, b) => a.start - b.start);
  const result: { item: Item; lane: number; lanes: number; geometry: ReturnType<typeof itemGeometry> }[] = [];
  let active: { end: number; lane: number }[] = [];
  let cluster: typeof result = [];
  let clusterEnd = -1;
  const finish = () => {
    const lanes = Math.max(1, ...cluster.map((x) => x.lane + 1));
    cluster.forEach((x) => (x.lanes = lanes));
    cluster = [];
  };
  sorted.forEach((item) => {
    const geometry = itemGeometry(item, referenceMinute, metrics);
    if (geometry.topUnit >= clusterEnd) {
      finish();
      active = [];
    }
    active = active.filter((x) => x.end > geometry.topUnit);
    let lane = 0;
    while (active.some((x) => x.lane === lane)) lane++;
    const end = geometry.occupiedEndUnit;
    active.push({ end, lane });
    clusterEnd = Math.max(clusterEnd, end);
    const entry = { item, lane, lanes: 1, geometry };
    result.push(entry);
    cluster.push(entry);
  });
  finish();
  return result;
}
