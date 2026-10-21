import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";

interface InventoryItemRowProps {
  item: InventoryItem;
  selectionMode?: boolean;
  selected?: boolean;
}

const QUANTITY_TEXT_COLOR: Record<InventoryStockStatus, string> = {
  critical: "text-red-600",
  low: "text-orange-600",
  optimal: "text-emerald-600",
  noMinimum: "text-on-surface-variant",
  inactive: "text-gray-500",
};

/** Content of an inventory item row in a GroupedList: name and stock quantity. */
export default function InventoryItemRow({
  item,
  selectionMode,
  selected,
}: InventoryItemRowProps) {
  const { t } = useTranslation("inventory");
  const status = getInventoryStockStatus(item);
  const quantityText = t("quantityWithUnit", {
    quantity: item.quantity,
    unit: t(`units.${item.unit}`, { count: item.quantity }),
  });

  return (
    <ThemedView
      style={tw.style(
        "flex-row items-center gap-3 bg-transparent",
        status === "inactive" && "opacity-50",
      )}
    >
      {selectionMode && (
        <Icon
          name={selected ? "circle-check" : "circle"}
          size={22}
          color={selected ? tw.color("primary") : tw.color("gray-400")}
        />
      )}
      <ThemedText
        type="body1"
        numberOfLines={2}
        style={[{ fontFamily: typography.medium }, tw`flex-1`]}
      >
        {item.name}
      </ThemedText>
      <ThemedText
        type="body2"
        // The color alone carries the stock status, so say it out loud too
        accessibilityLabel={`${quantityText}, ${t(`status.${status}`)}`}
        style={[
          { fontFamily: typography.medium },
          tw`${QUANTITY_TEXT_COLOR[status]}`,
        ]}
      >
        {quantityText}
      </ThemedText>
    </ThemedView>
  );
}
