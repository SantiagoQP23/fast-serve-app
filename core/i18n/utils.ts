import { Alert, AlertButton } from "react-native";
import i18n from "./i18n.config";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import "dayjs/locale/en";
import { PaymentMethod } from "../orders/enums/payment-method";
import { PaymentMethodCategory } from "../restaurant/models/payment-method.model";
import { Roles } from "../auth/models/user.model";
import type { IconName } from "@/presentation/theme/components/icon";

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
  options?: any,
) => {
  // Translate default button labels if not provided
  const translatedButtons = buttons?.map((button) => ({
    ...button,
    text: button.text || i18n.t("common:actions.ok"),
  }));

  Alert.alert(title, message, translatedButtons, options);
};

/**
 * Format currency with locale
 * Always uses $ symbol as per requirements, with thousands grouped ("$1,234.50")
 */
export const formatCurrency = (amount: number): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  const fixed = Math.abs(value).toFixed(2);
  const [integer, decimals] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = value < 0 && fixed !== "0.00" ? "-" : "";
  return `${sign}$${grouped}.${decimals}`;
};

/**
 * Format date with DD/MM format
 * Always uses DD/MM format as per requirements
 */
export const formatDate = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format("DD/MM/YYYY");
};

/**
 * Format time
 */
export const formatTime = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format("HH:mm");
};

/**
 * Format date and time
 */
export const formatDateTime = (date: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
};

/**
 * Get relative date (Today, Yesterday, or date)
 */
export const getRelativeDate = (date: Date | string | dayjs.Dayjs): string => {
  const d = dayjs(date);
  const today = dayjs();

  if (d.isSame(today, "day")) {
    return i18n.t("common:time.today");
  }

  if (d.isSame(today.subtract(1, "day"), "day")) {
    return i18n.t("common:time.yesterday");
  }

  if (d.isSame(today.add(1, "day"), "day")) {
    return i18n.t("common:time.tomorrow");
  }

  return formatDate(d);
};

/**
 * Group consecutive items that share a key, keeping the incoming order
 * (lists arrive newest first, so groups come out newest first too).
 */
