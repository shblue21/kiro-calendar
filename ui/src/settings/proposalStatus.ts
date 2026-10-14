import { t } from "../i18n/index.ts";
/** Registration and the outcome of the last execution are separate facts. */
export function hookExecutionNotice(status?: string): {
  text: string;
  failure: boolean;
} | null {
  switch (status) {
    case "ok":
      return null;
    case "not_run":
      return { text: t("suggestions.registered"), failure: false };
    case "timeout":
      return { text: t("suggestions.runTimeout"), failure: true };
    case "blocked":
      return { text: t("suggestions.runBlocked"), failure: true };
    case "error":
      return { text: t("suggestions.runFailed"), failure: true };
    default:
      return { text: t("suggestions.runUnknown"), failure: false };
  }
}
