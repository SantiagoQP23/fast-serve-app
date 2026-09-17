export interface BestSellingProductDto {
  productId: string;
  productName: string;
  productPrice: number;
  categoryName: string;
  productOptionId: number | null;
  productOptionName: string | null;
  totalSold: number;
}

export interface BestSellingProductsResponseDto {
  products: BestSellingProductDto[];
  count: number;
}

export interface BestSellingProductsFiltersDto {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}
