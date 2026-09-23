export enum InventoryUnit {
  UNIT = "UNIT",
  KG = "KG",
  G = "G",
  L = "L",
  ML = "ML",
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: InventoryUnit;
  quantity: number;
  quantityPerUnit: number;
  minStock?: number | null;
  unitCost?: number | null;
  trackStock: boolean;
  isActive: boolean;
  productOptionId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
