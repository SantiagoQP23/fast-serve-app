import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import type { Product } from "@/core/menu/models/product.model";
import type { ModifierGroup } from "@/core/menu/models/customization.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import {
  ModifierGroupsService,
  type SaveModifierGroupInput,
  type SaveProductCustomizationInput,
} from "../services/modifier-groups.service";

export const modifierGroupsQueryKey = ["menu-modifier-groups"];

/**
 * Applies a group change to the menu products on this phone right away; the
 * sync events the server sends for the same products agree with it.
 */
const updateProductsGroup = (
  groupId: string,
  group: ModifierGroup | null,
): void => {
  const { products, upsertProducts } = useMenuStore.getState();
  const changed: Product[] = [];
  // The saved group lists every product using it, so links made or dropped
  // from the group screen show up here too.
  const usedBy = group?.productIds ? new Set(group.productIds) : null;
  for (const product of products) {
    const links = product.modifierGroups ?? [];
    const linked = links.some((link) => link.groupId === groupId);
    const shouldLink = group
      ? usedBy
        ? usedBy.has(product.id)
        : linked
      : false;
    if (!linked && !shouldLink) continue;
    const shared = group ? { ...group, productIds: undefined } : null;
    changed.push({
      ...product,
      modifierGroups: !shouldLink
        ? links.filter((link) => link.groupId !== groupId)
        : linked
          ? links.map((link) =>
              link.groupId === groupId ? { ...link, group: shared } : link,
            )
          : [
              ...links,
              {
                // Replaced by the server's link when the product syncs.
                id: `${product.id}:${groupId}`,
                groupId,
                order: Math.max(-1, ...links.map((link) => link.order)) + 1,
                minSelect: null,
                maxSelect: null,
                variants: [],
                group: shared,
              },
            ],
    });
  }
  upsertProducts(changed);
};

/** Groups of options ("Sabor", "Extras"): list, create, edit, delete, link. */
export const useModifierGroups = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const { t } = useTranslation("menuManagement");

  const groupsQuery = useQuery({
    queryKey: modifierGroupsQueryKey,
    queryFn: () => ModifierGroupsService.getAll(),
    enabled,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: modifierGroupsQueryKey });

  const showError = (fallback: string) => (error: Error) => {
    toast.error(getErrorMessage(error, { fallback }));
  };

  const saveGroup = useMutation<
    ModifierGroup,
    Error,
    {
      id?: string;
      input: SaveModifierGroupInput;
      /** No "saved" toast: the screen confirms the change itself. */
      quiet?: boolean;
    }
  >({
    mutationFn: ({ id, input }) =>
      id
        ? ModifierGroupsService.update(id, input)
        : ModifierGroupsService.create(input),
    onSuccess: (group, { quiet }) => {
      updateProductsGroup(group.id, group);
      // Known right away, e.g. by the product that links a new group or the
      // detail screen showing its products
      queryClient.setQueryData<ModifierGroup[]>(
        modifierGroupsQueryKey,
        (current) =>
          current &&
          (current.some((entry) => entry.id === group.id)
            ? current.map((entry) =>
                entry.id === group.id
                  ? {
                      ...group,
                      productIds: group.productIds ?? entry.productIds,
                    }
                  : entry,
              )
            : [...current, group]),
      );
      if (!quiet) toast.success(t("modifierGroups.saved"));
      invalidate();
    },
    onError: showError(t("modifierGroups.saveError")),
  });

  const deleteGroup = useMutation<void, Error, string>({
    mutationFn: (id) => ModifierGroupsService.remove(id),
    onSuccess: (_, id) => {
      updateProductsGroup(id, null);
      // Gone right away, so screens showing it can leave
      queryClient.setQueryData<ModifierGroup[]>(
        modifierGroupsQueryKey,
        (current) => current?.filter((entry) => entry.id !== id),
      );
      toast.success(t("modifierGroups.deleted"));
      invalidate();
    },
    onError: showError(t("modifierGroups.deleteError")),
  });

  const saveProductCustomization = useMutation<
    Product,
    Error,
    { productId: string; input: SaveProductCustomizationInput }
  >({
    mutationFn: ({ productId, input }) =>
      ModifierGroupsService.saveProductCustomization(productId, input),
    onSuccess: (product) => {
      const { products, upsertProducts } = useMenuStore.getState();
      const current = products.find((item) => item.id === product.id);
      // Keep what the phone has and take the new customization.
      upsertProducts([
        current
          ? {
              ...current,
              components: product.components,
              modifierGroups: product.modifierGroups,
            }
          : product,
      ]);
      toast.success(t("customization.saved"));
      invalidate();
    },
    onError: showError(t("customization.saveError")),
  });

  return {
    groupsQuery,
    groups: groupsQuery.data ?? [],
    saveGroup,
    deleteGroup,
    saveProductCustomization,
  };
};
