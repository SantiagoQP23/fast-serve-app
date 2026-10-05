export interface CreateInventoryPurchaseDto {
  items: { inventoryItemId: string; quantity: number }[];
  note?: string;
  idempotencyKey?: string;
}
