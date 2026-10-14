import { activeLocale, useLanguageGeneration } from "@kirocrew/app-sdk";
import { bindLanguageSource, locale } from "./locale.ts";
// Bind once at the host boundary; pure domain/tests can use another source.
bindLanguageSource(activeLocale);
export function useLocale() {
  useLanguageGeneration();
  return locale();
}
