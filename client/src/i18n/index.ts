import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import arTranslations from "./locales/ar.json";

const savedLanguage = localStorage.getItem("taskflow_language") || "en";

// Set initial HTML direction and lang attribute
if (typeof document !== "undefined") {
  document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = savedLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

// Automatically handle language changes to keep HTML dir and lang synced
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
    localStorage.setItem("taskflow_language", lng);
  }
});

export default i18n;
