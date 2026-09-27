import * as HostIcons from "lucide-react";

// The installed host exposes a limited named-export set and its full icon map
// through a default proxy. Namespace access works with that shim and npm types.
const iconMap =
  (HostIcons as unknown as { default?: typeof HostIcons }).default ?? HostIcons;
export const {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  X,
  Clock3,
  Diamond,
  Activity,
  Check,
  AlertCircle,
  ArrowUpRight,
  FlaskConical,
  RotateCcw,
  FileText,
  Globe2,
  Sparkles,
  MessageSquare,
  Pause,
  Play,
  Plug,
  ArrowLeft,
} = iconMap;
