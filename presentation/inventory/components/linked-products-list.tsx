import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import IconButton from "@/presentation/theme/components/icon-button";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

interface LinkedProductsListProps {
  lines: ProductOptionInventoryItem[];
  unit: string;
  onAddPress?: () => void;
}

export default function LinkedProductsList({
  lines,
  unit,
  onAddPress,
}: LinkedProductsListProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`gap-3 bg-transparent mt-4`}>
      <ThemedView
        style={tw`flex-row items-center justify-between bg-transparent px-1`}
      >
        <ThemedText type="body1">{t("detail.linkedProducts")}</ThemedText>
        {onAddPress && (
          <IconButton
            icon="add-outline"
            variant="secondary"
            size={20}
            onPress={onAddPress}
            style={tw`-mr-2 p-2`}
            accessibilityLabel={t("detail.linkToProduct")}
          />
        )}
      </ThemedView>

      {lines.length === 0 ? (
        <ThemedView style={tw`bg-white rounded-3xl p-6 shadow-xs`}>
          <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
            {t("detail.noLinkedProducts")}
          </ThemedText>
        </ThemedView>
      ) : (
        <GroupedList
          data={lines}
          keyExtractor={(line) => line.id}
          onItemPress={(line) =>
            router.push({
              pathname: "/(profile)/menu-product-option-recipe",
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
              .join(" ");

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
                    {t("quantityWithUnit", { quantity: line.quantity, unit })}
                  </ThemedText>
                </ThemedView>
                <Ionicons
                  name="chevron-forward"
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
