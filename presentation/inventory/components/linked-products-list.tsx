import { Pressable } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";
import { openVariant } from "@/presentation/menu-management/components/variant-stock-section";

interface LinkedProductsListProps {
  lines: ProductOptionInventoryItem[];
  unit: InventoryUnit;
  onAddPress?: () => void;
}

/** The variants that use the item, as a card like the area's printers. */
export default function LinkedProductsList({
  lines,
  unit,
  onAddPress,
}: LinkedProductsListProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`gap-3 mt-4`}>
      <DetailSectionTitle
        title={t("detail.linkedProducts")}
        action={
          // With none yet, the button sits in the card instead
          onAddPress &&
          lines.length > 0 && (
            <Button
              label={t("common:actions.add")}
              accessibilityLabel={t("detail.linkToProduct")}
              leftIcon="plus"
              variant="outline"
              size="extra-small"
              onPress={onAddPress}
            />
          )
        }
      />
      <DetailCard style={tw`py-2`}>
        {lines.length ? (
          <ThemedView>
            {lines.map((line, index) => {
              const label = [
                line.productOption?.product?.name,
                line.productOption?.name,
              ]
                .filter(Boolean)
                // "Gaseosa 3L · Normal": product and variant stay distinct
                .join(" · ");

              return (
                <Pressable
                  key={line.id}
                  onPress={() => openVariant(Number(line.productOptionId))}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    tw`flex-row items-center gap-3 py-3`,
                    index < lines.length - 1 && tw`border-b border-divider`,
                    pressed && tw`opacity-60`,
                  ]}
                >
                  <ThemedText style={tw`flex-1`} numberOfLines={1}>
                    {label || t("detail.unknownProduct")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("quantityWithUnit", {
                      quantity: line.quantity,
                      unit: t(`units.${unit}`, { count: line.quantity }),
                    })}
                  </ThemedText>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={tw.color("gray-400")}
                  />
                </Pressable>
              );
            })}
          </ThemedView>
        ) : (
          <ThemedView style={tw`items-center gap-3 py-4`}>
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("detail.noLinkedProducts")}
            </ThemedText>
            {onAddPress && (
              <Button
                label={t("detail.linkToProduct")}
                leftIcon="plus"
                variant="outline"
                size="small"
                onPress={onAddPress}
              />
            )}
          </ThemedView>
        )}
      </DetailCard>
    </ThemedView>
  );
}
