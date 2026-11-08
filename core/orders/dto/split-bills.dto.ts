import { CreateBillDetailDto } from "./create-bill.dto";

/** One of the bills an order is split into. */
export interface SplitBillItemDto {
  label?: string;
  clientId?: string;
  /** Quantities may have up to 3 decimals for items shared between bills. */
  details: CreateBillDetailDto[];
}

/** Creates several bills for one order at once (all or nothing). */
export interface SplitBillsDto {
  idempotencyKey: string;
  orderId: string;
  bills: SplitBillItemDto[];
}
