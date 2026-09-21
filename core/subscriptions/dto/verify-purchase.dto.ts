import { PurchaseProvider } from "../enums/purchase-provider.enum";

export interface VerifyPurchaseDto {
  provider: PurchaseProvider;
  productId: string;
  purchaseToken: string;
}

export interface VerifyPurchaseResponse {
  plan: { id: number; name: string };
  status: string;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
}
