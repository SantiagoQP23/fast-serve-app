// Payload for the standalone `POST /product-options` endpoint — adds a single
// variant to an existing product. Distinct from the nested `productOptions`
// array item used inside CreateProductDto when creating a whole product.
export interface CreateProductOptionDto {
  name: string;
  price: number;
  isDefault: boolean;
  productId: string;
  trackStock: boolean;
  order?: number;
  quantity?: number;
}
