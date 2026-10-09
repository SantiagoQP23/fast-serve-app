export type RestaurantSettingValue = string | number | boolean;

/**
 * Flat key/value map returned by `GET /settings`. Keys come from the
 * backend's SETTINGS_DEFINITIONS; unknown keys are kept as-is.
 */
export interface RestaurantSettings {
  ORDER_PREP_TIME?: number;
  SOUND_ENABLED?: boolean;
  DEFAULT_PRINTER?: string;
  LOW_STOCK_EMAIL_HOUR?: number;
  [key: string]: RestaurantSettingValue | undefined;
}

export const DEFAULT_ORDER_PREP_TIME = 15;

/** Hour of the day (0-23, Ecuador time) of the daily low-stock email. */
export const DEFAULT_LOW_STOCK_EMAIL_HOUR = 22;
