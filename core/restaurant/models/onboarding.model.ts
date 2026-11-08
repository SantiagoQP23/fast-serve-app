/** Steps of the owner's "Primeros pasos" checklist (same keys as the API). */
export enum OnboardingStep {
  MENU = "menu",
  RESTAURANT_INFO = "restaurant-info",
  TABLES = "tables",
  PAYMENT_METHODS = "payment-methods",
  STAFF = "staff",
  PRINTER = "printer",
  FIRST_ORDER = "first-order",
}

export interface OnboardingStatus {
  completed: boolean;
  /** Done steps: reported by the app plus the ones the data shows. */
  steps: OnboardingStep[];
  /** The seeded sample menu is still there and there are no orders yet. */
  canClearSampleMenu: boolean;
}

export interface UpdateOnboardingDto {
  completeStep?: OnboardingStep;
  completed?: boolean;
}

export interface ClearSampleMenuResponse {
  removed: { sections: number; categories: number; products: number };
}
