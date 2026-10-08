export interface ProductionAreaSalesDto {
  productionAreaId: number | null;
  productionAreaName: string | null;
  totalSold: number;
  totalAmountSold: number;
}

export interface SalesByProductionAreaResponseDto {
  areas: ProductionAreaSalesDto[];
  totalAmountSold: number;
}

export interface SalesByProductionAreaFiltersDto {
  startDate?: string;
  endDate?: string;
  userId?: string;
}