export const groupConsecutive = <T>(
  items: T[],
  getKey: (item: T) => string,
): { key: string; items: T[] }[] => {
  const groups: { key: string; items: T[] }[] = [];
  for (const item of items) {
    const key = getKey(item);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
};

/** Group items by calendar day (key: YYYY-MM-DD). */
export const groupByDay = <T>(
  items: T[],
  getDate: (item: T) => Date | string | dayjs.Dayjs,
) =>
  groupConsecutive(items, (item) =>
    dayjs(getDate(item)).format("YYYY-MM-DD"),
  ).map(({ key, items: dayItems }) => ({ day: key, items: dayItems }));

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
i18n.on("languageChanged", (lng) => {
  updateDayjsLocale(lng);
});

/**
 * Payment Method Translation Utilities
 */

export interface PaymentMethodInfo {
  icon: IconName;
  translationKey: string;
  color: string;
  bgColor: string;
}

/**
 * Get translation key for payment method
 */
export const getPaymentMethodTranslationKey = (
  method: PaymentMethod | PaymentMethodCategory | string,
): string => {
  switch (method) {
    case PaymentMethod.CASH:
    case PaymentMethodCategory.CASH:
    case "CASH":
      return "bills:paymentMethods.cash";
    case PaymentMethod.CREDIT_CARD:
    case "CREDIT_CARD":
      return "bills:paymentMethods.creditCard";
    case PaymentMethodCategory.CARD:
    case "CARD":
      return "bills:paymentMethods.card";
    case PaymentMethod.TRANSFER:
    case PaymentMethodCategory.TRANSFER:
    case "TRANSFER":
      return "bills:paymentMethods.transfer";
    case PaymentMethodCategory.DIGITAL_WALLET:
    case "DIGITAL_WALLET":
      return "bills:paymentMethods.digitalWallet";
    case PaymentMethodCategory.OTHER:
    case "OTHER":
      return "bills:paymentMethods.other";
    default:
      return "bills:paymentMethods.other"; // fallback
  }
};

/**
 * Get icon for payment method
 */
export const getPaymentMethodIcon = (
  method: PaymentMethod | PaymentMethodCategory | string,
): IconName => {
  switch (method) {
    case PaymentMethod.CASH:
    case PaymentMethodCategory.CASH:
    case "CASH":
      return "banknote";
    case PaymentMethod.CREDIT_CARD:
    case "CREDIT_CARD":
    case PaymentMethodCategory.CARD:
    case "CARD":
      return "credit-card";
    case PaymentMethod.TRANSFER:
    case PaymentMethodCategory.TRANSFER:
    case "TRANSFER":
      return "arrow-left-right";
    case PaymentMethodCategory.DIGITAL_WALLET:
    case "DIGITAL_WALLET":
      return "smartphone";
    case PaymentMethodCategory.OTHER:
    case "OTHER":
      return "wallet";
    default:
      return "wallet";
  }
};

/**
 * Get complete payment method information (icon, translation key, colors)
 */
export const getPaymentMethodInfo = (
  method: PaymentMethod | PaymentMethodCategory | string,
): PaymentMethodInfo => {
  switch (method) {
    case PaymentMethod.CASH:
    case PaymentMethodCategory.CASH:
    case "CASH":
      return {
        icon: "banknote",
        translationKey: "bills:paymentMethods.cash",
        color: "#10b981", // green-600
        bgColor: "bg-green-50",
      };
    case PaymentMethod.CREDIT_CARD:
    case "CREDIT_CARD":
      return {
        icon: "credit-card",
        translationKey: "bills:paymentMethods.creditCard",
        color: "#3b82f6", // blue-600
        bgColor: "bg-blue-50",
      };
    case PaymentMethodCategory.CARD:
    case "CARD":
      return {
        icon: "credit-card",
        translationKey: "bills:paymentMethods.card",
        color: "#3b82f6", // blue-600
        bgColor: "bg-blue-50",
      };
    case PaymentMethod.TRANSFER:
    case PaymentMethodCategory.TRANSFER:
    case "TRANSFER":
      return {
        icon: "arrow-left-right",
        translationKey: "bills:paymentMethods.transfer",
        color: "#8b5cf6", // purple-600
        bgColor: "bg-purple-50",
      };
    case PaymentMethodCategory.DIGITAL_WALLET:
    case "DIGITAL_WALLET":
      return {
        icon: "smartphone",
        translationKey: "bills:paymentMethods.digitalWallet",
        color: "#f97316", // orange-600
        bgColor: "bg-orange-50",
      };
    case PaymentMethodCategory.OTHER:
    case "OTHER":
      return {
        icon: "wallet",
        translationKey: "bills:paymentMethods.other",
        color: "#64748b", // slate-600
        bgColor: "bg-slate-50",
      };
    default:
      return {
        icon: "wallet",
        translationKey: "bills:paymentMethods.other",
        color: "#6b7280", // gray-600
        bgColor: "bg-gray-50",
      };
  }
};

/**
 * Translate payment method using current language
 */
export const translatePaymentMethod = (
  method: PaymentMethod | PaymentMethodCategory | string,
): string => {
  const translationKey = getPaymentMethodTranslationKey(method);
  return i18n.t(translationKey);
};

/**
 * Get translation key for a user role
 */
export const getRoleTranslationKey = (role: Roles | string): string => {
  switch (role) {
    case Roles.ADMIN:
      return "auth:roles.admin";
    case Roles.OWNER:
      return "auth:roles.owner";
    case Roles.COOK:
      return "auth:roles.cook";
    case Roles.WAITER:
      return "auth:roles.waiter";
    case Roles.CASHIER:
      return "auth:roles.cashier";
    default:
      return "";
  }
};

/**
 * Translate a user role using current language
 */
export const translateRole = (role: Roles | string): string => {
  const translationKey = getRoleTranslationKey(role);
  return translationKey ? i18n.t(translationKey) : "";
};
