import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type ProductSubscriptionAndroid,
} from "expo-iap";

export interface GooglePlayPurchaseResult {
  purchase: Purchase;
  productId: string;
  purchaseToken: string;
}

/**
 * The ONLY file in the app that imports expo-iap / talks to Google Play
 * Billing directly - PurchaseSubscriptionService (provider-agnostic) is the
 * only consumer. Nothing here is called from the UI.
 */
export class GooglePlayBillingService {
  private static connected = false;
  private static listenersAttached = false;
  private static pending: {
    resolve: (result: Purchase) => void;
    reject: (error: Error) => void;
  } | null = null;

  private static ensureListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    purchaseUpdatedListener((purchase) => {
      this.pending?.resolve(purchase);
      this.pending = null;
    });

    purchaseErrorListener((error) => {
      this.pending?.reject(new Error(error.message));
      this.pending = null;
    });
  }

  static async connect(): Promise<void> {
    if (this.connected) return;
    await initConnection();
    this.ensureListeners();
    this.connected = true;
  }

  static async disconnect(): Promise<void> {
    if (!this.connected) return;
    await endConnection();
    this.connected = false;
  }

  /** Play Billing requires the specific base-plan offer token, not just a productId. */
  private static async resolveOfferToken(
    productId: string,
    basePlanId: string,
  ): Promise<string> {
    const products = (await fetchProducts({
      skus: [productId],
      type: "subs",
    })) as ProductSubscriptionAndroid[];

    const product = products.find((item) => item.id === productId);
    const offer = product?.subscriptionOffers.find(
      (candidate) => candidate.basePlanIdAndroid === basePlanId,
    );

    if (!offer?.offerTokenAndroid) {
      throw new Error(
        `No Google Play offer found for product "${productId}" / base plan "${basePlanId}"`,
      );
    }
    return offer.offerTokenAndroid;
  }

  static async purchaseSubscription(
    productId: string,
    basePlanId: string,
  ): Promise<GooglePlayPurchaseResult> {
    await this.connect();
    const offerToken = await this.resolveOfferToken(productId, basePlanId);

    const purchase = await new Promise<Purchase>((resolve, reject) => {
      this.pending = { resolve, reject };
      requestPurchase({
        type: "subs",
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: [{ sku: productId, offerToken }],
          },
        },
      }).catch((error) => {
        this.pending = null;
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });

    if (!purchase.purchaseToken) {
      throw new Error("Google Play purchase has no purchase token");
    }

    return {
      purchase,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
    };
  }

  /** Must be called only after the backend has verified + acknowledged the purchase. */
  static async finishTransaction(purchase: Purchase): Promise<void> {
    await finishTransaction({ purchase, isConsumable: false });
  }

  /** Purchases the store still knows about for this account (restore-purchases flow). */
  static async getAvailablePurchases(): Promise<GooglePlayPurchaseResult[]> {
    await this.connect();
    const purchases = await getAvailablePurchases();

    return purchases
      .filter((purchase) => !!purchase.purchaseToken)
      .map((purchase) => ({
        purchase,
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken as string,
      }));
  }
}
