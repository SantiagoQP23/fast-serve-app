import type { IFuseOptions } from "fuse.js";

import type { Product } from "@/core/menu/models/product.model";
import { useFuzzySearch } from "@/presentation/shared/hooks/useFuzzySearch";

const PRODUCT_SEARCH_OPTIONS: IFuseOptions<Product> = {
  keys: [
    { name: "name", weight: 3 },
    { name: "category.name", weight: 1 },
    { name: "options.name", weight: 1 },
  ],
};

/** Fuzzy product search by name, with category and variant names as secondary keys. */
export const useProductSearch = (products: Product[], query: string) =>
  useFuzzySearch(products, query, PRODUCT_SEARCH_OPTIONS);
