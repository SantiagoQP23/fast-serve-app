export interface CreateProductOptionDto {
  name: string;
  price: number;
  cost?: number;
  trackStock: boolean;
  quantity?: number;
  isDefault?: boolean;
}

export interface CreateProductDto {
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  productionAreaId?: number;
  quantity?: number;
  trackStock?: boolean;
  productOptions?: CreateProductOptionDto[];
}
