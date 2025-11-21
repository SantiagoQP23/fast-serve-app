export enum ProductStatus {
  AVAILABLE = "AVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  OUT_OF_SEASON = "OUT_OF_SEASON",
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string;
  status: ProductStatus;
  isActive: boolean;
  isPublic: boolean;
  unitCost: number;
  quantity: number;
  iva: number;
  category: { id: string; name: string };
}
