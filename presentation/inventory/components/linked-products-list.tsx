import Icon from "@/presentation/theme/components/icon";
import { router } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import IconButton from "@/presentation/theme/components/icon-button";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import InventorySectionHeader from "./inventory-section-header";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

interface LinkedProductsListProps {
  lines: ProductOptionInventoryItem[];
  unit: InventoryUnit;
  onAddPress?: () => void;
}

export default function LinkedProductsList({
  lines,
  unit,
  onAddPress,
}: LinkedProductsListProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`gap-4 bg-transparent`}>
      <InventorySectionHeader
        title={t("detail.linkedProducts")}
        count={lines.length}
        right={
          onAddPress ? (
            // Bare, so it doesn't outweigh the section title it belongs to
            <IconButton
              icon="plus"
              size={20}
              style={tw`-mr-3`}
              onPress={onAddPress}
              accessibilityLabel={t("detail.linkToProduct")}
            />
          ) : undefined
        }
      />

      {lines.length === 0 ? (
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {t("detail.noLinkedProducts")}
        </ThemedText>
      ) : (
        <GroupedList
          data={lines}
          keyExtractor={(line) => line.id}
          onItemPress={(line) =>
            router.push({
              pathname: "/(profile)/menu/products/option-recipe",
              params: {
                productOptionId: String(line.productOptionId),
                productOptionName: line.productOption?.name ?? "",
                productName: line.productOption?.product?.name ?? "",
              },
            })
          }
          renderItem={(line) => {
            const label = [
              line.productOption?.product?.name,
              line.productOption?.name,
            ]
              .filter(Boolean)
              // "Gaseosa 3L · Normal": product and variant stay distinct
              .join(" · ");

            return (
              <ThemedView
                style={tw`flex-row items-center justify-between bg-transparent`}
              >
                <ThemedView style={tw`gap-0.5 flex-1 bg-transparent`}>
                  <ThemedText
                    type="body2"
                    style={{ fontFamily: typography.medium }}
                    numberOfLines={1}
                  >
                    {label || t("detail.unknownProduct")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("quantityWithUnit", {
                      quantity: line.quantity,
                      unit: t(`units.${unit}`, { count: line.quantity }),
                    })}
                  </ThemedText>
                </ThemedView>
                <Icon
                  name="chevron-right"
                  size={18}
                  color={tw.color("gray-400")}
                />
              </ThemedView>
            );
          }}
        />
      )}
    </ThemedView>
  );
}
