import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/**
 * Custom hook for translations
 * Wraps react-i18next's useTranslation with app-specific configuration
 * 
 * @param namespace - Translation namespace (common, auth, orders, etc.)
 * @returns Translation function and i18n instance
 */
export const useTranslation = (namespace?: string | string[]) => {
  const { t, i18n } = useI18nTranslation(namespace);
  
  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage.bind(i18n),
  };
};

/**
 * Type-safe translation key helper
 */
export type TranslationKey = string;

export type { TFunction };
