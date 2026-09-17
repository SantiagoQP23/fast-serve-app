export interface BestSellingCategoryDto {
  categoryId: string;
  categoryName: string;
  totalSold: number;
  totalAmountSold: number;
}

export interface BestSellingCategoriesResponseDto {
  categories: BestSellingCategoryDto[];
  count: number;
}

export interface BestSellingCategoriesFiltersDto {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}
