export interface CreateProductOptionDto {
  name: string;
  price: number;
  cost?: number;
  quantity?: number;
  trackStock?: boolean;
  isDefault?: boolean;
}

export interface CreateProductDto {
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  productionAreaId?: number;
  unitCost?: number;
  quantity?: number;
  productOptions?: CreateProductOptionDto[];
}
