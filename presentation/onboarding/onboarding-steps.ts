import type { Href } from "expo-router";
import type { IconName } from "@/presentation/theme/components/icon";
import { OnboardingStep } from "@/core/restaurant/models/onboarding.model";

export interface OnboardingStepDefinition {
  key: OnboardingStep;
  icon: IconName;
  /** Screen that does the step. The first order opens the new-order sheet. */
  href?: Href;
  optional?: boolean;
}

/** Order shown in the "Primeros pasos" checklist. */
export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    key: OnboardingStep.MENU,
    icon: "hamburger",
    href: "/(profile)/menu/products/form",
  },
  {
    key: OnboardingStep.RESTAURANT_INFO,
    icon: "receipt-text",
    href: "/(profile)/restaurant/edit",
  },
  {
    key: OnboardingStep.TABLES,
    icon: "layout-grid",
    href: "/(profile)/tables",
  },
  {
    key: OnboardingStep.PAYMENT_METHODS,
    icon: "credit-card",
    href: "/(profile)/payment-methods",
  },
  { key: OnboardingStep.STAFF, icon: "users", href: "/staff" },
  {
    key: OnboardingStep.PRINTER,
    icon: "printer",
    href: "/(profile)/production/printers/form",
    optional: true,
  },
  { key: OnboardingStep.FIRST_ORDER, icon: "clipboard-list" },
];

export const REQUIRED_ONBOARDING_STEPS = ONBOARDING_STEPS.filter(
  (step) => !step.optional,
);
