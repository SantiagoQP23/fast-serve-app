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
  minimumQuantity?: number | null;
  isActive: boolean;
  restaurant?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
