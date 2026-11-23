import { router } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import type { Product } from "@/core/menu/models/product.model";
import {
  getActiveGroups,
  getRemovableIngredients,
  hasVariantRules,
} from "@/core/menu/models/customization.model";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";

/**
 * "Personalización" of a product in menu management: the recipe
 * ingredients the waiter can take off (edited on the recipe screen,
 * plans/unificar-receta-incluidos.md) and the groups of options it offers.
 * Groups are edited on their own screen.
 */
export default function ProductCustomizationSection({
  product,
  canManage,
}: {
  product: Product;
  canManage: boolean;
}) {
  const { t } = useTranslation("menuManagement");
  // Removable ingredients of any variant, once each.
  const components = [
    ...new Map(
      (product.options ?? [])
        .flatMap((option) => getRemovableIngredients(product, option.id))
        .map((ingredient) => [ingredient.inventoryItemId, ingredient]),
    ).values(),
  ];
  const links = [...(product.modifierGroups ?? [])]
    .filter((link) => link.group)
    .sort((a, b) => a.order - b.order);
  const activeGroupIds = new Set(
    getActiveGroups(product).map((group) => group.group.id),
  );

  if (!canManage && components.length === 0 && links.length === 0) return null;

  const openEditor = () =>
    router.push({
      pathname: "/(profile)/menu/products/customization",
      params: { productId: product.id },
    });

  const isEmpty = components.length === 0 && links.length === 0;

  return (
    <ThemedView style={tw`gap-3 mt-4`}>
      <DetailSectionTitle
        title={t("customization.title")}
        action={
          canManage &&
          !isEmpty && (
            <Button
              label={t("common:actions.edit")}
              leftIcon="pencil"
              variant="outline"
              size="extra-small"
              onPress={openEditor}
            />
          )
        }
      />
      <DetailCard style={tw`py-4 gap-3`}>
        {isEmpty ? (
          <ThemedView style={tw`items-center gap-3 bg-transparent`}>
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("customization.hint")}
            </ThemedText>
            <Button
              label={t("customization.setUp")}
              leftIcon="plus"
              variant="outline"
              size="small"
              onPress={openEditor}
            />
          </ThemedView>
        ) : (
          <>
            {components.length > 0 && (
              <ThemedView style={tw`gap-1 bg-transparent`}>
                <ThemedText
                  type="body2"
                  style={{ fontFamily: typography.semibold }}
                >
                  {t("customization.canRemove")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {components
                    .map((component) =>
                      component.removalPriceDelta
                        ? `${component.name} (${t(
                            "customization.removableFor",
                            {
                              amount: formatCurrency(
                                Math.abs(component.removalPriceDelta),
                              ),
                            },
                          )})`
                        : component.name,
                    )
                    .join(", ")}
                </ThemedText>
              </ThemedView>
            )}
            {links.map((link) => (
              <ThemedView key={link.id} style={tw`gap-1 bg-transparent`}>
                <ThemedText
                  type="body2"
                  style={[
                    { fontFamily: typography.semibold },
                    !activeGroupIds.has(link.groupId) && tw`text-gray-500`,
                  ]}
                >
                  {link.group!.name}
                  {!activeGroupIds.has(link.groupId)
                    ? ` · ${t("modifierGroups.inactive")}`
                    : ""}
                  {hasVariantRules(link)
                    ? ` · ${t("customization.limits.variesByVariant")}`
                    : ""}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={tw`text-gray-600`}
                  numberOfLines={2}
                >
                  {link
                    .group!.modifiers.filter((option) => option.isActive)
                    .map((option) => option.name)
                    .join(", ")}
                </ThemedText>
              </ThemedView>
            ))}
          </>
        )}
      </DetailCard>
    </ThemedView>
  );
}
