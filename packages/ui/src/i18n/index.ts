import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEn from "./locales/en/common.json";
import commonTr from "./locales/tr/common.json";

export const defaultResources = {
  en: {
    common: commonEn,
  },
  tr: {
    common: commonTr,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: defaultResources,
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
