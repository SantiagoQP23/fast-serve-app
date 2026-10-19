export interface UpdateRestaurantDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  identification?: string;
  capacity?: number | null;
}
