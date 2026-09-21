import { Platform } from "react-native";
import { SubscriptionsService } from "./subscriptions.service";
import { GooglePlayBillingService } from "./google-play/google-play-billing.service";
import { PurchaseProvider } from "../enums/purchase-provider.enum";
import type { VerifyPurchaseResponse } from "../dto/verify-purchase.dto";
import {
  GOOGLE_PLAY_PRODUCT_ID,
  GOOGLE_PLAY_BASE_PLAN_ID,
} from "../config/google-play.config";

/**
 * Provider-agnostic purchase flow: SubscriptionScreen -> here ->
 * GooglePlayBillingService -> Google Play. The screen never talks to
 * GooglePlayBillingService (or expo-iap) directly - when an Apple provider
 * exists, only this file's Platform.OS branch needs to change.
 */
export class PurchaseSubscriptionService {
  static async purchase(): Promise<VerifyPurchaseResponse> {
    if (Platform.OS !== "android") {
      throw new Error("Purchases are only available on Android for now");
    }

    const { purchase, productId, purchaseToken } =
      await GooglePlayBillingService.purchaseSubscription(
        GOOGLE_PLAY_PRODUCT_ID,
        GOOGLE_PLAY_BASE_PLAN_ID,
      );

    const result = await SubscriptionsService.verifyPurchase({
      provider: PurchaseProvider.GOOGLE_PLAY,
      productId,
      purchaseToken,
    });

    // Only finalize locally once the backend has verified (and, server-side,
    // acknowledged) the purchase - never before.
    await GooglePlayBillingService.finishTransaction(purchase);

    return result;
  }

  /** Restores an existing purchase (reinstall, new device, cleared data). Never duplicates a Subscription. */
  static async restore(): Promise<VerifyPurchaseResponse | null> {
    if (Platform.OS !== "android") {
      throw new Error("Restoring purchases is only available on Android for now");
    }

    const purchases = await GooglePlayBillingService.getAvailablePurchases();
    const match = purchases.find(
      (candidate) => candidate.productId === GOOGLE_PLAY_PRODUCT_ID,
    );
    if (!match) return null;

    const result = await SubscriptionsService.verifyPurchase({
      provider: PurchaseProvider.GOOGLE_PLAY,
      productId: match.productId,
      purchaseToken: match.purchaseToken,
    });

    await GooglePlayBillingService.finishTransaction(match.purchase);

    return result;
  }
}
