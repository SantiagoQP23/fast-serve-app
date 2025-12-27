import { Alert, AlertButton } from 'react-native';
import i18n from './i18n.config';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

/**
 * Internationalized Alert wrapper
 * Automatically translates alert buttons
 */
export const i18nAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: any
) => {
  // Translate default button labels if not provided
  const translatedButtons = buttons?.map((button) => ({
    ...button,
    text: button.text || i18n.t('common:actions.ok'),
  }));

  Alert.alert(title, message, translatedButtons, options);
};

/**
 * Format currency with locale
 * Always uses $ symbol as per requirements
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Format date with DD/MM format
 * Always uses DD/MM format as per requirements
 */
export const formatDate = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format('DD/MM/YYYY');
};

/**
 * Format time
 */
export const formatTime = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format('HH:mm');
};

/**
 * Format date and time
 */
export const formatDateTime = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

/**
 * Get relative date (Today, Yesterday, or date)
 */
export const getRelativeDate = (date: Date | string | dayjs.Dayjs): string => {
  const d = dayjs(date);
  const today = dayjs();
  
  if (d.isSame(today, 'day')) {
    return i18n.t('common:time.today');
  }
  
  if (d.isSame(today.subtract(1, 'day'), 'day')) {
    return i18n.t('common:time.yesterday');
  }
  
  if (d.isSame(today.add(1, 'day'), 'day')) {
    return i18n.t('common:time.tomorrow');
  }
  
  return formatDate(d);
};

/**
 * Get relative time from now (e.g., "5m ago", "2h ago", "3d ago")
 */
export const getRelativeTime = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).fromNow();
};

/**
 * Update dayjs locale based on current language
 */
export const updateDayjsLocale = (language: string) => {
  dayjs.locale(language);
};

/**
 * Initialize dayjs with default locale
 */
export const initializeDayjs = () => {
  updateDayjsLocale(i18n.language);
};

// Subscribe to language changes
i18n.on('languageChanged', (lng) => {
  updateDayjsLocale(lng);
});
