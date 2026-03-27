export interface CreateSaleDetailDto {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateSaleDto {
  details: CreateSaleDetailDto[];
}
