import * as HostIcons from "lucide-react";

// The installed host exposes a limited named-export set and its full icon map
// through a default proxy. Namespace access works with that shim and npm types.
const iconMap =
  (HostIcons as unknown as { default?: typeof HostIcons }).default ?? HostIcons;
export const {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  X,
} = iconMap;
