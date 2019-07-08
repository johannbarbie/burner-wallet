import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { fr, en, es, ca, de, ro, he, ru, pt, ja } from "./locales";
import { initReactI18next } from 'react-i18next';

const options = {
  interpolation: {
    escapeValue: false // not needed for react!!
  },

  debug: true,
  resources: {
    fr: {
      common: fr.fr
    },
    en: {
      common: en.en
    },
    es: {
      common: es.es
    },
    ca: {
      common: ca.ca
    },
    de: {
      common: de.de
    },
    ro: {
      common: ro.ro
    },
    he: {
      common: he.he
    },
    ru: {
      common: ru.ru
    },
    pt: {
      common: pt.pt
    },
    ja: {
      common: ja.ja
    },
  },

  fallbackLng: "en",

  ns: ["common"],

  defaultNS: "common",

  react: {
    wait: false,
    bindI18n: "languageChanged loaded",
    bindStore: "added removed",
    nsMode: "default",
    transSupportBasicHtmlNodes: true,
  }
};

i18n.use(LanguageDetector).use(initReactI18next).init(options);
i18n.changeLanguage(navigator.language, (err, t) => {
  if (err) return console.log("Something went wrong during loading");
});

export default i18n;
