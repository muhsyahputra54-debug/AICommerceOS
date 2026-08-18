import type { Locale } from "./config";

const dictionaries = {
  id: {
    common: {
      language: "Bahasa",
      indonesian: "Indonesia",
      english: "Inggris",
    },
  },
  en: {
    common: {
      language: "Language",
      indonesian: "Indonesian",
      english: "English",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)["id"];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] as Dictionary;
}