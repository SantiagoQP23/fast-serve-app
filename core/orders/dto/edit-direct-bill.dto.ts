import type { LineCustomizationPayload } from "@/core/menu/models/customization.model";
export interface EditDirectBillDetailDto {
  /** Existing line of the sale. Absent for a line added in this edit. */
  billDetailId?: number;
  productId?: string;
  productOptionId?: number;
  quantity: number;
  /** New lines only; existing lines keep the price they were sold at. */
  price?: number;
  /** Picks and removals; the server checks them and sets the price. */
  customization?: LineCustomizationPayload;
}

/** Full new list of lines of a direct sale; lines left out are removed. */
export interface EditDirectBillDto {
  billId: number;
  details: EditDirectBillDetailDto[];
  operationId?: string;
}
