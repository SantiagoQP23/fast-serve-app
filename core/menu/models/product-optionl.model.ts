export interface ProductOption {
  id: number;
  name: string;
  price: number;
  cost?: number;
  isActive: boolean;
  isAvailable: boolean;
  isDefault: boolean;
  trackStock: boolean;
  quantity: number;
}
