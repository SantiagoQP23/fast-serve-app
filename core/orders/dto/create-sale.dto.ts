export interface CreateSaleDetailDto {
  productId: string;
  quantity: number;
  price: number;
  productOptionId: number;
}

export interface CreateSaleDto {
  details: CreateSaleDetailDto[];
}
