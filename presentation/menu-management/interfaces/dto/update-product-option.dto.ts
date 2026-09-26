export interface UpdateProductOptionDto {
  name?: string;
  price?: number;
  isDefault?: boolean;
  trackStock?: boolean;
  order?: number;
  quantity?: number;
  isActive?: boolean;
}
