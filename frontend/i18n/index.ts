import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import tr from "./tr.json";

const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "tr", // Turkish as default language
  fallbackLng: "en", // English as fallback

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // Optional: Add debug mode for development
  debug: __DEV__,

  // Optional: Add keySeparator for nested translations
  keySeparator: ".",

  // Optional: Add namespace separator
  nsSeparator: ":",

  // Optional: Add missing key handling
  missingKeyHandler: (lng, ns, key, fallbackValue) => {
    if (__DEV__) {
      console.warn(`Missing translation for key: ${key} in language: ${lng}`);
    }
  },
});

export default i18n;
