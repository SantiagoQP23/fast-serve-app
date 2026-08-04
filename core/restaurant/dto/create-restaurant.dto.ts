export interface CreateRestaurantDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tablesQuantity: number;
}
