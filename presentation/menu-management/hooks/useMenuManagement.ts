import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import type { Section } from "@/core/menu/models/section.model";
import type { Category } from "@/core/menu/models/category.model";
import type { Product } from "@/core/menu/models/product.model";
import { SectionsService } from "../services/sections.service";
import { CategoriesService } from "../services/categories.service";
import { ProductsService } from "../services/products.service";
import {
  ProductOptionsService,
  type CreatedProductOption,
} from "../services/product-options.service";
import type { CreateSectionDto } from "../interfaces/dto/create-section.dto";
import type { UpdateSectionDto } from "../interfaces/dto/update-section.dto";
import type { CreateCategoryDto } from "../interfaces/dto/create-category.dto";
import type { UpdateCategoryDto } from "../interfaces/dto/update-category.dto";
import type { CreateProductDto } from "../interfaces/dto/create-product.dto";
import type { UpdateProductDto } from "../interfaces/dto/update-product.dto";
import type { CreateProductOptionDto } from "../interfaces/dto/create-product-option.dto";
import type { UpdateProductOptionDto } from "../interfaces/dto/update-product-option.dto";
import type { DuplicateProductOptionDto } from "../interfaces/dto/duplicate-product-option.dto";
import { getErrorMessage } from "@/core/api/get-error-message";
import { queryClient } from "@/app/_layout";
import { inventoryItemsQueryKey } from "@/presentation/inventory/hooks/useInventoryItems";
import {
  requestSync,
  SELF_CHECK_DELAY_MS,
} from "@/presentation/sync/request-sync";

const MOVE_BATCH_SIZE = 4;

