import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Label, { LabelProps } from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import Card from "@/presentation/theme/components/card";

interface InventoryItemCardProps {
  item: InventoryItem;
  canManage?: boolean;
  onPress?: (item: InventoryItem) => void;
  /** For lists that span categories: says where each item is. */
  showCategory?: boolean;
  onOptionsPress?: (item: InventoryItem) => void;
  onAdjustPress?: (item: InventoryItem) => void;
  onReactivatePress?: (item: InventoryItem) => void;
  selectionMode?: boolean;
  selected?: boolean;
  /** Highlights the item open in the detail pane (tablet). */
  active?: boolean;
  onLongPress?: (item: InventoryItem) => void;
  onToggleSelect?: (item: InventoryItem) => void;
}

export const INVENTORY_STATUS_STYLES: Record<
  InventoryStockStatus,
  {
    icon: IconName;
    color: string;
    badgeBg: string;
    badgeText: string;
    numberColor?: string;
  }
> = {
  critical: {
    icon: "circle-alert",
    color: "red-500",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    numberColor: "text-red-600",
  },
  low: {
    icon: "trending-down",
    color: "orange-500",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
    numberColor: "text-orange-600",
  },
  optimal: {
    icon: "circle-check",
    color: "emerald-500",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  noMinimum: {
    icon: "circle-dashed",
    color: "gray-400",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
  inactive: {
    icon: "archive",
    color: "gray-400",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
};

// Like the menu's variant stock: only what needs attention gets a color.
const QUANTITY_LABEL_COLOR: Record<InventoryStockStatus, LabelProps["color"]> =
  {
    critical: "error",
    low: "warning",
    optimal: "default",
    noMinimum: "default",
    inactive: "default",
  };

// Stock is stored with 3 decimals; trims float noise like 1.4999999.
const formatQuantity = (quantity: number) => Number(quantity.toFixed(3));

/** An insumo laid out like the menu's product card: name, then its stock. */
export default function InventoryItemCard({
  item,
  onPress,
  showCategory = false,
  selectionMode,
  selected,
  active,
  onLongPress,
  onToggleSelect,
}: InventoryItemCardProps) {
  const { t } = useTranslation("inventory");
  const status = getInventoryStockStatus(item);
  const isInactive = status === "inactive";
  const withUnit = (quantity: number) =>
    t("quantityWithUnit", {
      quantity: formatQuantity(quantity),
      unit: t(`units.${item.unit}`, { count: quantity }),
    });
  const hasMinimum = !!item.minimumQuantity && item.minimumQuantity > 0;

  return (
    <Card
      disabled={!onPress && !selectionMode}
      onPress={() => (selectionMode ? onToggleSelect?.(item) : onPress?.(item))}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      style={tw.style("px-4 py-3", active && !selectionMode && "bg-secondary")}
      containerStyle={selected && tw`bg-secondary`}
    >
      <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
        {selectionMode && (
          <Icon
            name={selected ? "circle-check" : "circle"}
            size={22}
            color={selected ? tw.color("primary") : tw.color("gray-400")}
          />
        )}
        <ThemedView style={tw`flex-1 gap-2 bg-transparent`}>
          <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
            <ThemedText
              type="body1"
              style={tw.style("flex-1", isInactive && "text-gray-500")}
              numberOfLines={2}
            >
              {item.name}
            </ThemedText>
            {isInactive && <Label text={t("status.inactive")} size="small" />}
          </ThemedView>
          {showCategory && (
            <ThemedText
              type="small"
              style={tw`-mt-1.5 text-gray-500`}
              numberOfLines={1}
            >
              {item.category?.name ?? t("categories.none")}
            </ThemedText>
          )}
          <ThemedView
            style={tw`flex-row items-center gap-2 min-h-6 bg-transparent`}
          >
            <ThemedText
              type="body2"
              style={tw`flex-1 text-gray-500`}
              numberOfLines={1}
            >
              {hasMinimum
                ? `${t("minimumLabel")} ${withUnit(item.minimumQuantity as number)}`
                : ""}
            </ThemedText>
            <Label
              text={withUnit(item.quantity)}
              leftIcon="package"
              color={QUANTITY_LABEL_COLOR[status]}
              size="small"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Card>
  );
}
