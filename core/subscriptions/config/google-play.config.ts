// The Google Play product/base-plan Teikio's PRO plan is sold as. Kept as env
// vars (not hardcoded in the purchase flow) so they can change without a code
// change - mirrors the backend's PlanProviderProduct seed for the same plan.
export const GOOGLE_PLAY_PRODUCT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_PLAY_PRODUCT_ID ?? "teikio_pro";

export const GOOGLE_PLAY_BASE_PLAN_ID =
  process.env.EXPO_PUBLIC_GOOGLE_PLAY_BASE_PLAN_ID ?? "monthly";
