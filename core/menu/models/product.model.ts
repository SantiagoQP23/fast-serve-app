import { ProductionArea } from "./producion-area.model";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
  getVariantStockMode,
  type ProductOption,
  type ProductOptionStockLevel,
  type VariantStockMode,
} from "./product-optionl.model";
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
  /** False: one "Normal" variant that stands for the product itself. */
  hasVariants?: boolean;
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

/** The product with `variantId` flagged as its only default option. */
export function withDefaultOption(
  product: Product,
  variantId: number,
): Product {
  return {
    ...product,
    options: product.options?.map((option) => ({
      ...option,
      isDefault: option.id === variantId,
    })),
  };
}

/** Active variants, or every variant when none is active. */
export function getProductActiveOptions(product: Product): ProductOption[] {
  const active = (product.options ?? []).filter((option) => option.isActive);
  return active.length ? active : (product.options ?? []);
}

export interface ProductStockSummary {
  /** Set when the product has one active variant: that variant's mode. */
  mode: VariantStockMode | null;
  /** Units left (own stock) or units the recipe covers; single variant only. */
  available: number | null;
  /** One variant: its level. Several: "out" only when every one is out. */
  level: ProductOptionStockLevel | null;
  variantCount: number;
  /** Variants (of several) out of stock / low. */
  outCount: number;
  lowCount: number;
  /** Several variants: sum of their own stock, when every one has it. */
  ownStockTotal: number | null;
}

/** What the menu list says about a product's stock. */
export function getProductStockSummary(product: Product): ProductStockSummary {
  const options = getProductActiveOptions(product);
  const levels = options.map((option) => getProductOptionStockLevel(option));
  const summary: ProductStockSummary = {
    mode: null,
    available: null,
    level: null,
    variantCount: options.length,
    outCount: levels.filter((level) => level === "out").length,
    lowCount: levels.filter((level) => level === "low").length,
    ownStockTotal: null,
  };

  if (options.length === 1) {
    const [option] = options;
    summary.mode = getVariantStockMode(option);
    summary.available = getProductOptionAvailableQuantity(option);
    summary.level = levels[0];
  } else if (options.length > 1) {
    if (summary.outCount === options.length) summary.level = "out";
    if (options.every((option) => getVariantStockMode(option) === "own")) {
      // Oversold variants (below zero) count as none left, not as debt
      summary.ownStockTotal = options.reduce(
        (total, option) =>
          total + Math.max(getProductOptionAvailableQuantity(option) ?? 0, 0),
        0,
      );
    }
  }

  return summary;
}

export type ProductStockAttention = "out" | "low";

/**
 * Which menu stock count a product falls under: "out" when it can't be sold
 * at all, "low" when it's low or only some of its variants are out.
 */
export function getProductStockAttention(
  summary: ProductStockSummary,
): ProductStockAttention | null {
  if (summary.level === "out") return "out";
  if (summary.level === "low" || summary.outCount > 0 || summary.lowCount > 0)
    return "low";
  return null;
}
