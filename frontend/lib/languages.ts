export type LanguageCode = "en" | "ar" | "ur" | "hi" | "es" | "fr";

export type SupportedLanguage = {
  code: LanguageCode;
  displayName: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  deepgramCode: string;
  browserSpeechCode: string;
};

export const supportedLanguages: SupportedLanguage[] = [
  { code: "en", displayName: "English", nativeName: "English", direction: "ltr", deepgramCode: "en", browserSpeechCode: "en-US" },
  { code: "ar", displayName: "Arabic", nativeName: "العربية", direction: "rtl", deepgramCode: "ar", browserSpeechCode: "ar-SA" },
  { code: "ur", displayName: "Urdu", nativeName: "اردو", direction: "rtl", deepgramCode: "ur", browserSpeechCode: "ur-PK" },
  { code: "hi", displayName: "Hindi", nativeName: "हिन्दी", direction: "ltr", deepgramCode: "hi", browserSpeechCode: "hi-IN" },
  { code: "es", displayName: "Spanish", nativeName: "Español", direction: "ltr", deepgramCode: "es", browserSpeechCode: "es-ES" },
  { code: "fr", displayName: "French", nativeName: "Français", direction: "ltr", deepgramCode: "fr", browserSpeechCode: "fr-FR" },
];

export function getLanguage(code?: string | null) {
  return supportedLanguages.find((language) => language.code === code) || supportedLanguages[0];
}

export function isRtlLanguage(code?: string | null) {
  return getLanguage(code).direction === "rtl";
}
