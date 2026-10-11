import { ProductionArea } from "./producion-area.model";
import { ProductOption } from "./product-optionl.model";
import { Tag } from "./tag.model";

export enum ProductStatus {
  AVAILABLE = "AVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  OUT_OF_SEASON = "OUT_OF_SEASON",
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string;
  status: ProductStatus;
  tags: Tag[];
  isActive: boolean;
  isPublic: boolean;
  iva: number;
  category: { id: string; name: string };
  options: ProductOption[];
  productionArea: ProductionArea;
}

/**
 * The option that represents the product by default: the one flagged as
 * default, or the first option when none is flagged.
 */
export function getProductDefaultOption(
  product: Product,
): ProductOption | undefined {
  return (
    product.options?.find((option) => option.isDefault) ?? product.options?.[0]
  );
}
