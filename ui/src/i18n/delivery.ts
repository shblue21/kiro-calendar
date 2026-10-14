import type { Confirmation, Connection } from "../live/types.ts";
import { t } from "./index.ts";
export function confirmationAction(
  confirmation?: Confirmation,
  provider?: string,
): string {
  if (confirmation?.mode === "provider")
    return t(
      provider === "apple"
        ? "delivery.confirmOnMac"
        : "delivery.confirmInProvider",
    );
  return t("common.saveToThisCalendar");
}
export const confirmationPending = (confirmation?: Confirmation): string =>
  t(
    confirmation?.mode === "provider"
      ? "delivery.providerPending"
      : "common.checkingTheSaveResult",
  );
export function connectionNotice(state: Connection["state"]): string {
  switch (state) {
    case "ready":
      return "";
    case "needs_authorization":
      return t("connections.permissionRequired");
    case "denied":
      return t("connections.permissionDenied");
    case "unsupported":
      return t("connections.unsupported");
    case "unavailable":
      return t("connections.unavailable");
  }
}

/** System names are translated. User-defined names remain data, not copy. */
export function connectionName(
  name?: import("../live/types.ts").ConnectionName,
): string {
  if (name?.kind === "custom") return name.text;
  return t(
    name?.kind === "system" && name.key === "appleLocal"
      ? "connections.appleLocal"
      : "common.externalCalendar",
  );
}
