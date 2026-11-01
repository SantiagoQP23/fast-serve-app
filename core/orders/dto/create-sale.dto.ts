import type { LineCustomizationPayload } from "@/core/menu/models/customization.model";
export interface CreateSaleDetailDto {
  productId: string;
  quantity: number;
  price: number;
  productOptionId: number;
  /** Picks and removals; the server checks them and sets the price. */
  customization?: LineCustomizationPayload;
}

export interface CreateSaleDto {
  idempotencyKey?: string;
  details: CreateSaleDetailDto[];
}
