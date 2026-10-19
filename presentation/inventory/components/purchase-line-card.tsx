import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

interface PurchaseLineCardProps {
  item: InventoryItem;
  quantity: number;
  /** When set, shows "stock before → after" for the item. */
  stockPreview?: { before: number; after: number };
  onPress: () => void;
  onRemove: () => void;
}

/**
 * One received item in a purchase — the same flat swipe-to-remove row as
 * NewOrderDetailCard, but with a decimal quantity in the item's unit.
 */
export default function PurchaseLineCard({
  item,
  quantity,
  stockPreview,
  onPress,
  onRemove,
}: PurchaseLineCardProps) {
  const { t } = useTranslation("inventory");
  const unit = t(`units.${item.unit}`);

  return (
    <Swipeable
      renderRightActions={() => (
        <ThemedView style={tw`justify-center items-center pl-4`}>
          <IconButton
            icon="trash"
            onPress={onRemove}
            variant="destructive"
            size={26}
            accessibilityLabel={t("common:actions.remove")}
          />
        </ThemedView>
      )}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) =>
          tw.style("flex-row items-start gap-4 py-2", pressed && "opacity-70")
        }
      >
        <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
          <ThemedText type="body1" numberOfLines={2}>
            {item.name}
          </ThemedText>
          {stockPreview && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("purchases.stockChange", {
                before: Number(stockPreview.before.toFixed(3)),
                after: Number(stockPreview.after.toFixed(3)),
                unit,
              })}
            </ThemedText>
          )}
        </ThemedView>
        <Label
          text={`+${t("quantityWithUnit", { quantity, unit })}`}
          color="success"
          size="small"
        />
      </Pressable>
    </Swipeable>
  );
}
