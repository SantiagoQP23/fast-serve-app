export interface ProductOption {
  id: number;
  name: string;
  price: number;
  cost?: number;
  manageStock?: boolean;
  quantity: number;
  isActive: boolean;
  isAvailable: boolean;
  isDefault: boolean;
}