export const useMenuManagement = () => {
  const { t } = useTranslation("menuManagement");
  const {
    upsertSection,
    removeSection,
    upsertCategory,
    removeCategory,
    upsertProduct,
    removeProduct,
    setProductDefaultOption: setProductDefaultOptionInStore,
    addProductOption,
    updateProductOption: updateProductOptionInStore,
    removeProductOption,
  } = useMenuStore();

  const createSection = useMutation<Section, Error, CreateSectionDto>({
    mutationFn: (data) => SectionsService.create(data),
    onSuccess: (section) => {
      upsertSection(section);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("sections.createError") }),
      );
    },
  });

  const updateSection = useMutation<Section, Error, UpdateSectionDto>({
    mutationFn: (data) => SectionsService.update(data),
    onSuccess: (section) => {
      upsertSection(section);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("sections.updateError") }),
      );
    },
  });

  const deleteSection = useMutation<void, Error, string>({
    mutationFn: (id) => SectionsService.remove(id),
    onSuccess: (_, id) => {
      removeSection(id);
      toast.success(t("sections.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("sections.deleteError") }),
      );
    },
  });

  const createCategory = useMutation<Category, Error, CreateCategoryDto>({
    mutationFn: (data) => CategoriesService.create(data),
    onSuccess: (category) => {
      upsertCategory(category);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("categories.createError") }),
      );
    },
  });

  const updateCategory = useMutation<Category, Error, UpdateCategoryDto>({
    mutationFn: (data) => CategoriesService.update(data),
    onSuccess: (category) => {
      upsertCategory(category);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("categories.updateError") }),
      );
    },
  });

  const deleteCategory = useMutation<void, Error, string>({
    mutationFn: (id) => CategoriesService.remove(id),
    onSuccess: (_, id) => {
      removeCategory(id);
      toast.success(t("categories.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("categories.deleteError") }),
      );
    },
  });

  const createProduct = useMutation<Product, Error, CreateProductDto>({
    mutationFn: (data) => ProductsService.create(data),
    onSuccess: (product) => {
      upsertProduct(product);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("products.createError") }),
      );
    },
  });

  const updateProduct = useMutation<Product, Error, UpdateProductDto>({
    mutationFn: (data) => ProductsService.update(data),
    onSuccess: (product) => {
      upsertProduct(product);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("products.updateError") }),
      );
    },
  });

  // One PATCH per product (there is no bulk route); a few at a time so a
  // long list doesn't flood the server. Products that fail keep their area.
  const moveProductsToArea = useMutation<
    { moved: number; failed: number },
    Error,
    { productIds: string[]; productionAreaId: number }
  >({
    mutationFn: async ({ productIds, productionAreaId }) => {
      let moved = 0;
      let failed = 0;
      for (let i = 0; i < productIds.length; i += MOVE_BATCH_SIZE) {
        const batch = productIds.slice(i, i + MOVE_BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((id) => ProductsService.update({ id, productionAreaId })),
        );
        for (const result of results) {
          if (result.status === "fulfilled") {
            upsertProduct(result.value);
            moved++;
          } else {
            failed++;
          }
        }
      }
      return { moved, failed };
    },
    onSuccess: ({ failed }) => {
      if (failed > 0) {
        toast.error(t("products.moveAreaPartialError", { count: failed }));
      }
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("products.updateError") }),
      );
    },
  });

  const deleteProduct = useMutation<void, Error, string>({
    mutationFn: (id) => ProductsService.remove(id),
    onSuccess: (_, id) => {
      removeProduct(id);
      toast.success(t("products.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("products.deleteError") }),
      );
    },
  });

  const duplicateProduct = useMutation<Product, Error, string>({
    mutationFn: (id) => ProductsService.duplicate(id),
    onSuccess: (product) => {
      upsertProduct(product);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("products.duplicateError") }),
      );
    },
  });

  const createProductOption = useMutation<
    CreatedProductOption,
    Error,
    CreateProductOptionDto
  >({
    mutationFn: (data) => ProductOptionsService.create(data),
    onSuccess: (option, variables) => {
      // The server also renamed the only variant and marked the product
      // with variants; mirror it until the product's sync event arrives.
      const renamed = variables.currentOptionName?.trim();
      const product = useMenuStore
        .getState()
        .products.find((p) => p.id === option.productId);
      if (product)
        upsertProduct({
          ...product,
          hasVariants: true,
          options: product.options.map((existing) =>
            renamed && existing.isActive
              ? { ...existing, name: renamed }
              : existing,
          ),
        });
      addProductOption(option.productId, {
        id: option.id,
        name: option.name,
        price: option.price,
        cost: option.cost,
        isActive: option.isActive,
        isAvailable: option.isAvailable,
        isDefault: option.isDefault,
        trackStock: option.trackStock,
        quantity: option.quantity,
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, {
          fallback: t("products.variants.createError"),
        }),
      );
    },
  });

  const duplicateProductOption = useMutation<
    CreatedProductOption,
    Error,
    DuplicateProductOptionDto & { id: number; productId: string }
  >({
    mutationFn: ({ id, productId: _productId, ...data }) =>
      ProductOptionsService.duplicate(id, data),
    onSuccess: (copy, { id, productId, currentOptionName }) => {
      // Mirror what the server did until the product's sync event arrives:
      // the copy right after the original, a renamed "Normal", variants on.
      const product = useMenuStore
        .getState()
        .products.find((p) => p.id === productId);
      if (product) {
        const renamed = currentOptionName?.trim();
        const options = product.options
          .filter((existing) => existing.id !== copy.id)
          .map((existing) =>
            renamed && existing.isActive
              ? { ...existing, name: renamed }
              : existing,
          );
        const at = options.findIndex((existing) => existing.id === id);
        options.splice(at < 0 ? options.length : at + 1, 0, {
          id: copy.id,
          name: copy.name,
          price: copy.price,
          cost: copy.cost,
          isActive: copy.isActive,
          isAvailable: copy.isAvailable,
          isDefault: copy.isDefault,
          trackStock: copy.trackStock,
          quantity: copy.quantity,
          inventoryItems: copy.inventoryItems ?? [],
        });
        upsertProduct({ ...product, hasVariants: true, options });
      }
      queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
      requestSync(SELF_CHECK_DELAY_MS);
      toast.success(t("products.variants.duplicate.success"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, {
          fallback: t("products.variants.duplicate.error"),
        }),
      );
    },
  });

  const updateProductOption = useMutation<
    CreatedProductOption,
    Error,
    UpdateProductOptionDto & { id: number; productId: string }
  >({
    mutationFn: ({ id, productId, ...data }) =>
      ProductOptionsService.update(id, data),
    onSuccess: (option, variables) => {
      updateProductOptionInStore(variables.productId, {
        id: option.id,
        name: option.name,
        price: option.price,
        cost: option.cost,
        isActive: option.isActive,
        isAvailable: option.isAvailable,
        isDefault: option.isDefault,
        trackStock: option.trackStock,
        quantity: option.quantity,
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, {
          fallback: t("products.variants.updateError"),
        }),
      );
    },
  });

  const deleteProductOption = useMutation<
    void,
    Error,
    { id: number; productId: string }
  >({
    mutationFn: ({ id }) => ProductOptionsService.remove(id),
    onSuccess: (_, variables) => {
      removeProductOption(variables.productId, variables.id);
      toast.success(t("products.variants.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, {
          fallback: t("products.variants.deleteError"),
        }),
      );
    },
  });

  // Dedicated endpoint: clears isDefault on every option, sets it on
  // variantId, and syncs the product's price to that variant — all in one
  // atomic call. Returns the full product, so we just replace it in the store.
  const setDefaultProductOption = useMutation<
    Product,
    Error,
    { productId: string; variantId: number }
  >({
    mutationFn: ({ productId, variantId }) =>
      ProductsService.setDefaultVariant(productId, variantId),
    // The response lacks fields the store keeps (option inventory items,
    // production area), so only the default flags are updated.
    onSuccess: (_product, { productId, variantId }) => {
      setProductDefaultOptionInStore(productId, variantId);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, {
          fallback: t("products.variants.updateError"),
        }),
      );
    },
  });

  return {
    createSection,
    updateSection,
    deleteSection,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    moveProductsToArea,
    deleteProduct,
    duplicateProduct,
    createProductOption,
    duplicateProductOption,
    updateProductOption,
    deleteProductOption,
    setDefaultProductOption,
  };
};
