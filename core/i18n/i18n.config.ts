import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import enCommon from '../../locales/en/common.json';
import enAuth from '../../locales/en/auth.json';
import enOrders from '../../locales/en/orders.json';
import enTables from '../../locales/en/tables.json';
import enMenu from '../../locales/en/menu.json';
import enBills from '../../locales/en/bills.json';
import enValidations from '../../locales/en/validations.json';

import esCommon from '../../locales/es/common.json';
import esAuth from '../../locales/es/auth.json';
import esOrders from '../../locales/es/orders.json';
import esTables from '../../locales/es/tables.json';
import esMenu from '../../locales/es/menu.json';
import esBills from '../../locales/es/bills.json';
import esValidations from '../../locales/es/validations.json';

// Define available languages
export const AVAILABLE_LANGUAGES = {
  en: 'English',
  es: 'Español',
} as const;

export type LanguageCode = keyof typeof AVAILABLE_LANGUAGES;

// Get device locale (fallback to Spanish as per requirements)
const getDeviceLanguage = (): LanguageCode => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  // Check if device language is one of our supported languages
  if (deviceLocale && deviceLocale in AVAILABLE_LANGUAGES) {
    return deviceLocale as LanguageCode;
  }
  // Default to Spanish as per requirements
  return 'es';
};

// Configure i18next
i18n
  .use(initReactI18next)
  .init({
    // Default language is Spanish as per requirements
    lng: 'es',
    fallbackLng: false, // No fallback as per requirements
    debug: __DEV__,
    
    // Namespaces
    ns: ['common', 'auth', 'orders', 'tables', 'menu', 'bills', 'validations'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        orders: enOrders,
        tables: enTables,
        menu: enMenu,
        bills: enBills,
        validations: enValidations,
      },
      es: {
        common: esCommon,
        auth: esAuth,
        orders: esOrders,
        tables: esTables,
        menu: esMenu,
        bills: esBills,
        validations: esValidations,
      },
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
