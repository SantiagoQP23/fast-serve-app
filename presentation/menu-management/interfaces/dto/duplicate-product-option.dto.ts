// Payload for `POST /product-options/:id/duplicate`: a copy of the variant
// in the same product, with its own stock (new or shared) or its recipe.
export interface DuplicateProductOptionDto {
  name: string;
  price: number;
  /** Names the original when it is the product's only variant. */
  currentOptionName?: string;
  /** Own stock: sell from the original's units instead of new ones. */
  sharedStock?: boolean;
  /** Own stock, not shared: units on hand now, recorded as a restock. */
  quantity?: number;
}
