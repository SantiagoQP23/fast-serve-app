import { router } from "expo-router";
import {
  getProductDefaultOption,
  type Product,
} from "@/core/menu/models/product.model";

/** Opens the product form filled in to edit `product`. */
export function openProductForm(product: Product) {
  router.push({
    pathname: "/(profile)/menu/products/form",
    params: {
      productId: product.id,
      name: product.name,
      description: product.description || "",
      price: String(getProductDefaultOption(product)?.price ?? ""),
      categoryId: product.category.id,
      productionAreaId: product.productionArea?.id
        ? String(product.productionArea.id)
        : "",
      isActive: String(product.isActive),
      isPublic: String(product.isPublic),
      options: JSON.stringify(product.options ?? []),
    },
  });
}
