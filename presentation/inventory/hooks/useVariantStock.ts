import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import {
  VariantStockService,
  type EnableVariantStockDto,
  type VariantStockResponse,
} from "../services/variant-stock.service";
import { inventoryItemsQueryKey } from "./useInventoryItems";

/**
 * Puts the variant's new lines in the menu kept on the phone right away;
 * the sync event that follows brings the same data to the other phones.
 */
function applyToMenu(response: VariantStockResponse) {
  const { products, updateProductOption } = useMenuStore.getState();
  const product = products.find((p) =>
    p.options?.some((option) => option.id === response.id),
  );
  const option = product?.options.find((o) => o.id === response.id);
  if (!product || !option) return;
  updateProductOption(product.id, {
    ...option,
    inventoryItems: response.inventoryItems ?? [],
  });
}

/** Changes how a menu variant tracks stock. */
export const useVariantStock = () => {
  const { t } = useTranslation("inventory");

  const onSuccess = (response: VariantStockResponse) => {
    applyToMenu(response);
    queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
  };
  const onError = (error: Error) =>
    toast.error(getErrorMessage(error, { fallback: t("variant.saveError") }));

  const enable = useMutation<
    VariantStockResponse,
    Error,
    { productOptionId: number } & EnableVariantStockDto
  >({
    mutationFn: ({ productOptionId, ...data }) =>
      VariantStockService.enable(productOptionId, data),
    onSuccess,
    onError,
  });

  const disable = useMutation<VariantStockResponse, Error, number>({
    mutationFn: (productOptionId) =>
      VariantStockService.disable(productOptionId),
    onSuccess,
    onError,
  });

  const separate = useMutation<VariantStockResponse, Error, number>({
    mutationFn: (productOptionId) =>
      VariantStockService.separate(productOptionId),
    onSuccess,
    onError,
  });

  const convertToIngredient = useMutation<VariantStockResponse, Error, number>({
    mutationFn: (productOptionId) =>
      VariantStockService.convertToIngredient(productOptionId),
    onSuccess,
    onError,
  });

  return { enable, disable, separate, convertToIngredient };
};
