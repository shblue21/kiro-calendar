export type Locale = "en" | "ko";
export const resolveLocale = (language: string): Locale =>
  /^ko(?:-|$)/i.test(language) ? "ko" : "en";
let readLanguage = () =>
  typeof document === "undefined"
    ? "en"
    : document.documentElement.lang || navigator.language;
/** The app's host adapter supplies the authoritative language source. */
export function bindLanguageSource(read: () => string): () => void {
  const previous = readLanguage;
  readLanguage = read;
  return () => {
    readLanguage = previous;
  };
}
export const locale = (): Locale => resolveLocale(readLanguage());
