export type LanguageOption = {
  displayLabel: string;
  requestValue: string;
  fileSuffix: string | null;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { displayLabel: "Auto-detect", requestValue: "Auto-detect", fileSuffix: null },
  { displayLabel: "Arabic", requestValue: "Arabic", fileSuffix: "ar" },
  { displayLabel: "Chinese (Simplified)", requestValue: "Chinese (Simplified)", fileSuffix: "zh-CN" },
  { displayLabel: "Chinese (Traditional)", requestValue: "Chinese (Traditional)", fileSuffix: "zh-TW" },
  { displayLabel: "Dutch", requestValue: "Dutch", fileSuffix: "nl" },
  { displayLabel: "English", requestValue: "English", fileSuffix: "en" },
  { displayLabel: "French", requestValue: "French", fileSuffix: "fr" },
  { displayLabel: "German", requestValue: "German", fileSuffix: "de" },
  { displayLabel: "Hindi", requestValue: "Hindi", fileSuffix: "hi" },
  { displayLabel: "Italian", requestValue: "Italian", fileSuffix: "it" },
  { displayLabel: "Japanese", requestValue: "Japanese", fileSuffix: "ja" },
  { displayLabel: "Korean", requestValue: "Korean", fileSuffix: "ko" },
  { displayLabel: "Polish", requestValue: "Polish", fileSuffix: "pl" },
  { displayLabel: "Portuguese (Brazil)", requestValue: "Portuguese (Brazil)", fileSuffix: "pt-BR" },
  { displayLabel: "Portuguese (Portugal)", requestValue: "Portuguese (Portugal)", fileSuffix: "pt-PT" },
  { displayLabel: "Russian", requestValue: "Russian", fileSuffix: "ru" },
  { displayLabel: "Spanish", requestValue: "Spanish", fileSuffix: "es" },
  { displayLabel: "Spanish (Latin America)", requestValue: "Spanish (Latin America)", fileSuffix: "es-419" },
  { displayLabel: "Turkish", requestValue: "Turkish", fileSuffix: "tr" },
  { displayLabel: "Ukrainian", requestValue: "Ukrainian", fileSuffix: "uk" },
];

export const TARGET_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter((language) => language.requestValue !== "Auto-detect");

export function getLanguageOption(value: string) {
  return LANGUAGE_OPTIONS.find((option) => option.requestValue === value);
}

export function getLanguageFileSuffix(value: string) {
  return getLanguageOption(value)?.fileSuffix ?? "translated";
}
