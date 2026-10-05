import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
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
 * One received item in a purchase — same swipe-to-remove card as
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
        <ThemedView style={tw`justify-center items-center px-4`}>
          <IconButton
            icon="trash-outline"
            onPress={onRemove}
            variant="secondary"
            size={26}
          />
        </ThemedView>
      )}
    >
      <Card onPress={onPress}>
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <ThemedView
            style={tw`flex-row bg-transparent justify-between items-start gap-2`}
          >
            <ThemedText type="h4" style={tw`flex-1`} numberOfLines={2}>
              {item.name}
            </ThemedText>
            <Label
              text={`+${t("quantityWithUnit", { quantity, unit })}`}
              color="success"
              size="small"
            />
          </ThemedView>
          {stockPreview && (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("purchases.stockChange", {
                before: Number(stockPreview.before.toFixed(3)),
                after: Number(stockPreview.after.toFixed(3)),
                unit,
              })}
            </ThemedText>
          )}
        </ThemedView>
      </Card>
    </Swipeable>
  );
}
