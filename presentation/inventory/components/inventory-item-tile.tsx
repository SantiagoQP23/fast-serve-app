import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";

interface InventoryItemTileProps {
  item: InventoryItem;
  onPress: (item: InventoryItem) => void;
  onLongPress?: (item: InventoryItem) => void;
  selectionMode?: boolean;
  selected?: boolean;
  /** Highlights the item open in the detail pane (tablet). */
  active?: boolean;
}

const QUANTITY_TEXT_COLOR: Record<InventoryStockStatus, string> = {
  critical: "text-red-600",
  low: "text-orange-600",
  optimal: "text-emerald-600",
  noMinimum: "text-on-surface-variant",
  inactive: "text-gray-500",
};

/** Inventory item card for the items grid: name and stock quantity. */
export default function InventoryItemTile({
  item,
  onPress,
  onLongPress,
  selectionMode,
  selected,
  active,
}: InventoryItemTileProps) {
  const { t } = useTranslation("inventory");
  const status = getInventoryStockStatus(item);
  const quantityText = t("quantityWithUnit", {
    quantity: item.quantity,
    unit: t(`units.${item.unit}`, { count: item.quantity }),
  });
  const highlighted = selectionMode ? selected : active;

  return (
    <Card
      variant={highlighted ? "outline" : "default"}
      onPress={() => onPress(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      containerStyle={tw.style(
        "flex-1",
        highlighted && "bg-secondary",
        status === "inactive" && "opacity-50",
      )}
      style={tw`flex-1 p-4 gap-3 justify-between`}
    >
      <ThemedView style={tw`flex-row items-start gap-2 bg-transparent`}>
        <ThemedText
          type="body1"
          numberOfLines={2}
          style={[{ fontFamily: typography.medium }, tw`flex-1`]}
        >
          {item.name}
        </ThemedText>
        {selectionMode && (
          <Icon
            name={selected ? "circle-check" : "circle"}
            size={20}
            color={selected ? tw.color("primary") : tw.color("gray-400")}
          />
        )}
      </ThemedView>
      <ThemedText
        type="body2"
        // The color alone carries the stock status, so say it out loud too
        accessibilityLabel={`${quantityText}, ${t(`status.${status}`)}`}
        style={[
          { fontFamily: typography.semibold },
          tw`${QUANTITY_TEXT_COLOR[status]}`,
        ]}
      >
        {quantityText}
      </ThemedText>
    </Card>
  );
}
